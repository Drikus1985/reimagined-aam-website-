"use client";

import { useState } from "react";
import { addToCart } from "@/lib/client/store";

export function AddToCartButton({
  productId,
  disabled,
  requiresVerification,
  verificationWarning,
  qty = 1,
  className,
  label = "Add to basket",
}: {
  productId: string;
  disabled?: boolean;
  /** Fitment-sensitive product whose fit is not confirmed for the customer's vehicle */
  requiresVerification?: boolean;
  verificationWarning?: string;
  qty?: number;
  className?: string;
  label?: string;
}) {
  const [added, setAdded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const doAdd = () => {
    addToCart(productId, qty);
    setAdded(true);
    setConfirming(false);
    setTimeout(() => setAdded(false), 1600);
  };

  const onClick = () => {
    if (requiresVerification && !confirming) {
      setConfirming(true);
      return;
    }
    doAdd();
  };

  if (confirming) {
    return (
      <div className="rounded border border-amber-700 bg-amber-950/60 p-3 text-sm" role="alertdialog" aria-label="Fitment verification warning">
        <p className="font-semibold text-amber-300">Fitment not verified for your vehicle</p>
        <p className="mt-1 text-amber-200/80">
          {verificationWarning ?? "This part needs fitment verification. You can add it anyway, or ask us to verify first — it takes minutes on WhatsApp."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={doAdd} className="rounded bg-amber-600 px-3 py-1.5 font-bold text-ink-950 hover:bg-amber-500">
            Add anyway
          </button>
          <a
            href="https://wa.me/27720426477?text=Hi%2C%20please%20verify%20fitment%20for%20a%20part%20on%20your%20site"
            target="_blank" rel="noopener noreferrer"
            className="rounded border border-amber-700 px-3 py-1.5 font-semibold text-amber-300 hover:bg-amber-950"
          >
            Verify via WhatsApp
          </a>
          <button onClick={() => setConfirming(false)} className="px-2 py-1.5 text-amber-200/70 hover:text-amber-200">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        className ??
        "w-full rounded bg-race-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-race-700 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-steel-400"
      }
    >
      {disabled ? "Out of stock" : added ? "Added ✓" : label}
    </button>
  );
}
