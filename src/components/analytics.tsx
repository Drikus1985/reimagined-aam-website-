"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Consent-aware, first-party analytics.
 * - No cookies or identifiers are set for analytics; the only stored value is
 *   the consent decision itself.
 * - With consent, a sendBeacon ping records path-level daily page-view counts
 *   (aggregated server-side, nothing per-visitor). Decline = zero requests.
 */

const CONSENT_COOKIE = "aam_consent";

function getConsent(): "granted" | "denied" | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "granted" || value === "denied" ? value : null;
}

function setConsent(value: "granted" | "denied") {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
  window.dispatchEvent(new CustomEvent("aam:consent"));
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy choices"
      className="fixed inset-x-2 bottom-2 z-50 mx-auto max-w-xl rounded-lg border border-ink-600 bg-ink-900 p-4 shadow-2xl sm:inset-x-auto sm:left-4"
    >
      <p className="text-sm text-paper-100">
        We'd like to count page views (anonymously, no tracking cookies, nothing shared with third parties)
        to understand which parts people look for. Okay with that?
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => { setConsent("granted"); setVisible(false); }}
          className="rounded bg-race-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-race-700"
        >
          Allow counting
        </button>
        <button
          onClick={() => { setConsent("denied"); setVisible(false); }}
          className="rounded border border-ink-600 px-4 py-1.5 text-sm font-semibold text-paper-100 hover:border-race-600"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}

export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (getConsent() !== "granted") return;
    if (pathname.startsWith("/admin")) return;
    try {
      navigator.sendBeacon("/api/analytics", JSON.stringify({ path: pathname }));
    } catch { /* analytics must never break the page */ }
  }, [pathname]);

  return null;
}
