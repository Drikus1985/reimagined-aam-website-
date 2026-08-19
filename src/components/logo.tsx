import Image from "next/image";

/**
 * Official AAM logo (pin-up script lockup, transparent background) —
 * pulled from the brand's own artwork. public/brand/aam-logo.webp is the
 * trimmed master; aam-logo-sm.webp is the small footer cut.
 */
export function AamLogo({ small = false }: { small?: boolean }) {
  return small ? (
    <Image src="/brand/aam-logo-sm.webp" alt="All American Muscle" width={160} height={76} className="h-14 w-auto" />
  ) : (
    <Image src="/brand/aam-logo.webp" alt="All American Muscle" width={310} height={148} priority className="h-14 w-auto sm:h-16" />
  );
}

/** Brand logo chip — black brand artwork stays on a light chip for contrast. */
export function BrandLogoChip({ src, name, small = false }: { src: string; name: string; small?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded bg-paper-50 ${small ? "px-2.5 py-1" : "px-3 py-1.5"}`}>
      {/* Brand marks come in arbitrary aspect ratios; plain img keeps it simple */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className={small ? "h-5 w-auto" : "h-7 w-auto"} />
    </span>
  );
}
