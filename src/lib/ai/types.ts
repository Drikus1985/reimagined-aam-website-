import { GarageVehicle } from "../fitment";

/** Chat message in the assistant conversation (client <-> server). */
export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** A product card the assistant surfaces — always resolved from the live DB. */
export type GroundedProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  brand: string | null;
  priceCents: number;
  stockStatus: string;
  stockQty: number | null;
  imageUrl: string | null;
  fitmentStatus: string;
  fitmentLabel: string;
  fitmentDetail?: string;
  reason?: string; // why the assistant recommends it
};

/** Proposed basket additions — applied only after explicit user confirmation client-side. */
export type BasketProposal = {
  items: { productId: string; slug: string; name: string; qty: number; priceCents: number }[];
  note?: string;
};

export type AssistantResult = {
  text: string;
  products: GroundedProduct[];
  proposal: BasketProposal | null;
  escalation: {
    suggested: boolean;
    reason?: string;
    summary?: string;
  };
  disclaimer?: string;
};

export type AssistantContext = {
  vehicle: GarageVehicle | null;
  page?: { type: string; slug?: string }; // where the widget was opened
  cart: { productId: string; qty: number }[];
};

/** Tool-call shape shared between providers. */
export type ToolCall = { id: string; name: string; input: Record<string, unknown> };
export type ToolResult = { toolCallId: string; content: string };

export type ProviderTurn =
  | { type: "text"; text: string }
  | { type: "tool_calls"; text?: string; calls: ToolCall[] };

export interface AIProvider {
  name: string;
  /**
   * Run one model turn. `history` alternates user/assistant; tool exchanges are
   * managed by the caller via `toolTranscript`.
   */
  turn(opts: {
    system: string;
    history: AssistantChatMessage[];
    toolTranscript: { call: ToolCall; result: ToolResult }[];
    tools: AIToolDefinition[];
  }): Promise<ProviderTurn>;
}

export type AIToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};
