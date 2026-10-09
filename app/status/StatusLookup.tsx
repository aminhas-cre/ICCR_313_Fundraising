"use client";
import { useState } from "react";
import StatusCard from "@/components/StatusCard";
import type { PledgeView } from "@/lib/types";

export default function StatusLookup() {
  const [ticket, setTicket] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<PledgeView | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setView(null);
    const r = await fetch("/api/status", { method: "POST", body: JSON.stringify({ ticket, email }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) setView(j.view);
    else setErr(j.error ?? "Something went wrong.");
  }

  return (
    <>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="ticket" className="block text-sm font-semibold">Ticket number</label>
          <input id="ticket" className="input mt-1 !py-3" placeholder="ICCR-0042" value={ticket} onChange={(e) => setTicket(e.target.value)} autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold">Email</label>
          <input id="email" type="email" className="input mt-1 !py-3" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        <button className="btn-primary w-full !py-3" type="submit" disabled={busy}>{busy ? "Checking…" : "Check status"}</button>
      </form>
      {view && <div className="mt-6"><StatusCard v={view} /></div>}
    </>
  );
}
