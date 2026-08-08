import { prisma } from "../db";
import { AnthropicProvider } from "./provider-anthropic";
import { MockProvider } from "./provider-mock";
import { executeTool, toolDefinitions, ToolExecutionEffects } from "./tools";
import { buildSystemPrompt, ASSISTANT_DISCLAIMER } from "./system-prompt";
import { groundAssistantText } from "./grounding";
import {
  AIProvider,
  AssistantChatMessage,
  AssistantContext,
  AssistantResult,
  BasketProposal,
  ToolCall,
  ToolResult,
} from "./types";
import { effectivePriceCents } from "../money";

const MAX_TOOL_ROUNDS = 8;
const MAX_HISTORY = 30;

export function getProvider(): AIProvider {
  const kind = process.env.AI_PROVIDER ?? "mock";
  if (kind === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set");
    return new AnthropicProvider(key, process.env.AI_MODEL);
  }
  return new MockProvider();
}

export function isAssistantConfigured(): boolean {
  const kind = process.env.AI_PROVIDER ?? "mock";
  return kind === "mock" || Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Run the assistant loop: model turn -> execute tools -> repeat, then ground
 * the final text against the live catalogue. All catalogue access happens in
 * tools; all recommendations are resolved server-side before display.
 */
export async function runAssistant(
  history: AssistantChatMessage[],
  ctx: AssistantContext,
): Promise<AssistantResult> {
  const provider = getProvider();
  const system = buildSystemPrompt(ctx);
  const trimmedHistory = history.slice(-MAX_HISTORY);

  const effects: ToolExecutionEffects = {
    groundedSlugs: new Set<string>(),
    proposal: null,
    escalation: null,
    leadCreated: false,
  };
  const toolTranscript: { call: ToolCall; result: ToolResult }[] = [];

  let finalText = "";
  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const turn = await provider.turn({ system, history: trimmedHistory, toolTranscript, tools: toolDefinitions });
    if (turn.type === "text") {
      finalText = turn.text;
      break;
    }
    if (round === MAX_TOOL_ROUNDS) {
      finalText = "I wasn't able to finish looking that up. Please try again or contact our specialists on WhatsApp +27 72 042 6477.";
      break;
    }
    for (const call of turn.calls) {
      const content = await executeTool(call, ctx, effects);
      toolTranscript.push({ call, result: { toolCallId: call.id, content } });
    }
  }

  const grounded = await groundAssistantText(finalText, effects.groundedSlugs, ctx.vehicle);

  // Resolve any proposal against the live catalogue (prices/stock server-side).
  let proposal: BasketProposal | null = null;
  if (effects.proposal) {
    const items: BasketProposal["items"] = [];
    for (const item of effects.proposal.items) {
      const p = await prisma.product.findUnique({ where: { slug: item.productSlug } });
      if (!p || p.status !== "ACTIVE" || p.stockStatus === "OUT_OF_STOCK") continue;
      items.push({ productId: p.id, slug: p.slug, name: p.name, qty: item.qty, priceCents: effectivePriceCents(p) });
    }
    if (items.length > 0) proposal = { items, note: effects.proposal.note };
  }

  await prisma.auditLog.create({
    data: {
      actor: "ai-assistant",
      action: "assistant.turn",
      meta: {
        provider: provider.name,
        toolCalls: toolTranscript.map((t) => t.call.name),
        productsShown: grounded.products.map((p) => p.slug),
        proposed: proposal?.items.map((i) => i.slug) ?? [],
        escalated: Boolean(effects.escalation),
      },
    },
  });

  return {
    text: grounded.text,
    products: grounded.products,
    proposal,
    escalation: effects.escalation
      ? { suggested: true, reason: effects.escalation.reason, summary: effects.escalation.summary }
      : { suggested: false },
    disclaimer: ASSISTANT_DISCLAIMER,
  };
}
