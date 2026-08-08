"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getGarageClient, removeVehicle, saveVehicle, setActiveVehicleClient, GarageState,
} from "@/lib/client/store";
import { describeVehicle } from "@/lib/fitment";

type VehicleData = {
  makes: { slug: string; name: string; models: { slug: string; name: string; yearFrom: number; yearTo: number }[] }[];
  engines: { slug: string; name: string; make: string | null }[];
};

export function GarageManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<VehicleData | null>(null);
  const [garage, setGarage] = useState<GarageState>({ vehicles: [], activeId: null });
  const [makeSlug, setMakeSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [year, setYear] = useState("");
  const [engineSlug, setEngineSlug] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    setGarage(getGarageClient());
    const update = () => setGarage(getGarageClient());
    window.addEventListener("aam:garage", update);
    fetch("/api/vehicle-data").then((r) => r.json()).then(setData).catch(() => setData(null));
    return () => window.removeEventListener("aam:garage", update);
  }, []);

  // Support /garage?add=make:model deep links from Shop by Vehicle.
  useEffect(() => {
    const add = searchParams.get("add");
    if (add && add.includes(":")) {
      const [mk, md] = add.split(":");
      setMakeSlug(mk);
      setModelSlug(md);
    }
  }, [searchParams]);

  const make = useMemo(() => data?.makes.find((m) => m.slug === makeSlug), [data, makeSlug]);
  const model = useMemo(() => make?.models.find((m) => m.slug === modelSlug), [make, modelSlug]);
  const years = useMemo(() => {
    if (!model) return [];
    const list: number[] = [];
    for (let y = model.yearTo; y >= model.yearFrom; y--) list.push(y);
    return list;
  }, [model]);
  const engines = useMemo(() => {
    if (!data) return [];
    if (!make) return data.engines;
    // Engine families for the chosen make first, then the rest (engine swaps happen).
    return [...data.engines.filter((e) => e.make === make.name), ...data.engines.filter((e) => e.make !== make.name)];
  }, [data, make]);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make) return;
    const engine = data?.engines.find((en) => en.slug === engineSlug);
    saveVehicle({
      makeSlug: make.slug,
      makeName: make.name,
      modelSlug: model?.slug,
      modelName: model?.name,
      year: year ? parseInt(year, 10) : undefined,
      engineFamilySlug: engine?.slug,
      engineFamilyName: engine?.name,
      nickname: nickname || undefined,
    });
    setNickname("");
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-8">
      {garage.vehicles.length > 0 && (
        <section aria-label="Saved vehicles">
          <h2 className="headline text-lg text-paper-50">Saved vehicles</h2>
          <ul className="mt-3 space-y-2">
            {garage.vehicles.map((v) => {
              const active = garage.activeId === v.id;
              return (
                <li key={v.id} className={`flex flex-wrap items-center gap-3 rounded-lg border p-4 ${active ? "border-race-600 bg-ink-900" : "border-ink-800 bg-ink-900"}`}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-paper-50">{v.nickname || describeVehicle(v)}</p>
                    {v.nickname && <p className="text-xs text-steel-400">{describeVehicle(v)}</p>}
                    {active && <p className="text-xs font-semibold text-race-500">Active — fitment is checked against this vehicle</p>}
                  </div>
                  {!active && (
                    <button
                      onClick={() => { setActiveVehicleClient(v.id); router.refresh(); }}
                      className="rounded border border-ink-600 px-3 py-1.5 text-sm font-semibold text-paper-100 hover:border-race-600"
                    >
                      Set active
                    </button>
                  )}
                  <Link
                    href="/shop?fit=vehicle"
                    onClick={() => setActiveVehicleClient(v.id)}
                    className="rounded bg-race-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-race-700"
                  >
                    Shop parts that fit
                  </Link>
                  <button
                    onClick={() => { removeVehicle(v.id); router.refresh(); }}
                    className="text-sm text-steel-400 hover:text-race-500"
                    aria-label={`Remove ${describeVehicle(v)}`}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-label="Add a vehicle" className="rounded-lg border border-ink-800 bg-ink-900 p-5">
        <h2 className="headline text-lg text-paper-50">Add a vehicle</h2>
        {!data ? (
          <p className="mt-3 text-sm text-steel-400">Loading vehicle data…</p>
        ) : (
          <form onSubmit={onSave} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="g-make" className="mb-1 block text-sm text-steel-300">Make</label>
              <select id="g-make" value={makeSlug} onChange={(e) => { setMakeSlug(e.target.value); setModelSlug(""); setYear(""); }} required
                className="w-full rounded border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-paper-50">
                <option value="" disabled>Select make…</option>
                {data.makes.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="g-model" className="mb-1 block text-sm text-steel-300">Model</label>
              <select id="g-model" value={modelSlug} onChange={(e) => { setModelSlug(e.target.value); setYear(""); }} disabled={!make}
                className="w-full rounded border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-paper-50 disabled:opacity-50">
                <option value="">Any / not listed</option>
                {make?.models.map((m) => <option key={m.slug} value={m.slug}>{m.name} ({m.yearFrom}–{m.yearTo})</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="g-year" className="mb-1 block text-sm text-steel-300">Year</label>
              <select id="g-year" value={year} onChange={(e) => setYear(e.target.value)} disabled={!model}
                className="w-full rounded border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-paper-50 disabled:opacity-50">
                <option value="">Any</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="g-engine" className="mb-1 block text-sm text-steel-300">Engine family</label>
              <select id="g-engine" value={engineSlug} onChange={(e) => setEngineSlug(e.target.value)}
                className="w-full rounded border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-paper-50">
                <option value="">Not sure / stock</option>
                {engines.map((en) => <option key={en.slug} value={en.slug}>{en.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="g-nick" className="mb-1 block text-sm text-steel-300">Nickname (optional)</label>
              <input id="g-nick" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. The weekend Camaro"
                className="w-full rounded border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-paper-50 placeholder:text-steel-400" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={!makeSlug} className="rounded bg-race-600 px-6 py-2.5 font-bold uppercase tracking-wide text-white hover:bg-race-700 disabled:bg-ink-700 disabled:text-steel-400">
                Save to garage
              </button>
              <p className="mt-2 text-xs text-steel-400">
                Not sure which engine you have? Read{" "}
                <Link href="/articles/sbc-vs-bbc-how-to-identify" className="text-race-500 hover:underline">our identification guide</Link>{" "}
                or ask the AI specialist.
              </p>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
