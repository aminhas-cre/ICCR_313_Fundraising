"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Donor } from "@/lib/types";
import { formatTicket } from "@/lib/tickets";

const empty = { full_name: "", phone: "", email: "", ticket_count: 1, referred_by: "", mark_paid: false };

export default function AdminClient() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [cfg, setCfg] = useState({ goal_donors: 313, ticket_price: 250, adjust_paid_amount: 0 });

  const load = useCallback(async () => {
    const r = await fetch("/api/donors");
    if (r.status === 401) return (window.location.href = "/admin/login");
    setDonors((await r.json()).donors ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then((j) => j && setCfg(j.settings));
  }, []);

  const names = useMemo(() => new Map(donors.map((d) => [d.id, d.full_name])), [donors]);
  const received = donors.reduce((n, d) => n + (d.paid_amount ?? 0), 0);
  const paidAmount = received + cfg.adjust_paid_amount;
  const paid = Math.floor(paidAmount / cfg.ticket_price);
  const outstanding = donors.reduce((n, d) => n + Math.max(0, d.ticket_count * cfg.ticket_price - (d.paid_amount ?? 0)), 0);
  const pledged = Math.ceil(outstanding / cfg.ticket_price);
  const needle = q.toLowerCase().replace(/^iccr-?0*/, "");
  const shown = donors.filter((d) => d.full_name.toLowerCase().includes(q.toLowerCase()) || (needle !== "" && String(d.ticket_no) === needle) || formatTicket(d.ticket_no).toLowerCase() === q.toLowerCase());

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/donors", { method: "POST", body: JSON.stringify(form) });
    if (!r.ok) return setMsg((await r.json()).error ?? "Error");
    setForm(empty);
    load();
  }
  async function patch(id: string, body: object) {
    await fetch(`/api/donors/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    load();
  }
  async function remove(d: Donor) {
    if (!confirm(`Delete ${d.full_name} and their payments? This cannot be undone.`)) return;
    await fetch(`/api/donors/${d.id}`, { method: "DELETE" });
    load();
  }
  async function logout() {
    await fetch("/api/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-bold text-emerald">313 Admin</h1>
        <div className="flex gap-2">
          <a className="btn-secondary" href="/admin/payments">Payments</a>
          <a className="btn-secondary" href="/admin/settings">Settings</a>
          <a className="btn-secondary" href="/">Public page</a>
          <a className="btn-secondary" href="/api/export">Export CSV</a>
          <button className="btn-secondary" onClick={logout}>Sign out</button>
        </div>
      </div>

      <p className="mt-3 text-sm">
        <b>{paid}</b> paid (${paidAmount.toLocaleString()}) · <b>{pledged}</b> pledged, unpaid · <b>{Math.max(0, cfg.goal_donors - paid)}</b> to go
      </p>

      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-6">
        <input className="input sm:col-span-2" placeholder="Full name *" aria-label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <input className="input" placeholder="Phone" aria-label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="number" min={1} max={100} aria-label="Tickets" value={form.ticket_count} onChange={(e) => setForm({ ...form, ticket_count: Number(e.target.value) })} />
        <select className="input" aria-label="Brought by" value={form.referred_by} onChange={(e) => setForm({ ...form, referred_by: e.target.value })}>
          <option value="">Brought by…</option>
          {donors.map((d) => <option key={d.id} value={d.id}>{formatTicket(d.ticket_no)} · {d.full_name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.mark_paid} onChange={(e) => setForm({ ...form, mark_paid: e.target.checked })} /> Already paid
        </label>
        <button className="btn-primary sm:col-span-2" type="submit">Add donor</button>
        {msg && <p role="alert" className="text-sm text-red-700 sm:col-span-6">{msg}</p>}
      </form>

      <input className="input mt-6" placeholder="Search by name or ticket # (ICCR-0042)…" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-dark text-xs uppercase">
            <tr><th className="p-3">Ticket</th><th>Name</th><th>Contact</th><th>Tix</th><th>Brought by</th><th>Received / Due</th><th>Status</th><th>Public</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((d) => {
              const due = d.ticket_count * cfg.ticket_price;
              const got = d.paid_amount ?? 0;
              const label = got >= due ? "Paid" : got > 0 ? "Partial" : "Pledged";
              return (
                <tr key={d.id} className="border-t border-sand-dark">
                  <td className="whitespace-nowrap p-3 font-mono text-xs">{formatTicket(d.ticket_no)}{d.source === "web" ? "" : " *"}</td>
                  <td className="font-semibold">{d.full_name}</td>
                  <td className="text-xs">{d.phone}<br />{d.email}</td>
                  <td>{d.ticket_count}</td>
                  <td>{d.referred_by ? names.get(d.referred_by) : "-"}</td>
                  <td className="whitespace-nowrap">${got.toLocaleString()} / ${due.toLocaleString()}</td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${label === "Paid" ? "bg-emerald text-sand" : label === "Partial" ? "bg-gold-light text-ink" : "bg-sand-dark text-ink"}`}>{label}</span>
                  </td>
                  <td>
                    <input type="checkbox" checked={d.show_public} aria-label={`Show ${d.full_name} publicly`} onChange={(e) => patch(d.id, { show_public: e.target.checked })} />
                  </td>
                  <td className="whitespace-nowrap">
                    <a className="text-emerald underline" href={`/admin/payments?ticket=${d.ticket_no}`}>Record payment</a>
                    <button className="px-3 text-red-700" onClick={() => remove(d)} aria-label={`Delete ${d.full_name}`}>✕</button>
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && <tr><td className="p-4 text-ink/60" colSpan={9}>No pledges yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
