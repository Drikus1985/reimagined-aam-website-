"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const password = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.refresh();
    else {
      setError("Incorrect password.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      {error && <p className="text-sm text-race-500" role="alert">{error}</p>}
      <label htmlFor="admin-pass" className="block text-sm text-steel-300">Admin password</label>
      <input
        id="admin-pass" name="password" type="password" required autoComplete="current-password"
        className="w-full rounded border border-ink-700 bg-ink-900 px-3 py-2.5 text-paper-50"
      />
      <button disabled={busy} className="w-full rounded bg-race-600 px-4 py-2.5 font-bold text-white hover:bg-race-700 disabled:bg-ink-700">
        {busy ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
