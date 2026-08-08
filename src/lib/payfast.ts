import crypto from "node:crypto";

/**
 * PayFast integration (sandbox-ready).
 * Docs: https://developers.payfast.co.za
 *
 * Flow: we render a signed form POST to the PayFast engine; PayFast calls our
 * ITN (Instant Transaction Notification) webhook, which we verify by
 * signature, merchant id, amount, and (in production) a server-side postback.
 */

export type PayfastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  sandbox: boolean;
};

export function getPayfastConfig(): PayfastConfig {
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID ?? "",
    merchantKey: process.env.PAYFAST_MERCHANT_KEY ?? "",
    passphrase: process.env.PAYFAST_PASSPHRASE || undefined,
    sandbox: process.env.PAYFAST_SANDBOX !== "false",
  };
}

export function payfastEngineUrl(cfg: PayfastConfig): string {
  return cfg.sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

/** PayFast-style URL encoding: spaces as '+', uppercase hex. */
export function pfEncode(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/(%[0-9a-f]{2})/g, (m) => m.toUpperCase());
}

/**
 * Generate the PayFast signature: MD5 of the name=value pairs in the exact
 * order the fields appear (NOT alphabetised), URL-encoded, empty values
 * excluded, with the passphrase appended last when configured.
 */
export function payfastSignature(fields: Record<string, string>, passphrase?: string): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === "signature") continue;
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${key}=${pfEncode(value)}`);
  }
  if (passphrase) parts.push(`passphrase=${pfEncode(passphrase)}`);
  return crypto.createHash("md5").update(parts.join("&")).digest("hex");
}

export type PaymentRequest = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  itemName: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
};

/** Build the ordered field map + signature for the PayFast process form. */
export function buildPaymentFields(req: PaymentRequest, cfg: PayfastConfig, siteUrl: string): Record<string, string> {
  // Field order matters for the signature — follow the PayFast docs order.
  const fields: Record<string, string> = {
    merchant_id: cfg.merchantId,
    merchant_key: cfg.merchantKey,
    return_url: `${siteUrl}/checkout/result?order=${req.orderNumber}&status=return`,
    cancel_url: `${siteUrl}/checkout/result?order=${req.orderNumber}&status=cancelled`,
    notify_url: `${siteUrl}/api/payfast/itn`,
    name_first: req.customerFirstName.slice(0, 100),
    name_last: req.customerLastName.slice(0, 100),
    email_address: req.customerEmail.slice(0, 100),
    m_payment_id: req.orderId,
    amount: (req.amountCents / 100).toFixed(2),
    item_name: req.itemName.slice(0, 100),
  };
  fields.signature = payfastSignature(fields, cfg.passphrase);
  return fields;
}

export type ItnVerification =
  | { valid: true; orderId: string; paymentStatus: string; amountGross: number; pfPaymentId: string }
  | { valid: false; reason: string };

/**
 * Verify an ITN payload: signature, merchant id and payment amount.
 * `expectedAmountCents` must come from the stored order, never the payload.
 */
export function verifyItnPayload(
  payload: Record<string, string>,
  cfg: PayfastConfig,
  expectedAmountCents?: number,
): ItnVerification {
  const { signature, ...rest } = payload;
  if (!signature) return { valid: false, reason: "missing signature" };
  const computed = payfastSignature(rest, cfg.passphrase);
  if (computed !== signature) return { valid: false, reason: "signature mismatch" };
  if (rest.merchant_id !== cfg.merchantId) return { valid: false, reason: "merchant_id mismatch" };
  const amountGross = Math.round(parseFloat(rest.amount_gross ?? "0") * 100);
  if (expectedAmountCents != null && Math.abs(amountGross - expectedAmountCents) > 1) {
    return { valid: false, reason: "amount mismatch" };
  }
  if (!rest.m_payment_id) return { valid: false, reason: "missing m_payment_id" };
  return {
    valid: true,
    orderId: rest.m_payment_id,
    paymentStatus: rest.payment_status ?? "UNKNOWN",
    amountGross,
    pfPaymentId: rest.pf_payment_id ?? "",
  };
}

/** Production hardening: confirm the ITN with PayFast via server postback. */
export async function postbackValidate(payload: Record<string, string>, cfg: PayfastConfig): Promise<boolean> {
  const host = cfg.sandbox ? "sandbox.payfast.co.za" : "www.payfast.co.za";
  const body = Object.entries(payload)
    .filter(([k]) => k !== "signature")
    .map(([k, v]) => `${k}=${pfEncode(v)}`)
    .join("&");
  try {
    const res = await fetch(`https://${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const text = await res.text();
    return text.trim() === "VALID";
  } catch {
    // Network failure → treat as unverified; caller decides (we keep order AWAITING_PAYMENT).
    return false;
  }
}
