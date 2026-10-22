"use client";
import Link from "next/link";
import { useState } from "react";
import ShareButtons from "@/components/ShareButtons";
import PayOptions from "@/components/PayOptions";
import LaunchGoodLink from "@/components/LaunchGoodLink";
import CardButton from "@/components/CardButton";
import PayChoice from "@/components/PayChoice";
import { CHOICE_LABELS, type ChoiceMethod } from "@/lib/types";
import { formatTicket } from "@/lib/tickets";

interface Done {
  card_enabled?: boolean;
  tickets: number[];
  all_tickets: number[];
  due: number;
  price: number;
  zelle_email: string;
  venmo_handle: string;
  launchgood_url: string;
  emailed: boolean;
  chosen: ChoiceMethod[];
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function PledgeForm({ price, zelle, venmo, launchgood, cardEnabled, left, mode, initialCount }: { price: number; zelle: string; venmo: string; launchgood: string; cardEnabled: boolean; left: number; mode: "self" | "others" | "default"; initialCount: number }) {
  const payNow = mode === "self";
  const max = Math.min(left, 50);
  const [f, setF] = useState({ full_name: "", email: "", phone: "", ticket_count: initialCount, show_public: true, website: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [methods, setMethods] = useState<ChoiceMethod[]>([]);
  const [choiceErr, setChoiceErr] = useState("");
  const askPay = mode !== "others"; // Step 2 (family & friends) has no payment section

  const setCount = (n: number) => setF((p) => ({ ...p, ticket_count: Math.max(1, Math.min(max, n)) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (askPay && methods.length === 0) {
      setChoiceErr("Please tick how you plan to pay.");
      document.getElementById("pay-choice")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setChoiceErr("");
    setBusy(true);
    setErr("");
    const r = await fetch("/api/pledges", { method: "POST", body: JSON.stringify({ ...f, pay_methods: askPay ? methods : [] }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok && j.tickets) setDone({ ...j, chosen: askPay ? methods : [] });
    else setErr(j.error ?? "Something went wrong. Please try again.");
  }

  if (done) {
    const example = done.tickets[1] ?? done.tickets[0];
    const nums = done.tickets.join(",");
    const tone = payNow ? "dark" : "light";
    const sub = payNow ? "" : "text-ink/90";
    const ex = formatTicket(done.tickets[0]);
    const cardHref = `/pay?t=${nums}`;
    const sections: { key: ChoiceMethod; node: React.ReactNode }[] = [
      {
        key: "zelle",
        node: (
          <>
            <p className={`text-sm font-semibold ${sub}`}>Zelle <span className="font-normal">(we suggest this: no fees, 100% reaches ICCR)</span></p>
            <PayOptions zelle={done.zelle_email} venmo={done.venmo_handle} show="zelle" tone={tone} example={ex} noun="pledge" />
          </>
        ),
      },
      ...(done.venmo_handle
        ? [{
            key: "venmo" as ChoiceMethod,
            node: (
              <>
                <p className={`text-sm font-semibold ${sub}`}>Venmo <span className="font-normal">(we suggest this: no fees, 100% reaches ICCR)</span></p>
                <PayOptions zelle={done.zelle_email} venmo={done.venmo_handle} show="venmo" tone={tone} example={ex} noun="pledge" />
              </>
            ),
          }]
        : []),
      ...(done.launchgood_url
        ? [{
            key: "launchgood" as ChoiceMethod,
            node: (
              <>
                <p className={`mb-1 text-sm font-semibold ${sub}`}>LaunchGood</p>
                <LaunchGoodLink url={done.launchgood_url} price={done.price} tone={tone} noun="pledge" />
              </>
            ),
          }]
        : []),
      {
        key: "card",
        node: (
          <>
            <p className={`mb-1 text-sm font-semibold ${sub}`}>Card, Apple Pay or debit <span className="font-normal">(small processing fee)</span></p>
            <CardButton href={cardHref} disabled={!done.card_enabled} tone={tone} label={`Pay ${money(done.due)} now with Apple Pay, debit or credit card`} />
          </>
        ),
      },
    ];
    // Their pick(s) first, the rest under "other ways".
    const mine = sections.filter((x) => done.chosen.includes(x.key));
    const others = sections.filter((x) => !done.chosen.includes(x.key));
    const block = (list: typeof sections) => (
      <div className="space-y-4">{list.map((x) => <div key={x.key}>{x.node}</div>)}</div>
    );
    const payBlock = (
      <section className={`rounded-2xl p-6 ${payNow ? "bg-emerald text-sand" : "bg-white shadow-sm"}`} aria-label="How to pay">
        <h2 className="font-serif text-xl font-semibold">{payNow ? `Pay now: ${money(done.due)}` : "When you're ready to pay"}</h2>
        {mine.length > 0 ? (
          <>
            <p className={`mt-1 text-sm ${sub}`}>You chose: <b>{done.chosen.map((m) => CHOICE_LABELS[m]).join(", ")}</b></p>
            <div className="mt-3">{block(mine)}</div>
            {others.length > 0 && (
              <details className="mt-4">
                <summary className={`min-h-[44px] cursor-pointer py-2 text-sm font-semibold underline ${sub}`}>Other ways to pay</summary>
                <div className="mt-2">{block(others)}</div>
              </details>
            )}
          </>
        ) : (
          <div className="mt-3">{block(sections)}</div>
        )}
      </section>
    );
    const nudge =
      mode === "others" ? (
        <section className="rounded-2xl border-2 border-emerald bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Send each person their number</h2>
          <p className="mt-1 text-sm text-ink/80">
            Give each of your family and friends one pledge number from above. They pay that exact pledge, so tell them to
            put the number in the Zelle memo or Venmo note{done.card_enabled ? " or use the pay link" : ""}.
          </p>
          <a className="btn-secondary mt-3 w-full" href="/pledge?pay=1">Donate now too</a>
        </section>
      ) : (
        <section className="rounded-2xl border-2 border-emerald bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl font-semibold text-emerald">Now bring your close ones</h2>
          <p className="mt-1 text-sm text-ink/80">
            You&apos;ve taken care of yours. The most helpful thing you can do next is pledge for your family and
            friends and send each person their ICCR number. Highly recommended.
          </p>
          <a className="btn-primary mt-3 w-full" href="/pledge?for=others">Pledge to invite family and friends</a>
        </section>
      );
    return (
      <div className="mt-6 space-y-5">
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-live="polite">
          <p className="text-sm text-ink/70">JazakAllahu khayran. You made {done.tickets.length} pledge{done.tickets.length > 1 ? "s" : ""}:</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {done.tickets.map((n) => (
              <li key={n} className="rounded-full bg-sand px-4 py-2 font-serif text-xl font-bold text-emerald">{formatTicket(n)}</li>
            ))}
          </ul>
          {done.all_tickets.length > done.tickets.length && (
            <p className="mt-3 text-sm text-ink/80">You now hold {done.all_tickets.length} pledges in total.</p>
          )}
          <p className="mt-4 text-sm text-ink/80">
            <b>Every pledge has its own number.</b> Whoever pays a pledge puts that pledge&apos;s number in the memo. For
            example, if you give your uncle <b>{formatTicket(example)}</b>, he sends {money(done.price)} by Zelle or Venmo with{" "}
            <b>{formatTicket(example)}</b> in the memo.
          </p>
          {done.emailed && <p className="mt-3 text-xs text-ink/70">We&apos;ve emailed you a confirmation with these numbers.</p>}
        </section>
        {payBlock}
        {nudge}
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
        <p id="qty-label" className="text-sm font-semibold">How many {money(price)} donations?</p>
        <div className="mt-2 flex items-center gap-3" role="group" aria-labelledby="qty-label">
          <button type="button" className="btn-secondary !h-12 !w-12 !p-0 text-xl" aria-label="One fewer pledge" onClick={() => setCount(f.ticket_count - 1)} disabled={f.ticket_count <= 1}>−</button>
          <input
            aria-label="Number of pledges"
            inputMode="numeric"
            className="input !h-12 !w-20 text-center !text-lg"
            value={f.ticket_count}
            onChange={(e) => setCount(Number(e.target.value.replace(/\D/g, "")) || 1)}
          />
          <button type="button" className="btn-secondary !h-12 !w-12 !p-0 text-xl" aria-label="One more pledge" onClick={() => setCount(f.ticket_count + 1)} disabled={f.ticket_count >= max}>+</button>
        </div>
        <p className="mt-2 font-serif text-2xl font-bold text-emerald" aria-live="polite">
          {f.ticket_count} pledge{f.ticket_count > 1 ? "s" : ""} = {money(f.ticket_count * price)}
        </p>
        <p className="text-xs text-ink/70">{left} pledge{left === 1 ? "" : "s"} still available</p>
      </div>
      <div>
        <label htmlFor="full_name" className="block text-sm font-semibold">Full name</label>
        <input id="full_name" className="input mt-1 !py-3" value={f.full_name} onChange={set("full_name")} autoComplete="name" required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">Email</label>
        <input id="email" type="email" className="input mt-1 !py-3" value={f.email} onChange={set("email")} autoComplete="email" required />
        <p className="mt-1 text-xs text-ink/70">Used to confirm your pledge and to look up your pledges later. Never shown publicly.</p>
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold">Phone <span className="font-normal text-ink/70">(optional)</span></label>
        <input id="phone" type="tel" className="input mt-1 !py-3" value={f.phone} onChange={set("phone")} autoComplete="tel" />
      </div>
      {askPay && (
        <div id="pay-choice">
          <PayChoice zelle={zelle} venmo={venmo} launchgood={launchgood} cardEnabled={cardEnabled} price={price} value={methods} onChange={(v) => { setMethods(v); setChoiceErr(""); }} error={choiceErr} />
        </div>
      )}
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
      <p className="text-center text-xs text-ink/70">{askPay ? "You'll see how to pay right after you pledge." : "Send each person their pledge number after you pledge."}</p>
    </form>
  );
}
