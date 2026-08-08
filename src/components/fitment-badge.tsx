import { FitmentVerdict } from "@/lib/fitment";

const STYLES: Record<FitmentVerdict["status"], string> = {
  CONFIRMED: "bg-emerald-950 text-emerald-300 border-emerald-700",
  UNIVERSAL: "bg-sky-950 text-sky-300 border-sky-800",
  POTENTIAL: "bg-amber-950 text-amber-300 border-amber-700",
  NOT_COMPATIBLE: "bg-race-700/20 text-race-500 border-race-700",
  UNKNOWN: "bg-ink-800 text-steel-300 border-ink-600",
};

const ICONS: Record<FitmentVerdict["status"], string> = {
  CONFIRMED: "✓",
  UNIVERSAL: "◈",
  POTENTIAL: "?",
  NOT_COMPATIBLE: "✕",
  UNKNOWN: "·",
};

export function FitmentBadge({ verdict, small }: { verdict: FitmentVerdict; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 ${small ? "py-0.5 text-[11px]" : "py-1 text-xs"} font-semibold ${STYLES[verdict.status]}`}
    >
      <span aria-hidden="true">{ICONS[verdict.status]}</span>
      {verdict.label}
    </span>
  );
}
