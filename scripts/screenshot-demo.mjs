// Visual-review capture: runs the customer journey against a local production
// server (npm run build && npm start) and writes screenshots to data/screenshots.
// Demo cart/garage cookies are set so fitment badges and basket state render.
// Usage: node scripts/screenshot-demo.mjs

import { chromium } from "playwright";
import crypto from "node:crypto";
import fs from "node:fs";

const OUT = "./data/screenshots";
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";

const garage = encodeURIComponent(JSON.stringify({
  vehicles: [{
    id: "v1", makeSlug: "ford", makeName: "Ford",
    modelSlug: "mustang-1964-1973", modelName: "Mustang", year: 1967,
    engineFamilySlug: "ford-windsor", engineFamilyName: "Ford Windsor (Small Block)",
  }],
  activeId: "v1",
}));
const cart = encodeURIComponent(JSON.stringify([
  { productId: "cmsog5o2t00sy7d7sto3e7jja", qty: 1 },
  { productId: "cmsog5mdx009h7d7suusjgcog", qty: 2 },
]));
const adminToken = crypto.createHmac("sha256", "dev-session-secret-change-me").update("aam-admin-session").digest("hex");

const cookies = [
  { name: "aam_garage", value: garage, url: BASE },
  { name: "aam_cart", value: cart, url: BASE },
  { name: "aam_admin", value: adminToken, url: BASE },
  { name: "aam_consent", value: "denied", url: BASE }, // hide consent banner in shots
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function shoot(name, path, { fullPage = false, mobile = false, before } = {}) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mobile ? 2 : 1,
  });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  if (before) await before(page);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 60, fullPage });
  await ctx.close();
  console.log("shot", name);
}

await shoot("01-home", "/", { fullPage: true });
await shoot("02-shop", "/shop?category=engines-components");
await shoot("03-search", "/search?q=351+windsor+bearing");
await shoot("04-pdp", "/products/mastodon-performer-intake-manifold-eps-sbcblock", { fullPage: true });
await shoot("05-garage", "/garage");
await shoot("06-basket", "/basket");
await shoot("07-checkout", "/checkout");
await shoot("08-compare", "/compare?p=mastodon-performer-intake-manifold-eps-sbcblock,enginetech-sbc-main-bearing-large-journal-0-40mm");
await shoot("09-assistant", "/products/mastodon-performer-intake-manifold-eps-sbcblock", {
  before: async (page) => {
    await page.getByRole("button", { name: /ask the ai specialist/i }).first().click();
    await page.getByRole("textbox", { name: /message the ai specialist/i }).waitFor();
    // widget auto-sends the prefilled product question; wait for grounded reply cards
    await page.waitForSelector("section[aria-label*='specialist'] a[href^='/products/']", { timeout: 20000 });
  },
});
await shoot("10-admin", "/admin");
await shoot("11-mobile-home", "/", { mobile: true });
await shoot("12-mobile-pdp", "/products/enginetech-sbc-main-bearing-large-journal-0-40mm", { mobile: true });

await browser.close();
console.log("done");
