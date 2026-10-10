"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PAYMENT_METHODS } from "@/lib/types";
import { formatTicket, parseTicketList } from "@/lib/tickets";

interface Row {
  ticket_no: number;
  paid: boolean;
  received_on: string | null;
  pay_method: string | null;
  bank_memo: string | null;
  passed_on: boolean;
  passed_to: string | null;
  donors: { full_name: string; email: string | null; phone: string | null } | null;
}
interface Ev { id: number; ticket_no: number; action: string; detail: string | null; created_at: string }

const today = () => new Date().toISOString().slice(0, 10);
type Filter = "all" | "unpaid" | "paid";

export default function TicketsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [price, setPrice] = useState(250);
  const [emailOn, setEmailOn] = useState<boolean | null>(null);
  const [list, setList] = useState("");
  const [method, setMethod] = useState("zelle");
  const [date, setDate] = useState(today());
  const [memo, setMemo] = useState("");
  const [filter, setFilter] = useState<Filter>("unpaid");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [t, e] = await Promise.all([fetch("/api/tickets"), fetch("/api/tickets/events")]);
    if (t.status === 401) return (window.location.href = "/admin/login");
    setRows((await t.json()).tickets ?? []);
    setEvents((await e.json()).events ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j) { setPrice(j.settings.ticket_price); setEmailOn(j.email_configured); }
    });
  }, []);

  const byNo = useMemo(() => new Map(rows.map((r) => [r.ticket_no, r])), [rows]);
  const parsed = useMemo(() => (list.trim() ? parseTicketList(list) : null), [list]);
  const preview = useMemo(() => {
    if (!parsed || "error" in parsed) return null;
    const known = parsed.numbers.filter((n) => byNo.has(n));
    const unknown = parsed.numbers.filter((n) => !byNo.has(n));
    const owners = Array.from(new Set(known.map((n) => byNo.get(n)!.donors?.full_name ?? "?")));
    return { known, unknown, owners };
  }, [parsed, byNo]);

  const paidCount = rows.filter((r) => r.paid).length;
  const shown = rows.filter((r) => {
    if (filter === "paid" && !r.paid) return false;
    if (filter === "unpaid" && r.paid) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase().replace(/^iccr-?/, "");
    return (
      String(r.ticket_no) === needle ||
      (r.donors?.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.donors?.email ?? "").toLowerCase().includes(q.toLowerCase())
    );
  });

  async function mark(tickets: string, paid: boolean) {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/tickets/paid", { method: "POST", body: JSON.stringify({ tickets, paid, method, received_on: date, memo }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: j.error ?? "Something went wrong" });
    const bits = [`${j.updated.length} ticket(s) marked ${paid ? "paid" : "unpaid"}`];
    if (j.unchanged.length) bits.push(`${j.unchanged.length} already ${paid ? "paid" : "unpaid"}`);
    if (j.missing.length) bits.push(`not found: ${j.missing.map(formatTicket).join(", ")}`);
    if (paid && j.emailed) bits.push(`${j.emailed} receipt email(s) sent`);
    setMsg({ ok: j.missing.length === 0, text: bits.join(" · ") });
    setList(""); setMemo("");
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-bold text-emerald">Tickets</h1>
        <div className="flex gap-2">
          <a className="btn-secondary" href="/admin">Pledgers</a>
          <a className="btn-secondary" href="/api/export">Export CSV</a>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink/80">
        <b>{rows.length}</b> pledged · <b>{paidCount}</b> paid · <b>{rows.length - paidCount}</b> awaiting payment. Check the
        bank, find the ticket number in each memo, and mark it paid here.
      </p>
      {emailOn === false && (
        <p className="mt-2 rounded-xl bg-sand-dark p-3 text-xs">Email isn&apos;t set up yet, so receipts won&apos;t be sent when you mark tickets paid. Tickets still update.</p>
      )}

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm" aria-label="Mark tickets paid">
        <h2 className="font-serif text-xl font-semibold text-emerald">Mark tickets paid</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-6">
            <label htmlFor="list" className="block text-sm font-semibold">Ticket numbers from the bank memo</label>
            <input id="list" className="input mt-1" placeholder="ICCR-2, 3, 5-9" value={list} onChange={(e) => setList(e.target.value)} autoComplete="off" />
            <p className="mt-1 text-xs text-ink/70" aria-live="polite">
              {parsed && "error" in parsed && <span className="text-red-700">{parsed.error}</span>}
              {preview && (
                <>
                  {preview.known.length} ticket(s) = ${(preview.known.length * price).toLocaleString()}
                  {preview.owners.length > 0 && <> · {preview.owners.join(", ")}</>}
                  {preview.unknown.length > 0 && <span className="text-red-700"> · not pledged: {preview.unknown.map(formatTicket).join(", ")}</span>}
                </>
              )}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="method" className="block text-sm font-semibold">Method</label>
            <select id="method" className="input mt-1 capitalize" value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="date" className="block text-sm font-semibold">Received on</label>
            <input id="date" type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="memo" className="block text-sm font-semibold">Bank memo (optional)</label>
            <input id="memo" className="input mt-1" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:col-span-6">
            <button className="btn-primary" disabled={busy || !preview || preview.known.length === 0} onClick={() => mark(list, true)}>Mark paid</button>
            <button className="btn-secondary" disabled={busy || !preview || preview.known.length === 0} onClick={() => mark(list, false)}>Mark unpaid</button>
          </div>
          {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm sm:col-span-6 ${msg.ok ? "text-emerald" : "text-red-700"}`}>{msg.text}</p>}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["unpaid", "paid", "all"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${filter === f ? "bg-emerald text-sand" : "bg-white text-emerald shadow-sm"}`}>
            {f}
          </button>
        ))}
        <input className="input !w-auto min-w-[14rem] flex-1" placeholder="Search ticket #, name, or email…" aria-label="Search tickets" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-dark text-xs uppercase">
            <tr><th className="p-3">Ticket</th><th>Pledger</th><th>Status</th><th>Received</th><th>Bank memo</th><th>Passed to</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.ticket_no} className="border-t border-sand-dark">
                <td className="whitespace-nowrap p-3 font-mono text-xs font-bold">{formatTicket(r.ticket_no)}</td>
                <td><span className="font-semibold">{r.donors?.full_name}</span><br /><span className="text-xs text-ink/70">{r.donors?.email}</span></td>
                <td>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.paid ? "bg-emerald text-sand" : "bg-sand-dark text-ink"}`}>{r.paid ? "Paid" : "Pledged"}</span>
                </td>
                <td className="whitespace-nowrap text-xs">{r.received_on}{r.pay_method ? ` · ${r.pay_method}` : ""}</td>
                <td className="text-xs">{r.bank_memo}</td>
                <td className="text-xs">{r.passed_on ? r.passed_to || "yes" : ""}</td>
                <td className="whitespace-nowrap pr-3">
                  <button className="text-emerald underline disabled:opacity-50" disabled={busy} onClick={() => mark(String(r.ticket_no), !r.paid)}>
                    {r.paid ? "Mark unpaid" : "Mark paid"}
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td className="p-4 text-ink/60" colSpan={7}>{rows.length === 0 ? "No tickets yet." : "Nothing matches."}</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-serif text-xl font-semibold text-emerald">Recent activity</h2>
      <ul className="mt-2 divide-y divide-sand-dark rounded-2xl bg-white text-sm shadow-sm">
        {events.map((e) => (
          <li key={e.id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
            <span><b>{formatTicket(e.ticket_no)}</b> · {e.action}{e.detail ? ` (${e.detail})` : ""}</span>
            <span className="text-xs text-ink/60">{new Date(e.created_at).toLocaleString()}</span>
          </li>
        ))}
        {events.length === 0 && <li className="px-4 py-3 text-ink/60">Nothing yet.</li>}
      </ul>
    </main>
  );
}
