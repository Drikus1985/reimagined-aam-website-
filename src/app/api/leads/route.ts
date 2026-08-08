import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const schema = z.object({
  type: z.enum(["RESTORATION", "ENGINE_BUILD", "DREAM_BUILD", "PART_SOURCING", "GENERAL"]),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional(),
  vehicle: z.string().max(200).optional(),
  message: z.string().min(5).max(4000),
  consent: z.literal(true, { message: "Consent is required so we can respond to you (POPIA)." }),
  // Honeypot — real users never fill this.
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req, "leads"), 5, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many submissions — please wait a minute." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }

  const { website: _honeypot, ...data } = parsed.data;
  const lead = await prisma.lead.create({
    data: {
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      vehicle: data.vehicle,
      message: data.message,
      consent: true,
      source: "website-form",
    },
  });

  await prisma.auditLog.create({
    data: { actor: "system", action: "lead.created", entity: "Lead", entityId: lead.id, meta: { type: data.type } },
  });

  return NextResponse.json({ ok: true });
}
