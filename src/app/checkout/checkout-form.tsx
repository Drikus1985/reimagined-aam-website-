"use client";

import { useState } from "react";
import { formatZar } from "@/lib/money";

const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State",
  "Limpopo", "Mpumalanga", "North West", "Northern Cape",
];

type Quote = { provider: string; service: string; amountCents: number; estimatedDays: string };

export function CheckoutForm() {
  const [delivery, setDelivery] = useState<"COURIER" | "COLLECTION">("COURIER");
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverIssues, setServerIssues] = useState<string[]>([]);

  const field = (name: string) =>
    `w-full rounded border px-3 py-2.5 text-sm bg-ink-900 text-paper-50 placeholder:text-steel-400 ${errors[name] ? "border-race-600" : "border-ink-700"} focus:border-race-500`;

  const getQuote = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    const city = String(data.get("city") ?? "");
    const province = String(data.get("province") ?? "");
    const postalCode = String(data.get("postalCode") ?? "");
    if (!city || !province || !/^\d{4}$/.test(postalCode)) return;
    setQuoting(true);
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, province, postalCode, suburb: String(data.get("suburb") ?? "") }),
      });
      if (res.ok) {
        const json = await res.json();
        setQuotes(json.quotes ?? []);
      }
    } catch { /* quote is informational; order re-quotes server-side */ }
    setQuoting(false);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setServerError(null);
    setServerIssues([]);

    const data = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      email: data.get("email"),
      phone: data.get("phone"),
      firstName: data.get("firstName"),
      lastName: data.get("lastName"),
      deliveryMethod: delivery,
      customerNote: data.get("customerNote") || undefined,
    };
    if (delivery === "COURIER") {
      Object.assign(body, {
        addressLine1: data.get("addressLine1"),
        addressLine2: data.get("addressLine2") || undefined,
        suburb: data.get("suburb"),
        city: data.get("city"),
        province: data.get("province"),
        postalCode: data.get("postalCode"),
      });
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.issues && Array.isArray(json.issues) && json.issues[0]?.path) {
          const map: Record<string, string> = {};
          for (const issue of json.issues) map[issue.path] = issue.message;
          setErrors(map);
        } else {
          setServerError(json.error ?? "Something went wrong.");
          setServerIssues(Array.isArray(json.issues) ? json.issues : []);
        }
        setSubmitting(false);
        return;
      }
      // Build and auto-submit the signed PayFast form.
      const pf = json.payfast as { action: string; fields: Record<string, string> };
      const form = document.createElement("form");
      form.method = "POST";
      form.action = pf.action;
      for (const [k, v] of Object.entries(pf.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setServerError("Network error — please try again.");
      setSubmitting(false);
    }
  };

  const err = (name: string) =>
    errors[name] ? <p className="mt-1 text-xs text-race-500" role="alert">{errors[name]}</p> : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {serverError && (
        <div className="rounded border border-race-700 bg-race-700/10 p-3 text-sm text-race-500" role="alert">
          <p className="font-semibold">{serverError}</p>
          {serverIssues.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-race-500/90">
              {serverIssues.map((i) => <li key={i}>{i}</li>)}
            </ul>
          )}
        </div>
      )}

      <fieldset>
        <legend className="headline text-lg text-paper-50">Contact</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm text-steel-300">First name</label>
            <input id="firstName" name="firstName" autoComplete="given-name" required className={field("firstName")} />
            {err("firstName")}
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm text-steel-300">Last name</label>
            <input id="lastName" name="lastName" autoComplete="family-name" required className={field("lastName")} />
            {err("lastName")}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-steel-300">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={field("email")} />
            {err("email")}
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm text-steel-300">Phone</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="072 000 0000" required className={field("phone")} />
            {err("phone")}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="headline text-lg text-paper-50">Delivery</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded border p-3 ${delivery === "COURIER" ? "border-race-600 bg-ink-900" : "border-ink-700"}`}>
            <input type="radio" name="deliveryMethod" checked={delivery === "COURIER"} onChange={() => setDelivery("COURIER")} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-paper-50">Courier delivery</span>
              <span className="block text-xs text-steel-400">The Courier Guy, nationwide. Quote below.</span>
            </span>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded border p-3 ${delivery === "COLLECTION" ? "border-race-600 bg-ink-900" : "border-ink-700"}`}>
            <input type="radio" name="deliveryMethod" checked={delivery === "COLLECTION"} onChange={() => setDelivery("COLLECTION")} className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-paper-50">Collect in Alberton (free)</span>
              <span className="block text-xs text-steel-400">15 Tarry Road, Alrode South. Ready within 1 working day.</span>
            </span>
          </label>
        </div>

        {delivery === "COURIER" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="addressLine1" className="mb-1 block text-sm text-steel-300">Street address</label>
              <input id="addressLine1" name="addressLine1" autoComplete="address-line1" required className={field("addressLine1")} />
              {err("addressLine1")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine2" className="mb-1 block text-sm text-steel-300">Complex / unit (optional)</label>
              <input id="addressLine2" name="addressLine2" autoComplete="address-line2" className={field("addressLine2")} />
            </div>
            <div>
              <label htmlFor="suburb" className="mb-1 block text-sm text-steel-300">Suburb</label>
              <input id="suburb" name="suburb" required className={field("suburb")} />
              {err("suburb")}
            </div>
            <div>
              <label htmlFor="city" className="mb-1 block text-sm text-steel-300">City</label>
              <input id="city" name="city" autoComplete="address-level2" required className={field("city")} />
              {err("city")}
            </div>
            <div>
              <label htmlFor="province" className="mb-1 block text-sm text-steel-300">Province</label>
              <select id="province" name="province" required className={field("province")} defaultValue="">
                <option value="" disabled>Select…</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {err("province")}
            </div>
            <div>
              <label htmlFor="postalCode" className="mb-1 block text-sm text-steel-300">Postal code</label>
              <input id="postalCode" name="postalCode" inputMode="numeric" pattern="[0-9]{4}" autoComplete="postal-code" required className={field("postalCode")} />
              {err("postalCode")}
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={(e) => getQuote(e.currentTarget.form as HTMLFormElement)}
                className="rounded border border-ink-600 px-4 py-2 text-sm font-semibold text-paper-100 hover:border-race-600"
                disabled={quoting}
              >
                {quoting ? "Getting quote…" : "Get delivery quote"}
              </button>
              {quotes && (
                <ul className="mt-2 space-y-1 text-sm" aria-live="polite">
                  {quotes.map((q) => (
                    <li key={q.service} className="flex justify-between rounded bg-ink-900 px-3 py-2">
                      <span className="text-paper-100">{q.service} <span className="text-steel-400">({q.estimatedDays})</span></span>
                      <span className="font-semibold text-paper-50">{q.amountCents === 0 ? "FREE" : formatZar(q.amountCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </fieldset>

      <div>
        <label htmlFor="customerNote" className="mb-1 block text-sm text-steel-300">Order note (optional)</label>
        <textarea id="customerNote" name="customerNote" rows={2} className={field("customerNote")} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-race-600 px-6 py-3.5 font-bold uppercase tracking-wide text-white hover:bg-race-700 disabled:bg-ink-700 disabled:text-steel-400 sm:w-auto"
      >
        {submitting ? "Preparing secure payment…" : "Pay securely with PayFast"}
      </button>
      <p className="text-xs text-steel-400">
        You'll be redirected to PayFast (sandbox in development) to complete payment. We never see your card details.
      </p>
    </form>
  );
}
