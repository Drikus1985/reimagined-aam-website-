import { prisma } from "../db";
import { searchCatalog } from "../search";
import { effectivePriceCents } from "../money";
import { verdictsForProducts, verdictForProduct } from "../catalog";
import { priceCart } from "../cart";
import { AIToolDefinition, AssistantContext, ToolCall } from "./types";
import { retrieveKnowledge } from "./retrieval";

/**
 * Catalogue tools available to the AI specialist. Every tool reads from the
 * live database — the assistant cannot invent products, prices or stock.
 * Basket changes are NEVER executed here: the assistant may only *propose*
 * additions (propose_basket_additions), which the client applies after
 * explicit customer confirmation.
 */

export const toolDefinitions: AIToolDefinition[] = [
  {
    name: "search_products",
    description:
      "Search the live product catalogue. Use for any product lookup — supports part numbers, abbreviations (SBC, BBC, 302), and category terms. Returns products with live price and stock. Only recommend products returned by this tool or get_product.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms, e.g. 'SBC intake manifold' or a SKU" },
        category: { type: "string", description: "Optional category slug filter" },
        inStockOnly: { type: "boolean" },
        limit: { type: "number", description: "Max results (default 6)" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_product",
    description:
      "Fetch full details for one product by slug or SKU: price, stock, specs, fitment records, required supporting parts, and related products.",
    inputSchema: {
      type: "object",
      properties: { slugOrSku: { type: "string" } },
      required: ["slugOrSku"],
      additionalProperties: false,
    },
  },
  {
    name: "check_fitment",
    description:
      "Check verified fitment of a product against the customer's selected vehicle. Returns one of: CONFIRMED, UNIVERSAL, POTENTIAL, NOT_COMPATIBLE, UNKNOWN. Never claim a fit is confirmed unless this tool says CONFIRMED.",
    inputSchema: {
      type: "object",
      properties: { productSlug: { type: "string" } },
      required: ["productSlug"],
      additionalProperties: false,
    },
  },
  {
    name: "review_basket",
    description:
      "Review the customer's current basket: live-priced lines plus flags for fitment-check and safety-critical items. Use to spot missing supporting parts or compatibility conflicts.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "search_knowledge",
    description:
      "Search approved workshop knowledge, technical articles and store policies. Use for technical guidance, delivery/returns questions and store information. Cite the article title when you use it.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_basket_additions",
    description:
      "Propose products to add to the customer's basket. This does NOT add anything — the customer sees the proposal and must confirm. Only include product slugs previously returned by search_products/get_product.",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              productSlug: { type: "string" },
              qty: { type: "number" },
              reason: { type: "string", description: "One-line reason for this item" },
            },
            required: ["productSlug", "qty"],
            additionalProperties: false,
          },
        },
        note: { type: "string" },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Flag this conversation for a human specialist (phone/WhatsApp/email handoff) when confidence is insufficient, when the question is safety-critical beyond verified data, or when the customer asks. Provide a concise summary of the conversation and what needs specialist input.",
    inputSchema: {
      type: "object",
      properties: {
        reason: { type: "string" },
        summary: { type: "string" },
      },
      required: ["reason", "summary"],
      additionalProperties: false,
    },
  },
  {
    name: "create_project_brief",
    description:
      "Create a structured brief for a restoration / engine build / custom project enquiry. Only call after the customer has explicitly consented to being contacted and has provided name and email or phone.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["RESTORATION", "ENGINE_BUILD", "DREAM_BUILD", "PART_SOURCING"] },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        vehicle: { type: "string" },
        brief: {
          type: "object",
          description: "Structured project details gathered in conversation (goals, budget band, timeline, current state, key components).",
          additionalProperties: true,
        },
        consent: { type: "boolean", description: "Must be true — explicit customer consent to be contacted." },
      },
      required: ["type", "name", "brief", "consent"],
      additionalProperties: false,
    },
  },
];

async function productSummary(id: string, vehicle: AssistantContext["vehicle"]) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      brand: true,
      fitments: { where: { approved: true }, include: { make: true, model: true, engineFamily: true } },
      relationsFrom: { include: { related: true } },
    },
  });
  if (!p) return null;
  const verdict = await verdictForProduct(p.id, vehicle);
  return {
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    brand: p.brand?.name,
    priceCents: effectivePriceCents(p),
    priceRand: (effectivePriceCents(p) / 100).toFixed(2),
    stockStatus: p.stockStatus,
    stockQty: p.stockQty,
    shortDescription: p.shortDescription,
    specs: p.specs,
    universalFit: p.universalFit,
    requiresFitmentCheck: p.requiresFitmentCheck,
    safetyCritical: p.safetyCritical,
    requiredParts: p.requiredParts,
    included: p.included,
    installNotes: p.installNotes,
    fitmentForSelectedVehicle: verdict,
    fitmentRecords: p.fitments.map((f) => ({
      status: f.status,
      make: f.make?.name,
      model: f.model?.name,
      years: f.yearFrom || f.yearTo ? `${f.yearFrom ?? ""}-${f.yearTo ?? ""}` : undefined,
      engine: f.engineFamily?.name,
      notes: f.notes,
    })),
    related: p.relationsFrom.map((r) => ({ type: r.type, slug: r.related.slug, name: r.related.name, note: r.note })),
  };
}

export type ToolExecutionEffects = {
  /** slugs the model is now allowed to reference (returned by catalogue tools) */
  groundedSlugs: Set<string>;
  proposal: { items: { productSlug: string; qty: number; reason?: string }[]; note?: string } | null;
  escalation: { reason: string; summary: string } | null;
  leadCreated: boolean;
};

export async function executeTool(
  call: ToolCall,
  ctx: AssistantContext,
  effects: ToolExecutionEffects,
): Promise<string> {
  try {
    switch (call.name) {
      case "search_products": {
        const { query, category, inStockOnly, limit } = call.input as {
          query: string; category?: string; inStockOnly?: boolean; limit?: number;
        };
        const result = await searchCatalog({
          query: String(query ?? ""),
          filters: { category, inStockOnly },
          perPage: Math.min(Number(limit) || 6, 10),
        });
        const verdicts = await verdictsForProducts(result.ids, ctx.vehicle);
        const products = await prisma.product.findMany({
          where: { id: { in: result.ids } },
          include: { brand: true },
        });
        const order = new Map(result.ids.map((id, i) => [id, i]));
        const rows = products
          .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
          .map((p) => {
            effects.groundedSlugs.add(p.slug);
            const v = verdicts.get(p.id);
            return {
              slug: p.slug,
              name: p.name,
              sku: p.sku,
              brand: p.brand?.name,
              priceRand: (effectivePriceCents(p) / 100).toFixed(2),
              stockStatus: p.stockStatus,
              stockQty: p.stockQty,
              fitment: v ? { status: v.status, detail: v.detail } : undefined,
            };
          });
        return JSON.stringify({ total: result.total, products: rows });
      }
      case "get_product": {
        const { slugOrSku } = call.input as { slugOrSku: string };
        const p = await prisma.product.findFirst({
          where: { OR: [{ slug: slugOrSku }, { sku: slugOrSku }], status: "ACTIVE" },
        });
        if (!p) return JSON.stringify({ error: "Product not found in catalogue." });
        effects.groundedSlugs.add(p.slug);
        const summary = await productSummary(p.id, ctx.vehicle);
        summary?.related.forEach((r) => effects.groundedSlugs.add(r.slug));
        return JSON.stringify(summary);
      }
      case "check_fitment": {
        const { productSlug } = call.input as { productSlug: string };
        const p = await prisma.product.findUnique({ where: { slug: productSlug } });
        if (!p) return JSON.stringify({ error: "Product not found." });
        if (!ctx.vehicle) {
          return JSON.stringify({ status: "UNKNOWN", detail: "Customer has no vehicle selected. Ask for year, make, model and engine." });
        }
        const verdict = await verdictForProduct(p.id, ctx.vehicle);
        return JSON.stringify(verdict);
      }
      case "review_basket": {
        if (ctx.cart.length === 0) return JSON.stringify({ empty: true });
        const priced = await priceCart(ctx.cart);
        priced.lines.forEach((l) => effects.groundedSlugs.add(l.slug));
        const verdicts = await verdictsForProducts(priced.lines.map((l) => l.productId), ctx.vehicle);
        return JSON.stringify({
          lines: priced.lines.map((l) => ({
            slug: l.slug,
            name: l.name,
            qty: l.qty,
            priceRand: (l.unitPriceCents / 100).toFixed(2),
            stockStatus: l.stockStatus,
            requiresFitmentCheck: l.requiresFitmentCheck,
            safetyCritical: l.safetyCritical,
            fitment: verdicts.get(l.productId),
          })),
          subtotalRand: (priced.subtotalCents / 100).toFixed(2),
          issues: priced.issues,
        });
      }
      case "search_knowledge": {
        const { query } = call.input as { query: string };
        const chunks = await retrieveKnowledge(String(query ?? ""), 4);
        return JSON.stringify(chunks.map((c) => ({ title: c.title, sourceType: c.sourceType, content: c.content.slice(0, 1500) })));
      }
      case "propose_basket_additions": {
        const { items, note } = call.input as {
          items: { productSlug: string; qty: number; reason?: string }[];
          note?: string;
        };
        // Grounding guard: only allow products that exist AND were surfaced by catalogue tools this conversation.
        const valid: typeof items = [];
        const rejected: string[] = [];
        for (const item of items ?? []) {
          const p = await prisma.product.findUnique({ where: { slug: item.productSlug } });
          if (!p || p.status !== "ACTIVE" || !effects.groundedSlugs.has(item.productSlug)) {
            rejected.push(item.productSlug);
          } else {
            valid.push({ ...item, qty: Math.max(1, Math.min(Number(item.qty) || 1, 20)) });
          }
        }
        if (valid.length === 0) {
          return JSON.stringify({ ok: false, error: "No valid products. Only propose products returned by search_products or get_product.", rejected });
        }
        effects.proposal = { items: valid, note };
        return JSON.stringify({ ok: true, proposed: valid.map((v) => v.productSlug), rejected, info: "The customer will be asked to confirm before anything is added." });
      }
      case "escalate_to_human": {
        const { reason, summary } = call.input as { reason: string; summary: string };
        effects.escalation = { reason: String(reason ?? ""), summary: String(summary ?? "") };
        await prisma.auditLog.create({
          data: { actor: "ai-assistant", action: "assistant.escalate", meta: { reason, summary } },
        });
        return JSON.stringify({ ok: true, info: "Handoff options will be shown to the customer with your summary." });
      }
      case "create_project_brief": {
        const input = call.input as {
          type: "RESTORATION" | "ENGINE_BUILD" | "DREAM_BUILD" | "PART_SOURCING";
          name: string; email?: string; phone?: string; vehicle?: string;
          brief: Record<string, unknown>; consent: boolean;
        };
        if (!input.consent) {
          return JSON.stringify({ ok: false, error: "Cannot create a lead without explicit customer consent." });
        }
        if (!input.email && !input.phone) {
          return JSON.stringify({ ok: false, error: "Need at least an email or phone number." });
        }
        const lead = await prisma.lead.create({
          data: {
            type: input.type,
            name: String(input.name).slice(0, 200),
            email: String(input.email ?? "").slice(0, 200),
            phone: input.phone ? String(input.phone).slice(0, 30) : null,
            message: "Created by AI specialist with customer consent.",
            vehicle: input.vehicle ? String(input.vehicle).slice(0, 200) : null,
            brief: input.brief as object,
            consent: true,
            source: "ai-assistant",
          },
        });
        effects.leadCreated = true;
        await prisma.auditLog.create({
          data: { actor: "ai-assistant", action: "assistant.lead_created", meta: { type: input.type } },
        });
        const { sendLeadNotification } = await import("../email");
        await sendLeadNotification(lead.id);
        return JSON.stringify({ ok: true, info: "Project brief captured. A specialist will make contact." });
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${call.name}` });
    }
  } catch (err) {
    return JSON.stringify({ error: `Tool failed: ${err instanceof Error ? err.message : "unknown error"}` });
  }
}
