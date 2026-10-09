"use client";
import { useEffect, useState } from "react";
import { buildReceipt } from "@/lib/receipt";

type Form = {
  goal_donors: string;
  ticket_price: string;
  zelle_email: string;
  zelle_note: string;
  adjust_paid_amount: string;
  adjust_pledged_amount: string;
  adjust_note: string;
  legal_name: string;
  ein: string;
  receipt_statement: string;
};

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function SettingsClient() {
  const [f, setF] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/settings");
      if (r.status === 401) return (window.location.href = "/admin/login");
      const { settings: s } = await r.json();
      setF({
        goal_donors: String(s.goal_donors),
        ticket_price: String(s.ticket_price),
        zelle_email: s.zelle_email,
        zelle_note: s.zelle_note,
        adjust_paid_amount: String(s.adjust_paid_amount),
        adjust_pledged_amount: String(s.adjust_pledged_amount),
        adjust_note: s.adjust_note ?? "",
        legal_name: s.legal_name,
        ein: s.ein,
        receipt_statement: s.receipt_statement,
      });
    })();
  }, []);

  if (!f) return <main className="mx-auto max-w-2xl px-4 py-10 text-sm">Loading…</main>;
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const goalAmount = (Number(f.goal_donors) || 0) * (Number(f.ticket_price) || 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const r = await fetch("/api/settings", { method: "PUT", body: JSON.stringify(f) });
    setSaving(false);
    if (r.ok) setMsg({ ok: true, text: "Saved. The public page is updated." });
    else setMsg({ ok: false, text: (await r.json()).error ?? "Could not save" });
  }

  const field = (id: keyof Form, label: string, hint?: string, type = "text") => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
      <input id={id} type={type} inputMode={type === "number" ? "numeric" : undefined} min={type === "number" ? 0 : undefined}
        className="input mt-1" value={f[id]} onChange={set(id)} />
      {hint && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
    </div>
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-serif text-3xl font-bold text-emerald">Campaign settings</h1>
        <a className="btn-secondary" href="/admin">Back to donors</a>
      </div>

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Goal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("goal_donors", "Founders needed", "Default 313", "number")}
            {field("ticket_price", "Ticket price ($)", "Default $250", "number")}
          </div>
          <p className="text-sm">Goal shown to the public: <b>{money(goalAmount)}</b></p>
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Offline adjustments</h2>
          <p className="text-sm text-ink/70">
            Added on top of the donors you log. Use for cash, checks, or gifts you don&apos;t want to enter one by one.
            Donor totals are never changed.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("adjust_paid_amount", "Extra paid ($)", undefined, "number")}
            {field("adjust_pledged_amount", "Extra pledged ($)", undefined, "number")}
          </div>
          {field("adjust_note", "Private note (not shown publicly)", "e.g. \"$1,500 cash from Jummah 10/3\"")}
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Zelle details</h2>
          {field("zelle_email", "Zelle email", undefined, "email")}
          {field("zelle_note", "Memo note shown under it")}
        </section>

        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Receipts</h2>
          <p className="text-sm text-ink/70">
            Shown only in the emailed receipt. These never appear on the public site.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("legal_name", "Legal name")}
            {field("ein", "EIN", "Format 12-3456789")}
          </div>
          <div>
            <label htmlFor="receipt_statement" className="block text-sm font-semibold">Receipt statement</label>
            <textarea id="receipt_statement" rows={4} className="input mt-1" value={f.receipt_statement}
              onChange={(e) => setF({ ...f, receipt_statement: e.target.value })} />
            <p className="mt-1 text-xs text-ink/60">You can use {"{legal_name}"} and {"{ein}"}. Have your tax preparer review this wording.</p>
          </div>
          <details className="rounded-xl bg-sand p-4 text-sm">
            <summary className="cursor-pointer font-semibold text-emerald">Preview receipt</summary>
            <pre className="mt-3 whitespace-pre-wrap font-sans">{buildReceipt({
              name: "Sample Donor", ticket: "ICCR-0042", amount: 250, method: "zelle", received_on: new Date().toISOString().slice(0, 10),
              legal_name: f.legal_name, ein: f.ein, receipt_statement: f.receipt_statement,
            }).text}</pre>
          </details>
        </section>

        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          <a className="btn-secondary" href="/" target="_blank" rel="noreferrer">View public page</a>
        </div>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-emerald" : "text-red-700"}`}>{msg.text}</p>}
      </form>
    </main>
  );
}
