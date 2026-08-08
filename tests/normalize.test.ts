import { describe, expect, it } from "vitest";
import {
  dedupeProducts, detectEngineFamilies, parsePriceToCents, qualityCheck, slugify, stripHtml,
  NormalizedProduct,
} from "../scripts/lib/normalize";

const base: NormalizedProduct = {
  sourceType: "WOO_IMPORT",
  slug: "test-product",
  name: "Test Product",
  sku: "TP-1",
  regularPriceCents: 10000,
  description: "A sufficiently long description for the small block chevy 350 engines we all know and love around here.",
  categories: ["Carburettors"],
  brand: "Holley",
  images: [{ url: "https://example.com/x.jpg" }],
};

describe("importer normalisation", () => {
  it("slugify produces url-safe slugs", () => {
    expect(slugify("Edelbrock Performer 600 CFM — Manual Choke!")).toBe("edelbrock-performer-600-cfm-manual-choke");
    expect(slugify("A & B")).toBe("a-and-b");
  });

  it("parsePriceToCents handles currency strings", () => {
    expect(parsePriceToCents("R8,799.99")).toBe(879999);
    expect(parsePriceToCents("8799.99")).toBe(879999);
    expect(parsePriceToCents(100)).toBe(10000);
    expect(parsePriceToCents("")).toBeUndefined();
    expect(parsePriceToCents("free")).toBeUndefined();
  });

  it("stripHtml removes markup and decodes entities", () => {
    expect(stripHtml("<p>Hello <strong>world</strong> &amp; friends</p>")).toBe("Hello world & friends");
    expect(stripHtml("<ul><li>one</li><li>two</li></ul>")).toContain("• one");
  });

  it("dedupes by SKU then by name", () => {
    const { kept, duplicates } = dedupeProducts([
      base,
      { ...base, slug: "other-slug", name: "Different Name" }, // same SKU
      { ...base, slug: "third", sku: undefined },              // same name, no SKU
      { ...base, slug: "unique", sku: "TP-2", name: "Unique" },
    ]);
    expect(kept.map((p) => p.slug)).toEqual(["test-product", "unique"]);
    expect(duplicates).toHaveLength(2);
  });

  it("flags weak data in the quality report", () => {
    const issues = qualityCheck([{ ...base, sku: undefined, images: [], description: "short", regularPriceCents: undefined }]);
    const kinds = issues.map((i) => i.issue);
    expect(kinds).toContain("missing SKU");
    expect(kinds).toContain("no images");
    expect(kinds).toContain("missing price");
    expect(kinds).toContain("weak/missing description");
  });

  it("detects engine families from text for fitment hints", () => {
    expect(detectEngineFamilies("Performer EPS intake for 1955-86 small-block chev 350")).toContain("small-block-chevy");
    expect(detectEngineFamilies("Fits Ford 289/302 Windsor")).toContain("ford-windsor");
    expect(detectEngineFamilies("Universal chrome air cleaner")).toHaveLength(0);
  });
});
