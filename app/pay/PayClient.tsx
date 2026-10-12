"use client";
import { useCallback, useEffect, useState } from "react";
import { formatTicket } from "@/lib/tickets";
import { dollars, feeCents } from "@/lib/fee";

interface Row { no: number; paid: boolean; owner: string }

export default function PayClient({ initial }: { initial: string }) {
  const [q, setQ] = useState(initial);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [missing, setMissing] = useState<number[]>([]);
  const [price, setPrice] = useState(250);
  const [cardOn, setCardOn] = useState(true);
  const [pick, setPick] = useState<Set<number>>(new Set());
  const [cover, setCover] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const find = useCallback(async (text: string) => {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/pay/lookup", { method: "POST", body: JSON.stringify({ tickets: text }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setRows(null); return setErr(j.error ?? "Something went wrong."); }
    setRows(j.tickets);
    setMissing(j.notFound);
    setPrice(j.price);
    setCardOn(j.card_enabled);
    setPick(new Set(j.tickets.filter((t: Row) => !t.paid).map((t: Row) => t.no)));
  }, []);
  useEffect(() => { if (initial) find(initial); }, [initial, find]);

  const chosen = rows?.filter((r) => pick.has(r.no)) ?? [];
  const base = chosen.length * price * 100;
  const fee = cover && base > 0 ? feeCents(base) : 0;

  async function pay() {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ tickets: chosen.map((c) => c.no), coverFee: cover }) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.url) { window.location.href = j.url; return; }
    setBusy(false);
    setErr(j.error ?? "Something went wrong.");
  }

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); find(q); }} className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <label htmlFor="t" className="block text-sm font-semibold">Ticket number(s)</label>
        <input id="t" className="input !py-3" placeholder="ICCR-4" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" required />
        <p className="text-xs text-ink/70">Several? Separate them: ICCR-4, 5, 7</p>
        <button className="btn-primary w-full !py-3" type="submit" disabled={busy}>{busy && !rows ? "Looking…" : "Find my ticket"}</button>
      </form>
      {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}

      {rows && (
        <section className="mt-6 space-y-3" aria-label="Tickets">
          {rows.map((r) => (
            <label key={r.no} className={`flex min-h-[56px] items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ${r.paid ? "opacity-60" : "cursor-pointer"}`}>
              <input type="checkbox" className="h-5 w-5" disabled={r.paid} checked={pick.has(r.no)}
                onChange={(e) => setPick((p) => { const n = new Set(p); e.target.checked ? n.add(r.no) : n.delete(r.no); return n; })} />
              <span className="flex-1">
                <span className="font-serif text-xl font-bold text-emerald">{formatTicket(r.no)}</span>
                <span className="ml-2 text-sm text-ink/70">pledged by {r.owner}</span>
              </span>
              <span className="text-sm font-semibold">{r.paid ? "Already paid" : `$${price}`}</span>
            </label>
          ))}
          {missing.length > 0 && <p className="text-sm text-red-700">Not found: {missing.map(formatTicket).join(", ")}. Check the number with the person who sent it.</p>}

          {chosen.length > 0 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-5 w-5" checked={cover} onChange={(e) => setCover(e.target.checked)} />
                <span>I&apos;ll cover the card processing fee ({dollars(feeCents(base))}) so ICCR receives the full amount.</span>
              </label>
              <p className="mt-3 font-serif text-2xl font-bold text-emerald" aria-live="polite">
                Total {dollars(base + fee)}
              </p>
              <p className="text-xs text-ink/70">{chosen.length} ticket{chosen.length > 1 ? "s" : ""} × ${price}{fee ? ` + ${dollars(fee)} fee` : ""}</p>
              {cardOn ? (
                <button className="btn-primary mt-4 w-full !py-3 text-base" onClick={pay} disabled={busy}>
                  {busy ? "Opening secure checkout…" : "Pay by card, Apple Pay or Google Pay"}
                </button>
              ) : (
                <p className="mt-4 rounded-xl bg-sand-dark p-3 text-sm">Card payments aren&apos;t available yet. Please pay by Zelle or Venmo (@ICCR1) and put the ticket number in the memo.</p>
              )}
            </div>
          )}
        </section>
      )}
    </>
  );
}
