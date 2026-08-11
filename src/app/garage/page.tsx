import { Metadata } from "next";
import { Suspense } from "react";
import { GarageManager } from "./garage-manager";

export const metadata: Metadata = {
  title: "My Garage",
  description: "Save your American vehicles and see instantly whether parts fit — confirmed, universal, needs verification, or not compatible.",
  alternates: { canonical: "/garage" },
};

export default function GaragePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="headline text-3xl text-paper-50">My Garage</h1>
      <div className="rule-red mt-2" />
      <p className="mt-3 text-steel-300">
        Save your vehicle and every product page will tell you whether a part is a{" "}
        <strong className="text-emerald-400">confirmed fit</strong>,{" "}
        <strong className="text-sky-400">universal with requirements</strong>,{" "}
        <strong className="text-amber-400">a potential fit needing verification</strong>, or{" "}
        <strong className="text-race-500">not compatible</strong>. Stored on this device only.
      </p>
      <Suspense fallback={<p className="mt-6 text-sm text-steel-400">Loading garage…</p>}>
        <GarageManager />
      </Suspense>
    </div>
  );
}
