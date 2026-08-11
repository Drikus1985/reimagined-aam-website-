/**
 * Integration tests against the seeded PostgreSQL database.
 * Requires: DATABASE_URL reachable + `npx prisma migrate dev` + `npx tsx prisma/seed.ts`.
 */
import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/aam";
process.env.AI_PROVIDER = "mock";

import { searchCatalog, ensureIndex } from "@/lib/search";
import { priceCart } from "@/lib/cart";
import { groundAssistantText } from "@/lib/ai/grounding";
import { executeTool, ToolExecutionEffects } from "@/lib/ai/tools";
import { runAssistant } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { GarageVehicle } from "@/lib/fitment";

const mustang: GarageVehicle = {
  id: "t1", makeSlug: "ford", makeName: "Ford",
  modelSlug: "mustang-1964-1973", modelName: "Mustang", year: 1967,
  engineFamilySlug: "ford-windsor", engineFamilyName: "Ford Windsor",
};

function freshEffects(): ToolExecutionEffects {
  return { groundedSlugs: new Set(), proposal: null, escalation: null, leadCreated: false };
}

beforeAll(async () => {
  await ensureIndex(true);
});

describe("catalogue search", () => {
  it("finds SBC parts via the alias 'SBC'", async () => {
    const result = await searchCatalog({ query: "SBC intake manifold" });
    const products = await prisma.product.findMany({ where: { id: { in: result.ids.slice(0, 8) } } });
    expect(products.some((p) => p.slug.includes("intake"))).toBe(true);
  });

  it("tolerates misspellings (carburator)", async () => {
    const result = await searchCatalog({ query: "carburator" });
    expect(result.total).toBeGreaterThan(0);
  });

  it("finds by SKU", async () => {
    const result = await searchCatalog({ query: "BC296J040" });
    const first = await prisma.product.findUnique({ where: { id: result.ids[0] } });
    expect(first?.sku).toBe("BC296J040");
  });

  it("facet filters combine with search", async () => {
    const result = await searchCatalog({ query: "kit", filters: { brand: "enginetech" } });
    const products = await prisma.product.findMany({ where: { id: { in: result.ids } }, include: { brand: true } });
    expect(products.every((p) => p.brand?.slug === "enginetech")).toBe(true);
  });
});

describe("server-side cart validation", () => {
  it("re-prices lines from the DB and ignores client-side prices entirely", async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: "mastodon-throttle-return-springs-bracket-kit" } });
    const priced = await priceCart([{ productId: product.id, qty: 2 }]);
    expect(priced.lines[0].unitPriceCents).toBe(product.regularPriceCents);
    expect(priced.subtotalCents).toBe(product.regularPriceCents * 2);
  });

  it("caps quantity at available stock and reports the adjustment", async () => {
    const product = await prisma.product.findFirstOrThrow({ where: { stockStatus: "IN_STOCK", stockQty: { lte: 5, gt: 0 } } });
    const priced = await priceCart([{ productId: product.id, qty: 50 }]);
    expect(priced.lines[0].qty).toBe(product.stockQty);
    expect(priced.issues.length).toBeGreaterThan(0);
  });

  it("drops unknown product ids", async () => {
    const priced = await priceCart([{ productId: "nonexistent", qty: 1 }]);
    expect(priced.lines).toHaveLength(0);
    expect(priced.issues.length).toBe(1);
  });
});

describe("AI grounding guard", () => {
  it("strips fabricated product tokens from assistant text", async () => {
    const { text, products } = await groundAssistantText(
      "You need [product:totally-invented-part-9000] for this build.",
      new Set(["totally-invented-part-9000"]), // even when 'allowed', must exist in DB
      null,
    );
    expect(products).toHaveLength(0);
    expect(text).not.toContain("totally-invented-part-9000");
  });

  it("blocks real products that were never surfaced by catalogue tools (injected slugs)", async () => {
    const { products } = await groundAssistantText(
      "Try [product:mastodon-throttle-return-springs-bracket-kit]!",
      new Set(), // not grounded in this conversation
      null,
    );
    expect(products).toHaveLength(0);
  });

  it("resolves allowed, existing products with live price and fitment", async () => {
    const { text, products } = await groundAssistantText(
      "The [product:mastodon-throttle-return-springs-bracket-kit] is a solid choice.",
      new Set(["mastodon-throttle-return-springs-bracket-kit"]),
      mustang,
    );
    expect(products).toHaveLength(1);
    const db = await prisma.product.findUniqueOrThrow({ where: { slug: "mastodon-throttle-return-springs-bracket-kit" } });
    expect(products[0].priceCents).toBe(db.regularPriceCents);
    expect(text).toContain(db.name);
  });
});

describe("AI tool permissions", () => {
  it("propose_basket_additions rejects products not surfaced by catalogue tools", async () => {
    const effects = freshEffects();
    const result = JSON.parse(
      await executeTool(
        { id: "t", name: "propose_basket_additions", input: { items: [{ productSlug: "mastodon-throttle-return-springs-bracket-kit", qty: 1 }] } },
        { vehicle: null, cart: [] },
        effects,
      ),
    );
    expect(result.ok).toBe(false);
    expect(effects.proposal).toBeNull();
  });

  it("allows proposals for grounded products, but never mutates the basket", async () => {
    const effects = freshEffects();
    await executeTool({ id: "s", name: "search_products", input: { query: "throttle return springs" } }, { vehicle: null, cart: [] }, effects);
    const result = JSON.parse(
      await executeTool(
        { id: "t", name: "propose_basket_additions", input: { items: [{ productSlug: "mastodon-throttle-return-springs-bracket-kit", qty: 1 }] } },
        { vehicle: null, cart: [] },
        effects,
      ),
    );
    expect(result.ok).toBe(true);
    expect(effects.proposal?.items[0].productSlug).toBe("mastodon-throttle-return-springs-bracket-kit");
  });

  it("create_project_brief refuses without explicit consent", async () => {
    const effects = freshEffects();
    const result = JSON.parse(
      await executeTool(
        {
          id: "t", name: "create_project_brief",
          input: { type: "RESTORATION", name: "Test", email: "t@example.com", brief: { goal: "restore" }, consent: false },
        },
        { vehicle: null, cart: [] },
        effects,
      ),
    );
    expect(result.ok).toBe(false);
    expect(effects.leadCreated).toBe(false);
  });

  it("check_fitment never claims CONFIRMED without vehicle data", async () => {
    const effects = freshEffects();
    const result = JSON.parse(
      await executeTool(
        { id: "t", name: "check_fitment", input: { productSlug: "mastodon-performer-intake-manifold-eps-sbcblock" } },
        { vehicle: null, cart: [] },
        effects,
      ),
    );
    expect(result.status).toBe("UNKNOWN");
  });
});

describe("assistant end-to-end (mock provider)", () => {
  it("returns only grounded products with live prices", async () => {
    const result = await runAssistant(
      [{ role: "user", content: "I need a carburettor for my small block chevy" }],
      { vehicle: null, cart: [], page: { type: "test" } },
    );
    expect(result.products.length).toBeGreaterThan(0);
    for (const p of result.products) {
      const db = await prisma.product.findUnique({ where: { slug: p.slug } });
      expect(db).not.toBeNull();
      expect(p.priceCents).toBeGreaterThan(0);
    }
    expect(result.disclaimer).toBeTruthy();
  });

  it("escalates to a human on request, with a summary for handoff", async () => {
    const result = await runAssistant(
      [{ role: "user", content: "I want to talk to a human specialist please" }],
      { vehicle: null, cart: [], page: { type: "test" } },
    );
    expect(result.escalation.suggested).toBe(true);
    expect(result.escalation.summary).toBeTruthy();
  });

  it("finds nothing for fictional parts and does not invent products", async () => {
    const result = await runAssistant(
      [{ role: "user", content: "zzqxv flurblewidget notarealpartname" }],
      { vehicle: null, cart: [], page: { type: "test" } },
    );
    expect(result.products).toHaveLength(0);
    expect(result.text.toLowerCase()).toContain("couldn't find");
  });
});
