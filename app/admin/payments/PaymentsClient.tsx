"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Donor } from "@/lib/types";
import { PAYMENT_METHODS } from "@/lib/types";
import { formatTicket, parseTicket } from "@/lib/tickets";

interface Row {
  id: string;
  amount: number;
  method: string;
  received_on: string;
  memo: string | null;
  voided_at: string | null;
  donors: { full_name: string; ticket_no: number } | null;
}

const today = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function PaymentsClient({ initialTicket }: { initialTicket: string }) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [price, setPrice] = useState(250);
  const [payments, setPayments] = useState<Row[]>([]);
  const [ticket, setTicket] = useState(initialTicket ? formatTicket(Number(initialTicket) || 0) : "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("zelle");
  const [date, setDate] = useState(today());
  const [memo, setMemo] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, p] = await Promise.all([fetch("/api/donors"), fetch("/api/payments")]);
    if (d.status === 401) return (window.location.href = "/admin/login");
    setDonors((await d.json()).donors ?? []);
    setPayments((await p.json()).payments ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then((j) => j && setPrice(j.settings.ticket_price));
  }, []);

  const no = parseTicket(ticket);
  const match = useMemo(() => donors.find((d) => d.ticket_no === no), [donors, no]);
  const due = match ? match.ticket_count * price : 0;
  const balance = match ? Math.max(0, due - (match.paid_amount ?? 0)) : 0;

  // Prefill the amount with the outstanding balance when a pledge is picked.
  useEffect(() => { if (match) setAmount(String(balance || due)); }, [match?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const unpaid = donors.filter((d) => (d.paid_amount ?? 0) < d.ticket_count * price).sort((a, b) => a.ticket_no - b.ticket_no);

  async function record(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/payments", { method: "POST", body: JSON.stringify({ ticket, amount, method, received_on: date, memo }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: j.error ?? "Could not record payment" });
    setMsg({ ok: true, text: `Recorded for ${j.ticket} (${j.donor}). Balance now ${money(j.balance)}${j.status === "paid" ? ": paid in full." : "."}` });
    setTicket(""); setAmount(""); setMemo(""); setDate(today());
    load();
  }

  async function voidPayment(p: Row) {
    if (!confirm(`Void ${money(p.amount)} for ${p.donors ? formatTicket(p.donors.ticket_no) : "this pledge"}?`)) return;
    await fetch(`/api/payments/${p.id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-bold text-emerald">Payments</h1>
        <a className="btn-secondary" href="/admin">Back to pledges</a>
      </div>
      <p className="mt-2 text-sm text-ink/80">
        Check the bank, find the ICCR ticket number in the memo, and record the payment against it.
      </p>

      <form onSubmit={record} className="mt-6 grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor="ticket" className="block text-sm font-semibold">Ticket # from memo</label>
          <input id="ticket" className="input mt-1" placeholder="ICCR-0042" value={ticket} onChange={(e) => setTicket(e.target.value)} autoComplete="off" required />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-semibold">Amount ($)</label>
          <input id="amount" type="number" min={1} className="input mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="method" className="block text-sm font-semibold">Method</label>
          <select id="method" className="input mt-1 capitalize" value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-semibold">Received on</label>
          <input id="date" type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="memo" className="block text-sm font-semibold">Bank memo</label>
          <input id="memo" className="input mt-1" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </div>
        <div className="text-sm sm:col-span-4" aria-live="polite">
          {no && !match && <span className="text-red-700">No pledge found for {formatTicket(no)}.</span>}
          {match && <span><b>{match.full_name}</b> · {match.ticket_count} ticket(s) · pledged {money(due)} · received {money(match.paid_amount ?? 0)} · <b>balance {money(balance)}</b></span>}
        </div>
        <button className="btn-primary sm:col-span-2" type="submit" disabled={busy || !match}>{busy ? "Saving…" : "Record payment"}</button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm sm:col-span-6 ${msg.ok ? "text-emerald" : "text-red-700"}`}>{msg.text}</p>}
      </form>

      <h2 className="mt-8 font-serif text-xl font-semibold text-emerald">To reconcile ({unpaid.length})</h2>
      <p className="text-sm text-ink/70">Pledges not yet paid in full. Look for these ticket numbers in the bank memos.</p>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-dark text-xs uppercase">
            <tr><th className="p-3">Ticket (memo)</th><th>Name</th><th>Pledged</th><th>Received</th><th>Balance</th><th></th></tr>
          </thead>
          <tbody>
            {unpaid.map((d) => {
              const dd = d.ticket_count * price;
              const got = d.paid_amount ?? 0;
              return (
                <tr key={d.id} className="border-t border-sand-dark">
                  <td className="p-3 font-mono text-xs">{formatTicket(d.ticket_no)}</td>
                  <td className="font-semibold">{d.full_name}</td>
                  <td>{money(dd)}</td>
                  <td>{money(got)}</td>
                  <td className="font-semibold">{money(dd - got)}</td>
                  <td><button className="px-3 text-emerald underline" onClick={() => { setTicket(formatTicket(d.ticket_no)); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Record</button></td>
                </tr>
              );
            })}
            {unpaid.length === 0 && <tr><td className="p-4 text-ink/60" colSpan={6}>Everything is paid. Alhamdulillah.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-serif text-xl font-semibold text-emerald">Recent payments</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-dark text-xs uppercase">
            <tr><th className="p-3">Received</th><th>Ticket</th><th>Name</th><th>Method</th><th>Amount</th><th>Memo</th><th></th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className={`border-t border-sand-dark ${p.voided_at ? "text-ink/40 line-through" : ""}`}>
                <td className="p-3">{p.received_on}</td>
                <td className="font-mono text-xs">{p.donors ? formatTicket(p.donors.ticket_no) : ""}</td>
                <td>{p.donors?.full_name}</td>
                <td className="capitalize">{p.method}</td>
                <td className="font-semibold">{money(p.amount)}</td>
                <td className="text-xs">{p.memo}</td>
                <td>{!p.voided_at && <button className="px-3 text-red-700" onClick={() => voidPayment(p)}>Void</button>}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td className="p-4 text-ink/60" colSpan={7}>No payments recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
