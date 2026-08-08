"use client";

import { useState } from "react";

export function EnquiryForm({ type, heading = "Tell us about your project" }: {
  type: "RESTORATION" | "ENGINE_BUILD" | "DREAM_BUILD" | "PART_SOURCING" | "GENERAL";
  heading?: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("busy");
    setErrorMsg(null);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          vehicle: data.get("vehicle") || undefined,
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website") ?? "",
        }),
      });
      if (res.ok) setState("done");
      else {
        const json = await res.json().catch(() => null);
        setErrorMsg(json?.issues?.[0]?.message ?? json?.error ?? "Please check the form and try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error — please try again or WhatsApp us.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-6 text-center" role="status">
        <p className="text-lg font-bold text-emerald-300">Thanks — we've got it.</p>
        <p className="mt-2 text-sm text-emerald-200/80">A specialist will come back to you within one working day.</p>
      </div>
    );
  }

  const field = "w-full rounded border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-paper-50 placeholder:text-steel-400 focus:border-race-500";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-ink-800 bg-ink-900/60 p-6">
      <h2 className="headline text-xl text-paper-50">{heading}</h2>
      {errorMsg && <p className="mt-3 rounded border border-race-700 bg-race-700/10 p-2 text-sm text-race-500" role="alert">{errorMsg}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${type}-name`} className="mb-1 block text-sm text-steel-300">Name</label>
          <input id={`${type}-name`} name="name" required className={field} />
        </div>
        <div>
          <label htmlFor={`${type}-email`} className="mb-1 block text-sm text-steel-300">Email</label>
          <input id={`${type}-email`} name="email" type="email" required className={field} />
        </div>
        <div>
          <label htmlFor={`${type}-phone`} className="mb-1 block text-sm text-steel-300">Phone / WhatsApp (optional)</label>
          <input id={`${type}-phone`} name="phone" type="tel" className={field} />
        </div>
        <div>
          <label htmlFor={`${type}-vehicle`} className="mb-1 block text-sm text-steel-300">Vehicle (optional)</label>
          <input id={`${type}-vehicle`} name="vehicle" placeholder="e.g. 1969 Dodge Charger, 440" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${type}-message`} className="mb-1 block text-sm text-steel-300">Your project or question</label>
          <textarea id={`${type}-message`} name="message" rows={4} required className={field} />
        </div>
        {/* Honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        <label className="flex items-start gap-2 text-sm text-steel-300 sm:col-span-2">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>I consent to All American Muscle contacting me about this enquiry (POPIA). We never sell your details.</span>
        </label>
      </div>
      <button type="submit" disabled={state === "busy"} className="mt-4 rounded bg-race-600 px-6 py-2.5 font-bold uppercase tracking-wide text-white hover:bg-race-700 disabled:bg-ink-700">
        {state === "busy" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
