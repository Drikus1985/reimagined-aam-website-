import { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { AskAiButton } from "@/components/ask-ai-button";

export const metadata: Metadata = {
  title: "Muscle Car Restorations",
  description: "Frame-off restorations of classic Ford, Chevrolet, Dodge and Mopar in our 2000 m² Alberton workshop. From honest drivers to concours-level builds.",
  alternates: { canonical: "/services/restorations" },
};

const STEPS = [
  ["Assessment & plan", "We inspect the car together, agree the scope — sympathetic refresh, rotisserie restoration, or restomod — and set a realistic budget band and timeline."],
  ["Strip & bodywork", "Full disassembly, media blasting, metal repair with correct-gauge steel, panel fitment and paint in our booth."],
  ["Driveline & systems", "Engine building or refresh in-house, transmission, brakes, suspension, cooling, wiring — using parts from this catalogue."],
  ["Assembly & shakedown", "Careful reassembly, run-in, road testing and a handover file with everything documented."],
];

export default function RestorationsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-race-500">Workshop services</p>
      <h1 className="headline mt-2 text-4xl text-paper-50">Restorations</h1>
      <div className="rule-red mt-3" />
      <p className="mt-4 max-w-3xl text-lg text-steel-300">
        We restore classic American muscle — and nothing else. Ford, Chevrolet, Dodge and Mopar, from solid weekend
        drivers to full frame-off rebuilds, in a 2000 m² facility with body, paint, engine and trim under one roof.
      </p>

      <ol className="mt-10 grid gap-4 md:grid-cols-2">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="rounded-lg border border-ink-800 bg-ink-900 p-5">
            <p className="headline text-race-500">Step {i + 1}</p>
            <h2 className="mt-1 text-lg font-bold text-paper-50">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-300">{text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <EnquiryForm type="RESTORATION" heading="Start a restoration conversation" />
        <aside className="h-fit rounded-lg border border-ink-800 bg-ink-900 p-5">
          <h2 className="headline text-lg text-paper-50">Not sure where to start?</h2>
          <p className="mt-2 text-sm text-steel-300">
            Ask the AI specialist — it'll help you scope the project and produce a structured brief for our team.
          </p>
          <div className="mt-3">
            <AskAiButton prompt="I want to restore a classic American car. Help me plan where to start and build a project brief." label="Plan my restoration" />
          </div>
        </aside>
      </div>
    </div>
  );
}
