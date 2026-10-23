"use client";
import { useState } from "react";

// Hidden $1 live-test donation: proves checkout, webhook and email work. Touches no pledge.
export default function TestGift() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/stripe/test-gift", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) return (window.location.href = j.url);
      setErr(j.error ?? "Could not start the test.");
    } catch {
      setErr("Could not start the test.");
    }
    setBusy(false);
  }

  return (
    <details className="mt-3 text-ink/50">
      <summary className="cursor-pointer list-none text-xs">Testing</summary>
      <div className="mt-2">
        <button type="button" className="btn-secondary" onClick={go} disabled={busy}>
          {busy ? "Opening…" : "Give $1 test donation"}
        </button>
        {err && <p role="alert" className="mt-1 text-xs text-red-700">{err}</p>}
      </div>
    </details>
  );
}
