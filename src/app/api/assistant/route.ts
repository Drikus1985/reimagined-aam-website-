import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAssistant, isAssistantConfigured } from "@/lib/ai";
import { AssistantContext } from "@/lib/ai/types";
import { getActiveVehicle } from "@/lib/garage";
import { getCart } from "@/lib/cart";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
  page: z.object({ type: z.string().max(50), slug: z.string().max(200).optional() }).optional(),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "assistant"), 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests — please slow down." }, { status: 429 });
  }
  if (!isAssistantConfigured()) {
    return NextResponse.json(
      {
        error: "assistant_offline",
        message:
          "The AI specialist is offline right now. Contact us on WhatsApp +27 72 042 6477 or parts@allamericanmuscle.co.za.",
      },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ctx: AssistantContext = {
    vehicle: await getActiveVehicle(),
    page: parsed.data.page,
    cart: await getCart(),
  };

  try {
    const result = await runAssistant(parsed.data.messages, ctx);
    return NextResponse.json(result);
  } catch (err) {
    console.error("assistant error", err);
    return NextResponse.json(
      {
        error: "assistant_error",
        message:
          "Something went wrong on our side. Please try again, or reach a specialist on WhatsApp +27 72 042 6477.",
      },
      { status: 500 },
    );
  }
}
