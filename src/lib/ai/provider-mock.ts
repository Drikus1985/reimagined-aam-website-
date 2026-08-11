import { AIProvider, AIToolDefinition, AssistantChatMessage, ProviderTurn, ToolCall, ToolResult } from "./types";

/**
 * Deterministic offline provider used in development and tests
 * (AI_PROVIDER=mock). It exercises the same tool interface and grounding
 * pipeline as the Claude provider, so the end-to-end flow — tool calls,
 * grounding guard, proposals, escalation — can be verified without network
 * access or an API key.
 */
export class MockProvider implements AIProvider {
  name = "mock";

  async turn(opts: {
    system: string;
    history: AssistantChatMessage[];
    toolTranscript: { call: ToolCall; result: ToolResult }[];
    tools: AIToolDefinition[];
  }): Promise<ProviderTurn> {
    const lastUser = [...opts.history].reverse().find((m) => m.role === "user")?.content ?? "";
    const lower = lastUser.toLowerCase();
    const step = opts.toolTranscript.length;

    // Escalation intent
    if (/\b(human|specialist|person|phone|whatsapp)\b/.test(lower) && step === 0) {
      return {
        type: "tool_calls",
        calls: [{
          id: "mock-esc-1",
          name: "escalate_to_human",
          input: { reason: "Customer asked for a human specialist.", summary: `Customer request: ${lastUser.slice(0, 300)}` },
        }],
      };
    }

    // Basket review intent
    if (/\bbasket|cart\b/.test(lower) && /\b(check|review|work together|missing)\b/.test(lower) && step === 0) {
      return { type: "tool_calls", calls: [{ id: "mock-rb-1", name: "review_basket", input: {} }] };
    }

    // Step 0: search the catalogue for anything product-like
    if (step === 0) {
      return {
        type: "tool_calls",
        calls: [{ id: "mock-s-1", name: "search_products", input: { query: lastUser.slice(0, 120), limit: 4 } }],
      };
    }

    // Step 1+: compose an answer from actual tool results (grounded).
    const lastResult = opts.toolTranscript[opts.toolTranscript.length - 1];
    try {
      const data = JSON.parse(lastResult.result.content);

      if (lastResult.call.name === "review_basket") {
        if (data.empty) return { type: "text", text: "Your basket is currently empty. Tell me about your vehicle and what you're building, and I'll point you at the right parts." };
        const safety = (data.lines as { safetyCritical?: boolean; name: string }[]).filter((l) => l.safetyCritical);
        return {
          type: "text",
          text: `I've reviewed your basket (${data.lines.length} line${data.lines.length === 1 ? "" : "s"}, subtotal R${data.subtotalRand}).` +
            (safety.length ? ` Note: ${safety.map((s) => s.name).join(", ")} ${safety.length === 1 ? "is" : "are"} safety-critical — make sure the full supporting hardware is included and plan for professional installation or inspection.` : " No obvious conflicts from the verified data I have.") +
            " If you tell me your vehicle and goals I can check for missing supporting parts. (This is the offline demo assistant — connect an AI provider for full analysis.)",
        };
      }

      if (lastResult.call.name === "escalate_to_human") {
        return {
          type: "text",
          text: "I've flagged this for our human specialists. You can reach them directly on +27 10 592 1706, WhatsApp +27 72 042 6477, or parts@allamericanmuscle.co.za — I've prepared a summary of our conversation for the handoff.",
        };
      }

      if (lastResult.call.name === "search_products") {
        const products = (data.products ?? []) as { slug: string; name: string; fitment?: { status: string } }[];
        if (products.length === 0) {
          return {
            type: "text",
            text: "I couldn't find a match for that in our live catalogue. We source hard-to-find parts from our US supplier network — ask me to connect you with a specialist and we'll track it down.",
          };
        }
        const lines = products.slice(0, 3).map((p) => {
          const fit = p.fitment?.status;
          const caveat =
            fit === "CONFIRMED" ? " (verified fit for your selected vehicle)" :
            fit === "NOT_COMPATIBLE" ? " (not compatible with your selected vehicle)" :
            fit === "UNIVERSAL" ? " (universal — check the listed requirements)" :
            " (fitment for your exact vehicle should be verified before ordering)";
          return `- [product:${p.slug}]${caveat}`;
        });
        return {
          type: "text",
          text: `Here's what our catalogue has for that:\n\n${lines.join("\n")}\n\nThese come straight from live stock. Want me to check fitment against your garage vehicle, or put a package together for you to confirm? (Offline demo assistant — connect an AI provider for full conversational guidance.)`,
        };
      }

      return { type: "text", text: "Done. Anything else about your build?" };
    } catch {
      return { type: "text", text: "Something went wrong reading the catalogue. Please try again, or contact our specialists on WhatsApp +27 72 042 6477." };
    }
  }
}
