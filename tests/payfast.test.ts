import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { buildPaymentFields, payfastSignature, pfEncode, verifyItnPayload } from "@/lib/payfast";

const cfg = { merchantId: "10000100", merchantKey: "46f0cd694581a", passphrase: "jt7NOE43FZPn", sandbox: true };

describe("pfEncode", () => {
  it("encodes spaces as + and uppercases hex escapes", () => {
    expect(pfEncode("All American Muscle")).toBe("All+American+Muscle");
    expect(pfEncode("a&b=c")).toBe("a%26b%3Dc");
  });
});

describe("payfastSignature", () => {
  it("produces the MD5 of ordered, encoded pairs with passphrase appended", () => {
    const fields = { merchant_id: "10000100", merchant_key: "46f0cd694581a", amount: "100.00", item_name: "Test Item" };
    const expected = crypto
      .createHash("md5")
      .update("merchant_id=10000100&merchant_key=46f0cd694581a&amount=100.00&item_name=Test+Item&passphrase=jt7NOE43FZPn")
      .digest("hex");
    expect(payfastSignature(fields, cfg.passphrase)).toBe(expected);
  });

  it("skips empty values and any existing signature field", () => {
    const withEmpty = { a: "1", b: "", signature: "junk", c: "2" };
    expect(payfastSignature(withEmpty)).toBe(
      crypto.createHash("md5").update("a=1&c=2").digest("hex"),
    );
  });
});

describe("buildPaymentFields", () => {
  const req = {
    orderId: "order_1", orderNumber: "AAM-TEST-1", amountCents: 123456,
    itemName: "Order AAM-TEST-1", customerFirstName: "Jane", customerLastName: "Doe",
    customerEmail: "jane@example.com",
  };

  it("formats the amount as rands with 2 decimals and signs the payload", () => {
    const fields = buildPaymentFields(req, cfg, "https://example.com");
    expect(fields.amount).toBe("1234.56");
    expect(fields.m_payment_id).toBe("order_1");
    expect(fields.notify_url).toBe("https://example.com/api/payfast/itn");
    const { signature, ...rest } = fields;
    expect(signature).toBe(payfastSignature(rest, cfg.passphrase));
  });
});

describe("verifyItnPayload", () => {
  function signedPayload(overrides: Record<string, string> = {}): Record<string, string> {
    const payload: Record<string, string> = {
      m_payment_id: "order_1",
      pf_payment_id: "PF123",
      payment_status: "COMPLETE",
      amount_gross: "1234.56",
      merchant_id: cfg.merchantId,
      ...overrides,
    };
    payload.signature = payfastSignature(payload, cfg.passphrase);
    return payload;
  }

  it("accepts a correctly signed payload with matching amount", () => {
    const result = verifyItnPayload(signedPayload(), cfg, 123456);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.orderId).toBe("order_1");
      expect(result.paymentStatus).toBe("COMPLETE");
    }
  });

  it("rejects a tampered amount (signature mismatch)", () => {
    const payload = signedPayload();
    payload.amount_gross = "1.00"; // tampered after signing
    const result = verifyItnPayload(payload, cfg, 123456);
    expect(result.valid).toBe(false);
  });

  it("rejects when the amount does not match the stored order total", () => {
    const payload = signedPayload({ amount_gross: "999.99" });
    const result = verifyItnPayload(payload, cfg, 123456);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("amount mismatch");
  });

  it("rejects a wrong merchant id", () => {
    const payload = signedPayload({ merchant_id: "999" });
    const result = verifyItnPayload(payload, cfg, 123456);
    expect(result.valid).toBe(false);
  });

  it("rejects a missing signature", () => {
    const result = verifyItnPayload({ m_payment_id: "x" }, cfg);
    expect(result.valid).toBe(false);
  });
});
