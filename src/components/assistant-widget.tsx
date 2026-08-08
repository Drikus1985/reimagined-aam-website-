"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addToCart } from "@/lib/client/store";
import { formatZar } from "@/lib/money";

type Product = {
  slug: string; name: string; sku: string | null; brand: string | null;
  priceCents: number; stockStatus: string; imageUrl: string | null;
  fitmentStatus: string; fitmentLabel: string; fitmentDetail?: string;
};
type Proposal = { items: { productId: string; slug: string; name: string; qty: number; priceCents: number }[]; note?: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  proposal?: Proposal | null;
  escalation?: { suggested: boolean; reason?: string; summary?: string };
};

const SUGGESTIONS = [
  "I'm rebuilding a Ford 302 for reliable street use — what do I need?",
  "Help me improve the brakes on a 1967 Mustang",
  "Build me a cooling package for a modified SBC",
  "Check whether everything in my basket works together",
];

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setInput("");
    const history = [...messagesRef.current, { role: "user" as const, content: trimmed }];
    setMessages(history);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })).slice(-20),
          page: { type: pathname.split("/")[1] || "home", slug: pathname.split("/")[2] },
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOffline(res.status === 503);
        setMessages((prev) => [...prev, { role: "assistant", content: json.message ?? "Sorry — something went wrong. Try again or WhatsApp us on +27 72 042 6477." }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: json.text,
          products: json.products,
          proposal: json.proposal,
          escalation: json.escalation,
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — please try again." }]);
    }
    setBusy(false);
  }, [busy, pathname]);

  // Open + prefill from "Ask the AI specialist" buttons anywhere on the site.
  useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent).detail as { prompt?: string };
      setOpen(true);
      if (detail?.prompt) void send(detail.prompt);
    };
    window.addEventListener("aam:assistant", onAsk);
    return () => window.removeEventListener("aam:assistant", onAsk);
  }, [send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const confirmProposal = (proposal: Proposal) => {
    for (const item of proposal.items) addToCart(item.productId, item.qty);
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: `Added to your basket: ${proposal.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}. You can review everything in the basket before checkout.`,
    }]);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close AI specialist chat" : "Ask the AI American vehicle specialist"}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-race-600 px-4 py-3 font-bold text-white shadow-xl transition-colors hover:bg-race-700"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-4-1L3 20l1-5.5a8.5 8.5 0 1117-3z" />
        </svg>
        <span className="hidden sm:inline">{open ? "Close" : "Ask the specialist"}</span>
      </button>

      {open && (
        <section
          aria-label="AI American vehicle specialist chat"
          className="fixed bottom-20 right-2 z-50 flex h-[70vh] w-[calc(100vw-1rem)] max-w-md flex-col overflow-hidden rounded-lg border border-ink-700 bg-ink-900 shadow-2xl sm:right-4"
        >
          <header className="border-b border-ink-700 bg-ink-850 px-4 py-3">
            <p className="font-bold text-paper-50">AI American Vehicle Specialist</p>
            <p className="text-xs text-steel-400">
              Grounded in our live catalogue. For final fitment sign-off, our humans are one tap away.
            </p>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div>
                <p className="text-sm text-steel-300">
                  Ask about parts, compatibility, engine builds, brakes, cooling — or restorations. I check the live
                  catalogue and never guess fitment.
                </p>
                <ul className="mt-3 space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <li key={s}>
                      <button onClick={() => send(s)} className="w-full rounded border border-ink-700 px-3 py-2 text-left text-sm text-paper-100 hover:border-race-600">
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-race-600 text-white" : "bg-ink-850 text-paper-100"}`}>
                  <p className="whitespace-pre-wrap">{m.content.replace(/\*\*(.+?)\*\*/g, "$1")}</p>

                  {m.products && m.products.length > 0 && (
                    <ul className="mt-2 space-y-2">
                      {m.products.map((p) => (
                        <li key={p.slug} className="rounded border border-ink-700 bg-ink-900 p-2">
                          <Link href={`/products/${p.slug}`} className="text-sm font-semibold text-paper-50 hover:underline" onClick={() => setOpen(false)}>
                            {p.name}
                          </Link>
                          <p className="text-xs text-steel-400">
                            {p.brand} · {formatZar(p.priceCents)} · {p.stockStatus === "IN_STOCK" ? "In stock" : p.stockStatus === "BACKORDER" ? "Backorder" : "Out of stock"}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-steel-300">{p.fitmentLabel}</p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {m.proposal && (
                    <div className="mt-2 rounded border border-emerald-800 bg-emerald-950/40 p-2">
                      <p className="text-xs font-bold text-emerald-300">Proposed basket additions (nothing added yet):</p>
                      <ul className="mt-1 space-y-0.5 text-xs text-emerald-200/90">
                        {m.proposal.items.map((item) => (
                          <li key={item.slug}>{item.name} × {item.qty} — {formatZar(item.priceCents * item.qty)}</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => confirmProposal(m.proposal!)}
                        className="mt-2 w-full rounded bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        Confirm — add to basket
                      </button>
                    </div>
                  )}

                  {m.escalation?.suggested && (
                    <div className="mt-2 rounded border border-ink-600 bg-ink-900 p-2 text-xs">
                      <p className="font-bold text-paper-50">Talk to a human specialist:</p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <a className="rounded bg-emerald-700 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600" target="_blank" rel="noopener noreferrer"
                          href={`https://wa.me/27720426477?text=${encodeURIComponent(`Hi! The AI specialist referred me.\n\nSummary: ${m.escalation.summary ?? ""}`)}`}>
                          WhatsApp
                        </a>
                        <a className="rounded border border-ink-600 px-2.5 py-1.5 font-semibold text-paper-100 hover:border-race-600" href="tel:+27105921706">Call 010 592 1706</a>
                        <a className="rounded border border-ink-600 px-2.5 py-1.5 font-semibold text-paper-100 hover:border-race-600"
                          href={`mailto:parts@allamericanmuscle.co.za?subject=Specialist%20request&body=${encodeURIComponent(m.escalation.summary ?? "")}`}>
                          Email
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && <p className="text-sm text-steel-400" role="status">Checking the catalogue…</p>}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void send(input); }}
            className="flex gap-2 border-t border-ink-700 p-3"
          >
            <label htmlFor="assistant-input" className="sr-only">Message the AI specialist</label>
            <input
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={offline ? "Assistant offline — use WhatsApp above" : "Ask about parts, fitment, builds…"}
              disabled={busy || offline}
              className="flex-1 rounded border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-paper-50 placeholder:text-steel-400 disabled:opacity-60"
            />
            <button type="submit" disabled={busy || offline || !input.trim()} className="rounded bg-race-600 px-4 py-2 text-sm font-bold text-white hover:bg-race-700 disabled:bg-ink-700 disabled:text-steel-400">
              Send
            </button>
          </form>
          <p className="border-t border-ink-800 px-3 py-1.5 text-[10px] leading-snug text-steel-400">
            Guidance is general; verify fitment before ordering. Safety-critical systems need professional installation or inspection.
          </p>
        </section>
      )}
    </>
  );
}
