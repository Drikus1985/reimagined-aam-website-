import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, AIToolDefinition, AssistantChatMessage, ProviderTurn, ToolCall, ToolResult } from "./types";

/**
 * Claude-backed provider. The tool loop is owned by runAssistant() (so
 * grounding and audit logging sit outside the provider); this class only
 * translates one turn to/from the Messages API.
 */
export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || "claude-opus-5";
  }

  async turn(opts: {
    system: string;
    history: AssistantChatMessage[];
    toolTranscript: { call: ToolCall; result: ToolResult }[];
    tools: AIToolDefinition[];
  }): Promise<ProviderTurn> {
    const messages: Anthropic.MessageParam[] = opts.history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Replay the current turn's tool exchanges in Messages API format.
    for (const { call, result } of opts.toolTranscript) {
      messages.push({
        role: "assistant",
        content: [{ type: "tool_use", id: call.id, name: call.name, input: call.input }],
      });
      messages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: result.toolCallId, content: result.content }],
      });
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: opts.system,
      tools: opts.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
      })),
      messages,
    });

    if (response.stop_reason === "refusal") {
      return {
        type: "text",
        text: "I can't help with that request. For anything else about American muscle car parts or builds, I'm here — or contact our workshop directly.",
      };
    }

    const toolCalls: ToolCall[] = [];
    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += block.text;
      else if (block.type === "tool_use") {
        toolCalls.push({ id: block.id, name: block.name, input: block.input as Record<string, unknown> });
      }
    }

    if (toolCalls.length > 0) {
      return { type: "tool_calls", text: text || undefined, calls: toolCalls };
    }
    return { type: "text", text };
  }
}
