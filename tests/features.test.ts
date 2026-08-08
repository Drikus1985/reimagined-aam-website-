/** Integration tests for email no-op behaviour and analytics aggregation. */
import { describe, expect, it, beforeAll } from "vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/aam";
delete process.env.SMTP_HOST; // force unconfigured-email path

import { sendMail } from "@/lib/email";
import { prisma } from "@/lib/db";

describe("email (unconfigured)", () => {
  it("is a graceful, audited no-op without SMTP_HOST", async () => {
    const before = await prisma.auditLog.count({ where: { action: "email.skipped_not_configured" } });
    const sent = await sendMail({ to: "test@example.com", subject: "Test", text: "Hello" });
    expect(sent).toBe(false);
    const after = await prisma.auditLog.count({ where: { action: "email.skipped_not_configured" } });
    expect(after).toBe(before + 1);
  });
});

describe("analytics aggregation", () => {
  const date = new Date(Date.UTC(2026, 0, 15));
  const path = "/test-analytics-page";

  beforeAll(async () => {
    await prisma.pageViewDaily.deleteMany({ where: { path } });
  });

  it("upserts daily counts per path with no visitor data", async () => {
    for (let i = 0; i < 3; i++) {
      await prisma.pageViewDaily.upsert({
        where: { date_path: { date, path } },
        create: { date, path, count: 1 },
        update: { count: { increment: 1 } },
      });
    }
    const row = await prisma.pageViewDaily.findUniqueOrThrow({ where: { date_path: { date, path } } });
    expect(row.count).toBe(3);
    // Schema stores only date/path/count — nothing else to assert exists.
    expect(Object.keys(row).sort()).toEqual(["count", "date", "id", "path"]);
  });
});
