#!/usr/bin/env node
/**
 * Extract embedded product photos from supplier Excel order books
 * (Rodco Beyond, CRS / China Racing Supply, Mastodon dealer order books...)
 * and name them by the part number on the same row.
 *
 * Supplier .xlsx files carry their product photos as images anchored to
 * spreadsheet rows. This tool unzips each workbook, reads the drawing
 * anchors (xl/drawings/*.xml) to learn which row every image sits on,
 * reads that row's part-number cell, and writes the image out as
 * <workbook>__<part-number>.<ext>.
 *
 * NOTE: runs anywhere Node 18+ and `unzip` exist (macOS out of the box).
 * The rebuild sandbox cannot fetch the Drive files itself — download the
 * supplier .xlsx files from Google Drive first, then:
 *
 *   node scripts/extract-supplier-images.mjs "Rodco 13.05.2026.xlsx" "CRS 15.07.2026.xlsx" \
 *        --missing reports/handover/site_products_without_images.csv \
 *        --out supplier-images
 *
 * Google Sheets versions (e.g. AAM_Mastodon_Dealer_Order_Book): open in
 * Drive → File → Download → Microsoft Excel (.xlsx) first; embedded images
 * survive the export.
 *
 * Options:
 *   --out <dir>       output directory (default ./supplier-images)
 *   --missing <csv>   site_products_without_images.csv (SKU,Name); when given,
 *                     each extracted image is matched against those SKUs
 *                     (exact → alphanumeric → numeric-core) and matches are
 *                     ALSO copied to <out>/matched/<site-sku>.<ext>
 *
 * Outputs <out>/image-map.csv: workbook, sheet, row, part number,
 * description, image file, matched site SKU + match tier (if --missing).
 * Review matched/ by eye before loading anything into the site — numeric-core
 * matches are suggestions, not confirmations.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const files = [];
let outDir = "supplier-images";
let missingCsv = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out") outDir = args[++i];
  else if (args[i] === "--missing") missingCsv = args[++i];
  else files.push(args[i]);
}
if (files.length === 0) {
  console.error("Usage: node scripts/extract-supplier-images.mjs <book.xlsx>... [--missing <csv>] [--out <dir>]");
  process.exit(1);
}

// ---------- tiny helpers (regex XML parsing is fine for OOXML's rigid shape) ----------

const readXml = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");
const unescapeXml = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const sanitize = (s) => s.trim().replace(/[^\w.()+-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
const colLetters = (ref) => ref.replace(/\d+$/, "");
const colIndex = (letters) => [...letters].reduce((n, c) => n * 26 + (c.charCodeAt(0) - 64), 0) - 1;

function parseCsvLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const csvCell = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

// SKU normalisation tiers for matching supplier part numbers to site SKUs.
const alnum = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const numericCore = (s) => {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 4 ? digits : null; // short cores collide too easily
};

// ---------- load the missing-SKU list ----------

const missing = []; // { sku, name, alnum, core }
if (missingCsv) {
  const lines = fs.readFileSync(missingCsv, "utf8").split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines.slice(1)) {
    const [sku, name] = parseCsvLine(line);
    if (sku) missing.push({ sku: sku.trim(), name: (name ?? "").trim(), alnum: alnum(sku), core: numericCore(sku) });
  }
  console.log(`${missing.length} site SKUs without images loaded from ${missingCsv}`);
}

function matchMissing(part) {
  if (!part) return null;
  const up = part.trim().toUpperCase();
  for (const m of missing) if (m.sku.toUpperCase() === up) return { ...m, tier: "exact" };
  const a = alnum(part);
  for (const m of missing) if (m.alnum && m.alnum === a) return { ...m, tier: "alphanumeric" };
  const core = numericCore(part);
  if (core) for (const m of missing) if (m.core && m.core === core) return { ...m, tier: "numeric-core" };
  return null;
}

// ---------- workbook walker ----------

fs.mkdirSync(outDir, { recursive: true });
if (missing.length) fs.mkdirSync(path.join(outDir, "matched"), { recursive: true });
const mapRows = [["workbook", "sheet", "row", "part_number", "description", "image_file", "matched_site_sku", "match_tier"]];
let totalImages = 0, totalMatched = 0;

for (const file of files) {
  if (!fs.existsSync(file)) { console.error(`skip (not found): ${file}`); continue; }
  const bookName = sanitize(path.basename(file).replace(/\.xlsx?$/i, ""));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "xlsx-"));
  try {
    execFileSync("unzip", ["-o", "-qq", file, "-d", tmp]);
  } catch {
    console.error(`skip (not a readable .xlsx zip): ${file}`);
    continue;
  }

  // shared strings
  const sstXml = readXml(path.join(tmp, "xl", "sharedStrings.xml"));
  const shared = [...sstXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    unescapeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );

  // sheet name -> file, via workbook.xml + its rels
  const wbXml = readXml(path.join(tmp, "xl", "workbook.xml"));
  const wbRels = readXml(path.join(tmp, "xl", "_rels", "workbook.xml.rels"));
  const relTarget = {};
  for (const m of wbRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) relTarget[m[1]] = m[2];
  const sheets = [...wbXml.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => ({
    name: unescapeXml(m[1]),
    file: path.join(tmp, "xl", relTarget[m[2]]?.replace(/^\//, "") ?? ""),
  }));

  for (const sheet of sheets) {
    const sheetXml = readXml(sheet.file);
    if (!sheetXml) continue;

    // cells: row -> col -> text
    const cells = {};
    for (const rm of sheetXml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const rowNum = +rm[1];
      const rowBody = rm[2].replace(/<c\s[^>]*\/>/g, ""); // drop empty self-closing cells
      for (const cm of rowBody.matchAll(/<c\s([^>]*)>([\s\S]*?)<\/c>/g)) {
        const [, attrs, inner] = cm;
        const refM = attrs.match(/r="([A-Z]+)\d+"/);
        if (!refM) continue;
        const colRef = refM[1];
        const type = attrs.match(/(?:^|\s)t="([^"]*)"/)?.[1];
        let text = "";
        if (type === "s") {
          const v = inner.match(/<v>(\d+)<\/v>/);
          if (v) text = shared[+v[1]] ?? "";
        } else if (type === "inlineStr") {
          text = unescapeXml([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""));
        } else {
          const v = inner.match(/<v>([\s\S]*?)<\/v>/);
          if (v) text = unescapeXml(v[1]);
        }
        if (text) (cells[rowNum] ??= {})[colIndex(colLetters(colRef))] = text;
      }
    }

    // locate part-number + description columns from the header rows
    let partCol = null, descCol = null;
    outer: for (const rowNum of Object.keys(cells).map(Number).sort((a, b) => a - b).slice(0, 30)) {
      for (const [col, text] of Object.entries(cells[rowNum])) {
        const t = text.trim().toLowerCase();
        if (partCol === null && /^(part\s*(no|#|number)?\.?|sku|item\s*(no|number)|part\s*#)$/.test(t)) partCol = +col;
        if (descCol === null && /^(description|item\s*name|product)$/.test(t)) descCol = +col;
      }
      if (partCol !== null) break outer;
    }
    if (partCol === null) {
      // fallback: the column whose values most often look like part numbers
      const score = {};
      for (const row of Object.values(cells))
        for (const [col, text] of Object.entries(row))
          if (/^[A-Z0-9][A-Z0-9/.-]{3,}$/i.test(text.trim()) && /\d/.test(text)) score[col] = (score[col] ?? 0) + 1;
      const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] >= 3) partCol = +best[0];
    }

    // drawing anchors: image -> row
    const sheetRels = readXml(path.join(path.dirname(sheet.file), "_rels", path.basename(sheet.file) + ".rels"));
    const drawingRel = sheetRels.match(/<Relationship[^>]*Type="[^"]*\/drawing"[^>]*Target="([^"]+)"/);
    if (!drawingRel) continue;
    const drawingPath = path.resolve(path.dirname(sheet.file), drawingRel[1]);
    const drawingXml = readXml(drawingPath);
    const drawingRels = readXml(path.join(path.dirname(drawingPath), "_rels", path.basename(drawingPath) + ".rels"));
    const mediaByRel = {};
    for (const m of drawingRels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g))
      mediaByRel[m[1]] = path.resolve(path.dirname(drawingPath), m[2]);

    const anchors = [...drawingXml.matchAll(
      /<xdr:(?:twoCellAnchor|oneCellAnchor)[^>]*>[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g,
    )];
    for (const [anchor] of anchors) {
      const rowM = anchor.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
      const embedM = anchor.match(/r:embed="([^"]+)"/);
      if (!rowM || !embedM) continue;
      const excelRow = +rowM[1] + 1; // anchors are 0-based
      const media = mediaByRel[embedM[1]];
      if (!media || !fs.existsSync(media)) continue;

      // photo cell anchors are often a row or two off the text row — look near
      let part = "", desc = "";
      for (const r of [excelRow, excelRow + 1, excelRow - 1]) {
        if (partCol !== null && cells[r]?.[partCol]) { part = cells[r][partCol]; desc = descCol !== null ? cells[r][descCol] ?? "" : ""; break; }
      }

      const ext = path.extname(media).toLowerCase() || ".png";
      const base = part ? `${bookName}__${sanitize(part)}` : `${bookName}__${sanitize(sheet.name)}-row${excelRow}`;
      let outFile = path.join(outDir, base + ext);
      for (let n = 2; fs.existsSync(outFile); n++) outFile = path.join(outDir, `${base}-${n}${ext}`);
      fs.copyFileSync(media, outFile);
      totalImages++;

      const match = matchMissing(part);
      if (match) {
        let matchedFile = path.join(outDir, "matched", sanitize(match.sku) + ext);
        for (let n = 2; fs.existsSync(matchedFile); n++) matchedFile = path.join(outDir, "matched", `${sanitize(match.sku)}-${n}${ext}`);
        fs.copyFileSync(media, matchedFile);
        totalMatched++;
      }
      mapRows.push([path.basename(file), sheet.name, String(excelRow), part, desc, path.basename(outFile), match?.sku ?? "", match?.tier ?? ""]);
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${path.basename(file)}: done`);
}

fs.writeFileSync(path.join(outDir, "image-map.csv"), mapRows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
console.log(`\n${totalImages} images extracted to ${outDir}/`);
if (missing.length) console.log(`${totalMatched} matched to site SKUs without photos -> ${outDir}/matched/ (verify visually before use)`);
console.log(`Map: ${path.join(outDir, "image-map.csv")}`);
