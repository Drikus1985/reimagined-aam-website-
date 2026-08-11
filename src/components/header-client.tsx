"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cartCount, activeVehicle } from "@/lib/client/store";
import { describeVehicle, GarageVehicle } from "@/lib/fitment";
import { formatZar } from "@/lib/money";

export function CartBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener("aam:cart", update);
    return () => window.removeEventListener("aam:cart", update);
  }, []);
  return (
    <Link
      href="/basket"
      className="relative flex items-center gap-2 rounded border border-ink-700 px-3 py-2 text-sm font-semibold text-paper-100 hover:border-race-600 hover:text-white"
      aria-label={`Basket, ${count} item${count === 1 ? "" : "s"}`}
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
      </svg>
      <span className="hidden sm:inline">Basket</span>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-race-600 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export function GarageBadge() {
  const [vehicle, setVehicle] = useState<GarageVehicle | null>(null);
  useEffect(() => {
    const update = () => setVehicle(activeVehicle());
    update();
    window.addEventListener("aam:garage", update);
    return () => window.removeEventListener("aam:garage", update);
  }, []);
  return (
    <Link
      href="/garage"
      className="flex items-center gap-2 rounded border border-ink-700 px-3 py-2 text-sm text-paper-100 hover:border-race-600 hover:text-white"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l2-6h14l2 6" /><path d="M4 12h16v6H4z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="16.5" cy="18" r="1.5" />
      </svg>
      <span className="hidden max-w-40 truncate font-semibold md:inline">
        {vehicle ? describeVehicle(vehicle) : "My Garage"}
      </span>
      <span className="font-semibold md:hidden">Garage</span>
    </Link>
  );
}

type Suggestion = {
  slug: string; name: string; sku: string | null; brand: string | null;
  priceCents: number; stockStatus: string; imageUrl: string | null;
};

export function SearchBox({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const onChange = (value: string) => {
    setQ(value);
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 2) { setSuggestions([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.products ?? []);
          setOpen(true);
        }
      } catch { /* network hiccup — ignore */ }
    }, 200);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} role="search" className="flex">
        <label htmlFor="site-search" className="sr-only">Search parts, part numbers or vehicles</label>
        <input
          id="site-search"
          type="search"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={compact ? "Search parts…" : "Search parts, SKUs, SBC, 302, Mustang…"}
          autoComplete="off"
          className="w-full rounded-l border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-50 placeholder:text-steel-400 focus:border-race-600"
        />
        <button type="submit" className="rounded-r bg-race-600 px-4 text-sm font-bold text-white hover:bg-race-700" aria-label="Search">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" />
          </svg>
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded border border-ink-700 bg-ink-900 shadow-2xl">
          {suggestions.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/products/${s.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-ink-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.imageUrl && <img src={s.imageUrl} alt="" width={36} height={36} className="rounded bg-ink-800" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-paper-50">{s.name}</span>
                  <span className="block text-xs text-steel-400">{s.brand}{s.sku ? ` · ${s.sku}` : ""}</span>
                </span>
                <span className="text-sm font-semibold text-paper-50">{formatZar(s.priceCents)}</span>
              </Link>
            </li>
          ))}
          <li className="border-t border-ink-700">
            <button
              onClick={() => { setOpen(false); router.push(`/search?q=${encodeURIComponent(q)}`); }}
              className="block w-full px-3 py-2 text-left text-sm text-race-500 hover:bg-ink-800"
            >
              See all results for “{q}”
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
