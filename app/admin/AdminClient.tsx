"use client";
import { useCallback, useEffect, useState } from "react";
import { formatTicket } from "@/lib/tickets";

interface Pledger {
  id: string;
  created_at: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  show_public: boolean;
  source: "web" | "admin";
  tickets: { no: number; paid: boolean }[];
}

const empty = { full_name: "", phone: "", email: "", ticket_count: 1, mark_paid: false };

export default function AdminClient() {
  const [people, setPeople] = useState<Pledger[]>([]);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [goal, setGoal] = useState(313);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/donors");
    if (r.status === 401) return (window.location.href = "/admin/login");
    setPeople((await r.json()).donors ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/settings").then((r) => (r.ok ? r.json() : null)).then((j) => j && setGoal(j.settings.goal_donors));
  }, []);

  const all = people.flatMap((p) => p.tickets);
  const paid = all.filter((t) => t.paid).length;
  const needle = q.toLowerCase().replace(/^iccr-?/, "");
  const shown = people.filter(
    (p) =>
      !q.trim() ||
      p.full_name.toLowerCase().includes(q.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
      p.tickets.some((t) => String(t.no) === needle)
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/donors", { method: "POST", body: JSON.stringify(form) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: j.error ?? "Error" });
    setMsg({ ok: true, text: `Added ${j.tickets.map(formatTicket).join(", ")}` });
    setForm(empty);
    load();
  }
  async function patch(id: string, body: object) {
    await fetch(`/api/donors/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    load();
  }
  async function remove(p: Pledger) {
    if (!confirm(`Delete ${p.full_name} and their ${p.tickets.length} ticket(s)? The numbers become available again. This cannot be undone.`)) return;
    await fetch(`/api/donors/${p.id}`, { method: "DELETE" });
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
        <div className="flex flex-wrap gap-2">
          <a className="btn-primary" href="/admin/tickets">Tickets &amp; payments</a>
          <a className="btn-secondary" href="/admin/settings">Settings</a>
          <a className="btn-secondary" href="/">Public page</a>
          <a className="btn-secondary" href="/api/export">Export CSV</a>
          <button className="btn-secondary" onClick={logout}>Sign out</button>
        </div>
      </div>

      <p className="mt-3 text-sm">
        <b>{all.length}</b> pledged · <b>{paid}</b> paid · <b>{all.length - paid}</b> awaiting payment · <b>{Math.max(0, goal - all.length)}</b> numbers left of {goal}
      </p>

      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-6">
        <h2 className="font-serif text-lg font-semibold text-emerald sm:col-span-6">Add a pledge for someone</h2>
        <input className="input sm:col-span-2" placeholder="Full name *" aria-label="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <input className="input" placeholder="Phone" aria-label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" type="email" placeholder="Email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="number" min={1} max={100} aria-label="Tickets" value={form.ticket_count} onChange={(e) => setForm({ ...form, ticket_count: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input type="checkbox" checked={form.mark_paid} onChange={(e) => setForm({ ...form, mark_paid: e.target.checked })} /> Already paid
        </label>
        <button className="btn-primary sm:col-span-3" type="submit" disabled={busy}>{busy ? "Adding…" : "Add pledge"}</button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm sm:col-span-6 ${msg.ok ? "text-emerald" : "text-red-700"}`}>{msg.text}</p>}
      </form>

      <input className="input mt-6" placeholder="Search by name, email, or ticket # (ICCR-2)…" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-3 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-dark text-xs uppercase">
            <tr><th className="p-3">Name</th><th>Contact</th><th>Tickets</th><th>Public</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-t border-sand-dark align-top">
                <td className="p-3 font-semibold">{p.full_name}<br /><span className="text-xs font-normal text-ink/60">{p.source === "admin" ? "added by admin" : "self-pledged"}</span></td>
                <td className="text-xs">{p.phone}<br />{p.email}</td>
                <td className="py-3">
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {p.tickets.map((t) => (
                      <span key={t.no} title={t.paid ? "Paid" : "Pledged"} className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold ${t.paid ? "bg-emerald text-sand" : "bg-sand-dark text-ink"}`}>
                        {formatTicket(t.no)}{t.paid ? " ✓" : ""}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3">
                  <input type="checkbox" checked={p.show_public} aria-label={`Show ${p.full_name} by name publicly`} onChange={(e) => patch(p.id, { show_public: e.target.checked })} />
                </td>
                <td className="whitespace-nowrap py-3">
                  <button className="px-3 text-red-700" onClick={() => remove(p)} aria-label={`Delete ${p.full_name}`}>Delete</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td className="p-4 text-ink/60" colSpan={5}>No pledges yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
