#!/usr/bin/env node
/**
 * Cloud launch driver — runs inside GitHub Actions (open internet).
 *
 *   node scripts/launch-cloud.mjs infra    # Supabase: find project, reset DB password, emit DATABASE_URL
 *   node scripts/launch-cloud.mjs deploy   # Vercel: ensure project, set env vars, deploy main, emit URL
 *
 * Requires env: SUPABASE_TOKEN, VERCEL_TOKEN.
 * Writes DATABASE_URL / DIRECT_DATABASE_URL / DEPLOY_URL to $GITHUB_ENV so
 * later workflow steps can use them without ever printing secrets to logs.
 */

import crypto from "node:crypto";
import fs from "node:fs";

const phase = process.argv[2];
const SUPABASE_TOKEN = process.env.SUPABASE_TOKEN;
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = "aam-production";
const VERCEL_PROJECT = "aam-website";
const REPO = "Drikus1985/reimagined-aam-website-";

const ghEnv = (k, v) => fs.appendFileSync(process.env.GITHUB_ENV ?? "/dev/null", `${k}=${v}\n`);
const mask = (v) => console.log(`::add-mask::${v}`);
const die = (m) => { console.error(`FAILED: ${m}`); process.exit(1); };

async function api(base, token, method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}
const supa = (m, p, b) => api("https://api.supabase.com", SUPABASE_TOKEN, m, p, b);
const verc = (m, p, b) => api("https://api.vercel.com", VERCEL_TOKEN, m, p, b);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const genSecret = (n = 32) => crypto.randomBytes(n * 2).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, n);

async function infra() {
  if (!SUPABASE_TOKEN) die("SUPABASE_TOKEN secret is not set");
  const projects = await supa("GET", "/v1/projects");
  if (projects.status !== 200) die(`list projects: ${projects.status} ${JSON.stringify(projects.json).slice(0, 200)}`);
  const proj = projects.json.find((p) => p.name === PROJECT_NAME);
  if (!proj) die(`Supabase project "${PROJECT_NAME}" not found`);
  const ref = proj.id;
  console.log(`Supabase project: ${ref} (${proj.region}, ${proj.status})`);

  // wait until healthy
  for (let i = 0; i < 30; i++) {
    const p = await supa("GET", `/v1/projects/${ref}`);
    if (p.json?.status === "ACTIVE_HEALTHY") break;
    console.log(`  waiting for project to be healthy (${p.json?.status})...`);
    await sleep(10_000);
  }

  // reset the database password so this run owns the credentials
  const password = genSecret(32);
  mask(password);
  let ok = false;
  for (const [method, path] of [
    ["PATCH", `/v1/projects/${ref}/database/password`],
    ["POST", `/v1/projects/${ref}/database/password`],
  ]) {
    const r = await supa(method, path, { password });
    if (r.status >= 200 && r.status < 300) { ok = true; break; }
    console.log(`  password reset via ${method} ${path}: ${r.status}`);
  }
  if (!ok) die("could not reset database password via management API");
  console.log("Database password reset.");
  await sleep(5_000);

  const direct = `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;

  // ask the API for the real pooler host rather than guessing the pattern
  let poolerHost = `aws-0-${proj.region}.pooler.supabase.com`;
  let poolerPort = 6543;
  const poolCfg = await supa("GET", `/v1/projects/${ref}/config/database/pooler`);
  if (poolCfg.status === 200) {
    const cfg = Array.isArray(poolCfg.json)
      ? (poolCfg.json.find((c) => c.database_type === "PRIMARY") ?? poolCfg.json[0])
      : poolCfg.json;
    const cs = cfg?.connection_string ?? cfg?.connectionString;
    if (cs) {
      const m = cs.match(/@([^:/]+):(\d+)/);
      if (m) { poolerHost = m[1]; poolerPort = Number(m[2]); }
    } else if (cfg?.db_host) {
      poolerHost = cfg.db_host;
      poolerPort = cfg.db_port ?? poolerPort;
    }
    console.log(`Pooler endpoint from API: ${poolerHost}:${poolerPort}`);
  } else {
    console.log(`Pooler config lookup returned ${poolCfg.status}; using fallback host ${poolerHost}`);
  }
  const pooler = `postgresql://postgres.${ref}:${password}@${poolerHost}:${poolerPort}/postgres?pgbouncer=true&connection_limit=1`;
  mask(direct); mask(pooler);
  ghEnv("DATABASE_URL", direct);
  ghEnv("DIRECT_DATABASE_URL", direct);
  ghEnv("POOLER_DATABASE_URL", pooler);
  ghEnv("SUPABASE_REF", ref);
  ghEnv("SUPABASE_REGION", proj.region);
  console.log("Connection strings exported to GITHUB_ENV (masked).");
}

async function deploy() {
  if (!VERCEL_TOKEN) die("VERCEL_TOKEN secret is not set");
  const pooler = process.env.POOLER_DATABASE_URL;
  if (!pooler) die("POOLER_DATABASE_URL missing — run the infra phase first");

  // find or create the project
  let projRes = await verc("GET", `/v9/projects/${VERCEL_PROJECT}`);
  if (projRes.status === 404) {
    console.log("Creating Vercel project linked to the GitHub repo...");
    projRes = await verc("POST", "/v11/projects", {
      name: VERCEL_PROJECT,
      framework: "nextjs",
      gitRepository: { type: "github", repo: REPO },
    });
    if (projRes.status >= 300)
      die(`create project: ${projRes.status} ${JSON.stringify(projRes.json).slice(0, 300)} — if this mentions repo access, open https://github.com/settings/installations and give the Vercel app access to ${REPO}`);
  } else if (projRes.status >= 300) {
    die(`get project: ${projRes.status} ${JSON.stringify(projRes.json).slice(0, 200)}`);
  }
  const project = projRes.json;
  console.log(`Vercel project: ${project.id}`);

  // environment variables
  const adminPassword = process.env.ADMIN_PASSWORD_OVERRIDE || genSecret(20);
  const sessionSecret = genSecret(48);
  mask(adminPassword); mask(sessionSecret);
  const envs = [
    ["DATABASE_URL", pooler],
    ["NEXT_PUBLIC_SITE_URL", `https://${VERCEL_PROJECT}.vercel.app`],
    ["ADMIN_PASSWORD", adminPassword],
    ["SESSION_SECRET", sessionSecret],
    ["PAYFAST_SANDBOX", "true"],
    ["PAYFAST_MERCHANT_ID", "10000100"],
    ["PAYFAST_MERCHANT_KEY", "46f0cd694581a"],
    ["AI_PROVIDER", "mock"],
  ].map(([key, value]) => ({ key, value, type: "encrypted", target: ["production", "preview"] }));
  const envRes = await verc("POST", `/v10/projects/${project.id}/env?upsert=true`, envs);
  if (envRes.status >= 300) die(`set env vars: ${envRes.status} ${JSON.stringify(envRes.json).slice(0, 300)}`);
  console.log("Environment variables set (admin password is in Vercel > Settings > Environment Variables).");

  // deploy main
  const repoId = project.link?.repoId;
  if (!repoId) die("project has no linked repoId — link the GitHub repo in the Vercel dashboard");
  const dep = await verc("POST", "/v13/deployments", {
    name: VERCEL_PROJECT,
    project: project.id,
    target: "production",
    gitSource: { type: "github", repoId, ref: "main" },
  });
  if (dep.status >= 300) die(`create deployment: ${dep.status} ${JSON.stringify(dep.json).slice(0, 300)}`);
  const depId = dep.json.id;
  console.log(`Deployment started: ${depId}`);

  for (let i = 0; i < 60; i++) {
    await sleep(10_000);
    const d = await verc("GET", `/v13/deployments/${depId}`);
    const state = d.json?.readyState ?? d.json?.status;
    console.log(`  ${state}`);
    if (state === "READY") {
      const url = `https://${d.json.url}`;
      ghEnv("DEPLOY_URL", `https://${VERCEL_PROJECT}.vercel.app`);
      console.log(`DEPLOYED: ${url} (stable: https://${VERCEL_PROJECT}.vercel.app)`);
      return;
    }
    if (state === "ERROR" || state === "CANCELED") die(`deployment ${state} — check the Vercel dashboard build logs`);
  }
  die("deployment did not become READY within 10 minutes");
}

if (phase === "infra") await infra();
else if (phase === "deploy") await deploy();
else die(`unknown phase "${phase}" (use: infra | deploy)`);
