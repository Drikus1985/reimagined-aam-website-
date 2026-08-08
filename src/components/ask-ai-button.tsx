"use client";

export function AskAiButton({ prompt, label = "Ask the AI specialist about this part" }: { prompt: string; label?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("aam:assistant", { detail: { prompt } }))}
      className="flex w-full items-center justify-center gap-2 rounded border border-ink-600 px-4 py-2.5 text-sm font-semibold text-paper-100 transition-colors hover:border-race-600 hover:text-white"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-4-1L3 20l1-5.5a8.5 8.5 0 1117-3z" />
      </svg>
      {label}
    </button>
  );
}
