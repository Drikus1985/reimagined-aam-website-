import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCart, priceCart } from "@/lib/cart";
import { COLLECTION_OPTION, getShippingQuotes } from "@/lib/shipping";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(50),
  postalCode: z.string().regex(/^\d{4}$/),
  suburb: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "quote"), 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid address." }, { status: 400 });

  const priced = await priceCart(await getCart());
  if (priced.lines.length === 0) return NextResponse.json({ error: "Basket is empty." }, { status: 400 });

  const quotes = await getShippingQuotes(parsed.data, priced.totalWeightGrams, priced.subtotalCents);
  return NextResponse.json({ quotes, collection: COLLECTION_OPTION });
}
