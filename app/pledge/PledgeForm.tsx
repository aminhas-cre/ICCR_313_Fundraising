"use client";
import { useState } from "react";
import ShareButtons from "@/components/ShareButtons";

interface Done { ticket: string; token: string; due: number; zelle_email: string }

export default function PledgeForm({ price, zelle, initialRef }: { price: number; zelle: string; initialRef: string }) {
  const [f, setF] = useState({ full_name: "", email: "", phone: "", ticket_count: 1, ref: initialRef, show_public: false, website: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/pledges", { method: "POST", body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && j.ticket) setDone(j);
    else setErr(j.error ?? "Something went wrong. Please try again.");
  }

  if (done) {
    return (
      <div className="mt-6 space-y-5">
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm" aria-live="polite">
          <p className="text-sm text-ink/70">JazakAllahu khayran. Your ICCR ticket number is</p>
          <p className="mt-1 font-serif text-5xl font-bold text-emerald">{done.ticket}</p>
        </section>
        <section className="rounded-2xl bg-emerald p-6 text-sand">
          <h2 className="font-serif text-xl font-semibold">Next: send ${done.due.toLocaleString("en-US")} by Zelle</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
            <li>Send to <b className="break-all">{done.zelle_email}</b></li>
            <li>Put <b>{done.ticket}</b> in the memo (this is how we match your payment)</li>
          </ol>
        </section>
        <a className="btn-primary w-full" href={`/t/${done.token}`}>Open my private pledge page</a>
        <p className="text-xs text-ink/70">Save that page. It shows when your payment has been received.</p>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Bring 5 people</h2>
          <div className="mt-3"><ShareButtons refCode={done.ticket} /></div>
        </section>
      </div>
    );
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div>
        <label htmlFor="full_name" className="block text-sm font-semibold">Full name</label>
        <input id="full_name" className="input mt-1 !py-3" value={f.full_name} onChange={set("full_name")} autoComplete="name" required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">Email</label>
        <input id="email" type="email" className="input mt-1 !py-3" value={f.email} onChange={set("email")} autoComplete="email" required />
        <p className="mt-1 text-xs text-ink/70">Used to look up your pledge later. Never shown publicly.</p>
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold">Phone <span className="font-normal text-ink/70">(optional)</span></label>
        <input id="phone" type="tel" className="input mt-1 !py-3" value={f.phone} onChange={set("phone")} autoComplete="tel" />
      </div>
      <div>
        <label htmlFor="ticket_count" className="block text-sm font-semibold">Tickets</label>
        <select id="ticket_count" className="input mt-1 !py-3" value={f.ticket_count} onChange={(e) => setF({ ...f, ticket_count: Number(e.target.value) })}>
          {[1, 2, 3, 4, 5, 10].map((n) => (
            <option key={n} value={n}>{n} × ${price} = ${(n * price).toLocaleString("en-US")}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ref" className="block text-sm font-semibold">Who invited you? <span className="font-normal text-ink/70">(their ICCR ticket number, optional)</span></label>
        <input id="ref" className="input mt-1 !py-3" placeholder="ICCR-0042" value={f.ref} onChange={set("ref")} autoComplete="off" />
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5" checked={f.show_public} onChange={(e) => setF({ ...f, show_public: e.target.checked })} />
        <span>Show my first name and last initial on the supporters wall.</span>
      </label>
      {/* Honeypot: real people never see or fill this. */}
      <div className="hidden" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button className="btn-primary w-full !py-3 text-base" type="submit" disabled={busy}>
        {busy ? "Saving…" : `Pledge $${(f.ticket_count * price).toLocaleString("en-US")}`}
      </button>
      <p className="text-center text-xs text-ink/70">Pay by Zelle to {zelle} after you pledge.</p>
    </form>
  );
}
