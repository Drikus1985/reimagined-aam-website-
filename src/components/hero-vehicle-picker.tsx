"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveVehicle, setActiveVehicleClient } from "@/lib/client/store";

type VehicleData = {
  makes: { slug: string; name: string; models: { slug: string; name: string; yearFrom: number; yearTo: number }[] }[];
};

/** Year/Make/Model hero selector — saves to My Garage and jumps to fitted parts. */
export function HeroVehiclePicker() {
  const router = useRouter();
  const [data, setData] = useState<VehicleData | null>(null);
  const [makeSlug, setMakeSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    fetch("/api/vehicle-data")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const make = useMemo(() => data?.makes.find((m) => m.slug === makeSlug), [data, makeSlug]);
  const model = useMemo(() => make?.models.find((m) => m.slug === modelSlug), [make, modelSlug]);
  const years = useMemo(() => {
    if (!model) return [];
    const list: number[] = [];
    for (let y = model.yearTo; y >= model.yearFrom; y--) list.push(y);
    return list;
  }, [model]);

  const onFind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make) {
      router.push("/vehicles");
      return;
    }
    const v = saveVehicle({
      makeSlug: make.slug,
      makeName: make.name,
      modelSlug: model?.slug,
      modelName: model?.name,
      year: year ? parseInt(year, 10) : undefined,
    });
    setActiveVehicleClient(v.id);
    router.push("/shop?fit=vehicle");
  };

  const selectClass =
    "w-full rounded-md border border-ink-700 bg-ink-850 px-3.5 py-3 text-[15px] font-semibold text-paper-50 focus:border-race-600";

  return (
    <form onSubmit={onFind} className="overflow-hidden rounded-xl border border-ink-700 bg-ink-950/90">
      <div className="h-1 bg-gradient-to-r from-race-600 to-race-700" aria-hidden="true" />
      <div className="flex flex-col gap-3.5 p-6 sm:p-7">
        <div className="flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e01c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 17h14l-1.5-5.5a2 2 0 0 0-2-1.5H8.5a2 2 0 0 0-2 1.5L5 17z" />
            <path d="M3 17h18" />
            <circle cx="7.5" cy="19.5" r="1.5" />
            <circle cx="16.5" cy="19.5" r="1.5" />
          </svg>
          <h2 className="headline text-xl text-paper-50">Find parts that fit your car</h2>
        </div>
        <label className="sr-only" htmlFor="hero-make">Make</label>
        <select
          id="hero-make"
          className={selectClass}
          value={makeSlug}
          onChange={(e) => { setMakeSlug(e.target.value); setModelSlug(""); setYear(""); }}
        >
          <option value="">Make — Ford, Chevrolet, Dodge…</option>
          {data?.makes.map((m) => (
            <option key={m.slug} value={m.slug}>{m.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="hero-model">Model</label>
        <select
          id="hero-model"
          className={selectClass}
          value={modelSlug}
          onChange={(e) => { setModelSlug(e.target.value); setYear(""); }}
          disabled={!make}
        >
          <option value="">Model</option>
          {make?.models.map((m) => (
            <option key={m.slug} value={m.slug}>{m.name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="hero-year">Year</label>
        <select
          id="hero-year"
          className={selectClass}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          disabled={!model}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-md bg-race-600 px-6 py-3.5 font-bold uppercase tracking-wide text-white hover:bg-race-700"
        >
          Find my parts
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </button>
        <p className="text-xs leading-relaxed text-steel-400">
          Saves to <span className="font-bold text-brass-400">My Garage</span> — every product page then shows{" "}
          <span className="font-bold text-emerald-400">CONFIRMED FIT</span>, UNIVERSAL or NOT COMPATIBLE. No more guesswork orders.
        </p>
      </div>
    </form>
  );
}
