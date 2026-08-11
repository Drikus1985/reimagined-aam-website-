import { Metadata } from "next";
import Link from "next/link";
import { EnquiryForm } from "@/components/enquiry-form";
import { AskAiButton } from "@/components/ask-ai-button";

export const metadata: Metadata = {
  title: "Engine Building",
  description: "In-house V8 engine building: SBC, BBC, Ford Windsor & Cleveland, Mopar. Stock rebuilds to serious street/strip builds — machined, balanced, assembled, run-in.",
  alternates: { canonical: "/services/engine-building" },
};

export default function EngineBuildingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-race-500">Workshop services</p>
      <h1 className="headline mt-2 text-4xl text-paper-50">Engine Building</h1>
      <div className="rule-red mt-3" />
      <p className="mt-4 max-w-3xl text-lg text-steel-300">
        Small Block and Big Block Chevy, Ford Windsor and Cleveland, Mopar LA and B/RB — built in-house from
        precision machining through balancing, blueprint assembly and run-in. Honest combinations that make the
        power they promise on South African fuel.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Stock rebuilds", "Factory-spec rebuilds with quality rebuild kits — the sensible heart transplant for an original car."],
          ["Street performance", "Cam, heads, intake and carb combinations matched to your gears, converter and use. Reliable power you can drive daily."],
          ["Street / strip", "Forged rotating assemblies, ported heads, solid rollers — built to a power target with the supporting systems to live."],
        ].map(([title, text]) => (
          <div key={title} className="rounded-lg border border-ink-800 bg-ink-900 p-5">
            <h2 className="text-lg font-bold text-paper-50">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-steel-300">{text}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-steel-300">
        Building it yourself? Shop <Link href="/category/engines-components" className="text-race-500 hover:underline">engine components</Link>,{" "}
        <Link href="/search?q=rebuild+kit" className="text-race-500 hover:underline">rebuild kits</Link> and{" "}
        <Link href="/search?q=camshaft" className="text-race-500 hover:underline">camshafts</Link> — and read{" "}
        <Link href="/articles/flat-tappet-cam-break-in" className="text-race-500 hover:underline">our cam break-in guide</Link> first.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <EnquiryForm type="ENGINE_BUILD" heading="Talk to us about your engine" />
        <aside className="h-fit rounded-lg border border-ink-800 bg-ink-900 p-5">
          <h2 className="headline text-lg text-paper-50">Spec it with the AI specialist</h2>
          <p className="mt-2 text-sm text-steel-300">
            It gathers your combination — displacement, heads, cam, gears, fuel, use — and drafts a build brief for our engine room.
          </p>
          <div className="mt-3">
            <AskAiButton prompt="I'm planning an engine build. Interview me about my combination and goals, then put together a build brief." label="Spec my engine build" />
          </div>
        </aside>
      </div>
    </div>
  );
}
