/** AAM shield badge + wordmark lockup, per the approved restyle mockups. */
export function AamBadge({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 1.5 L28.5 5.5 V16 C28.5 24.2 22.3 28.6 16 30.5 C9.7 28.6 3.5 24.2 3.5 16 V5.5 Z"
        fill="#20242a"
        stroke="#e01c3c"
        strokeWidth="1.6"
      />
      <polygon
        points="16,6.2 17.3,9.1 20.4,9.4 18.1,11.5 18.8,14.5 16,12.9 13.2,14.5 13.9,11.5 11.6,9.4 14.7,9.1"
        fill="#d3a959"
      />
      <rect x="9" y="17.5" width="14" height="2.2" fill="#c8102e" />
      <rect x="10.8" y="21.5" width="10.4" height="2" fill="#efebe2" opacity="0.75" />
    </svg>
  );
}

export function AamLogo({ tagline = true }: { tagline?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <AamBadge />
      <span className="flex flex-col">
        <span className="flex items-baseline gap-1.5">
          <span className="headline text-xl leading-none text-paper-50 sm:text-2xl">ALL AMERICAN</span>
          <span className="headline text-xl leading-none text-race-500 sm:text-2xl">MUSCLE</span>
        </span>
        {tagline && (
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.28em] text-steel-400 sm:block">
            Parts · Restorations · Engines
          </span>
        )}
      </span>
    </span>
  );
}
