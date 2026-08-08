"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Product comparison selection. Slugs live in localStorage (max 4); the
 * comparison itself is a crawl-friendly server page at /compare?p=a,b,c.
 */

const KEY = "aam_compare";
const MAX = 4;

function read(): string[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(data) ? data.filter((s) => typeof s === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, MAX)));
  window.dispatchEvent(new CustomEvent("aam:compare"));
}

export function CompareToggle({ slug, name }: { slug: string; name: string }) {
  const [selected, setSelected] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const update = () => {
      const slugs = read();
      setSelected(slugs.includes(slug));
      setFull(slugs.length >= MAX);
    };
    update();
    window.addEventListener("aam:compare", update);
    return () => window.removeEventListener("aam:compare", update);
  }, [slug]);

  const toggle = () => {
    const slugs = read();
    write(slugs.includes(slug) ? slugs.filter((s) => s !== slug) : [...slugs, slug]);
  };

  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-steel-400 hover:text-paper-100">
      <input
        type="checkbox"
        checked={selected}
        disabled={!selected && full}
        onChange={toggle}
        aria-label={`Compare ${name}`}
      />
      Compare
    </label>
  );
}

export function CompareBar() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const update = () => setSlugs(read());
    update();
    window.addEventListener("aam:compare", update);
    return () => window.removeEventListener("aam:compare", update);
  }, []);

  if (slugs.length < 2) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-ink-600 bg-ink-900 px-4 py-2 shadow-2xl">
      <span className="text-sm font-semibold text-paper-100">{slugs.length} selected</span>
      <Link
        href={`/compare?p=${slugs.join(",")}`}
        className="rounded-full bg-race-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-race-700"
      >
        Compare
      </Link>
      <button onClick={() => write([])} className="text-xs text-steel-400 hover:text-race-500" aria-label="Clear comparison selection">
        Clear
      </button>
    </div>
  );
}
