"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Donor } from "@/lib/types";

const TICKET = 250;
const empty = { full_name: "", phone: "", email: "", ticket_count: 1, referred_by: "", status: "paid" };

export default function AdminClient() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/donors");
    if (r.status === 401) return (window.location.href = "/admin/login");
    setDonors((await r.json()).donors ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const names = useMemo(() => new Map(donors.map((d) => [d.id, d.full_name])), [donors]);
  const paid = donors.filter((d) => d.status === "paid").reduce((n, d) => n + d.ticket_count, 0);
  const pledged = donors.filter((d) => d.status === "pledged").reduce((n, d) => n + d.ticket_count, 0);
  const shown = donors.filter((d) => d.full_name.toLowerCase().includes(q.toLowerCase()));

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
    if (!confirm(`Delete ${d.full_name}?`)) return;
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
          <a className="btn-secondary" href="/">Public page</a>
          <a className="btn-secondary" href="/api/export">Export CSV</a>
          <button className="btn-secondary" onClick={logout}>Sign out</button>
        </div>
      </div>

      <p className="mt-3 text-sm">
        <b>{paid}</b> paid (${(paid * TICKET).toLocaleString()}) · <b>{pledged}</b> pledged · <b>{313 - paid}</b> to go
      </p>

      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-6">
        <input className="input sm:col-span-2" placeholder="Full name *" aria-label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <input className="input" placeholder="Phone" aria-label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="number" min={1} max={100} aria-label="Tickets" value={form.ticket_count} onChange={(e) => setForm({ ...form, ticket_count: Number(e.target.value) })} />
        <select className="input" aria-label="Brought by" value={form.referred_by} onChange={(e) => setForm({ ...form, referred_by: e.target.value })}>
          <option value="">Brought by…</option>
          {donors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </select>
        <select className="input" aria-label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="paid">Paid</option>
          <option value="pledged">Pledged</option>
        </select>
        <button className="btn-primary sm:col-span-2" type="submit">Add donor</button>
        {msg && <p role="alert" className="text-sm text-red-700 sm:col-span-6">{msg}</p>}
      </form>

      <input className="input mt-6" placeholder="Search by name…" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-dark text-xs uppercase">
            <tr><th className="p-3">Name</th><th>Contact</th><th>Tix</th><th>Brought by</th><th>Status</th><th>Public</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id} className="border-t border-sand-dark">
                <td className="p-3 font-semibold">{d.full_name}</td>
                <td className="text-xs">{d.phone}<br />{d.email}</td>
                <td>{d.ticket_count}</td>
                <td>{d.referred_by ? names.get(d.referred_by) : "—"}</td>
                <td>
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${d.status === "paid" ? "bg-emerald text-sand" : "bg-gold-light text-ink"}`}
                    onClick={() => patch(d.id, { status: d.status === "paid" ? "pledged" : "paid" })}
                    aria-label={`Toggle status for ${d.full_name}`}
                  >{d.status === "paid" ? "Paid" : "Pledged → mark paid"}</button>
                </td>
                <td>
                  <input type="checkbox" checked={d.show_public} aria-label={`Show ${d.full_name} on leaderboard`} onChange={(e) => patch(d.id, { show_public: e.target.checked })} />
                </td>
                <td><button className="px-3 text-red-700" onClick={() => remove(d)} aria-label={`Delete ${d.full_name}`}>✕</button></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td className="p-4 text-ink/60" colSpan={7}>No donors yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
