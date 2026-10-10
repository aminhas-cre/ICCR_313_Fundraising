"use client";
import Link from "next/link";
import { useState } from "react";
import ShareButtons from "@/components/ShareButtons";
import { formatTicket } from "@/lib/tickets";

interface Done {
  tickets: number[];
  all_tickets: number[];
  due: number;
  price: number;
  zelle_email: string;
  emailed: boolean;
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function PledgeForm({ price, zelle, left, payNow }: { price: number; zelle: string; left: number; payNow: boolean }) {
  const max = Math.min(left, 50);
  const [f, setF] = useState({ full_name: "", email: "", phone: "", ticket_count: 1, show_public: true, website: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const setCount = (n: number) => setF((p) => ({ ...p, ticket_count: Math.max(1, Math.min(max, n)) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const r = await fetch("/api/pledges", { method: "POST", body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && j.tickets) setDone(j);
    else setErr(j.error ?? "Something went wrong. Please try again.");
  }

  if (done) {
    const example = done.tickets[1] ?? done.tickets[0];
    const payBlock = (
      <section className={`rounded-2xl p-6 ${payNow ? "bg-emerald text-sand" : "bg-white shadow-sm"}`} aria-label="How to pay">
        <h2 className="font-serif text-xl font-semibold">{payNow ? `Pay now: ${money(done.due)}` : "When you're ready to pay"}</h2>
        <ol className={`mt-3 list-decimal space-y-1 pl-5 text-sm ${payNow ? "" : "text-ink/90"}`}>
          <li>Send by Zelle to <b className="break-all">{done.zelle_email}</b></li>
          <li>
            Put the <b>ticket number</b> in the memo, for example <b>{formatTicket(done.tickets[0])}</b>. Several tickets in one payment? List them all.
          </li>
        </ol>
        {payNow && <p className="mt-3 text-xs text-sand/80">Card, Apple Pay and Google Pay are coming soon.</p>}
      </section>
    );
    return (
      <div className="mt-6 space-y-5">
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-live="polite">
          <p className="text-sm text-ink/70">JazakAllahu khayran. You pledged {done.tickets.length} ticket{done.tickets.length > 1 ? "s" : ""}:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {done.tickets.map((n) => (
              <li key={n} className="rounded-full bg-sand px-4 py-2 font-serif text-xl font-bold text-emerald">{formatTicket(n)}</li>
            ))}
          </ul>
          {done.all_tickets.length > done.tickets.length && (
            <p className="mt-3 text-sm text-ink/80">You now hold {done.all_tickets.length} tickets in total.</p>
          )}
          <p className="mt-4 text-sm text-ink/80">
            <b>Every ticket has its own number.</b> Whoever pays a ticket puts that ticket&apos;s number in the memo. For
            example, if you give your uncle <b>{formatTicket(example)}</b>, he sends {money(done.price)} by Zelle with{" "}
            <b>{formatTicket(example)}</b> in the memo.
          </p>
          {done.emailed && <p className="mt-3 text-xs text-ink/70">We&apos;ve emailed you a confirmation with these numbers.</p>}
        </section>
        {payBlock}
        <Link className="btn-secondary w-full" href="/status">Check my pledge</Link>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Share with family and friends</h2>
          <p className="mt-1 text-sm text-ink/80">Every person you bring in multiplies your reward, in sha Allah.</p>
          <div className="mt-3"><ShareButtons /></div>
        </section>
      </div>
    );
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p id="qty-label" className="text-sm font-semibold">How many tickets?</p>
        <div className="mt-2 flex items-center gap-3" role="group" aria-labelledby="qty-label">
          <button type="button" className="btn-secondary !h-12 !w-12 !p-0 text-xl" aria-label="One fewer ticket" onClick={() => setCount(f.ticket_count - 1)} disabled={f.ticket_count <= 1}>−</button>
          <input
            aria-label="Number of tickets"
            inputMode="numeric"
            className="input !h-12 !w-20 text-center !text-lg"
            value={f.ticket_count}
            onChange={(e) => setCount(Number(e.target.value.replace(/\D/g, "")) || 1)}
          />
          <button type="button" className="btn-secondary !h-12 !w-12 !p-0 text-xl" aria-label="One more ticket" onClick={() => setCount(f.ticket_count + 1)} disabled={f.ticket_count >= max}>+</button>
        </div>
        <p className="mt-2 font-serif text-2xl font-bold text-emerald" aria-live="polite">
          {f.ticket_count} ticket{f.ticket_count > 1 ? "s" : ""} = {money(f.ticket_count * price)}
        </p>
        <p className="text-xs text-ink/70">{left} ticket{left === 1 ? "" : "s"} still available</p>
      </div>
      <div>
        <label htmlFor="full_name" className="block text-sm font-semibold">Full name</label>
        <input id="full_name" className="input mt-1 !py-3" value={f.full_name} onChange={set("full_name")} autoComplete="name" required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">Email</label>
        <input id="email" type="email" className="input mt-1 !py-3" value={f.email} onChange={set("email")} autoComplete="email" required />
        <p className="mt-1 text-xs text-ink/70">Used to confirm your pledge and to look up your tickets later. Never shown publicly.</p>
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold">Phone <span className="font-normal text-ink/70">(optional)</span></label>
        <input id="phone" type="tel" className="input mt-1 !py-3" value={f.phone} onChange={set("phone")} autoComplete="tel" />
      </div>
      <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-5 w-5" checked={f.show_public} onChange={(e) => setF({ ...f, show_public: e.target.checked })} />
        <span>Show my first name and last initial on the supporters list. (Uncheck to appear as &quot;Anonymous&quot;.)</span>
      </label>
      <div className="hidden" aria-hidden="true">
        <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label>
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button className="btn-primary w-full !py-3 text-base" type="submit" disabled={busy}>
        {busy ? "Saving…" : `Pledge ${money(f.ticket_count * price)}`}
      </button>
      <p className="text-center text-xs text-ink/70">You pay by Zelle to {zelle} after you pledge.</p>
    </form>
  );
}
