"use client";
import { useRef, useState } from "react";
import type { PledgeView } from "@/lib/types";
import { formatTicket } from "@/lib/tickets";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export default function TicketList({ initial }: { initial: PledgeView }) {
  const [tickets, setTickets] = useState(initial.tickets);
  const [err, setErr] = useState("");
  const chain = useRef<Promise<unknown>>(Promise.resolve()); // keeps saves in the order the donor made them

  const paid = tickets.filter((t) => t.paid).length;
  const unpaid = tickets.length - paid;

  function save(no: number, passed_on: boolean, passed_to: string | null) {
    setErr("");
    chain.current = chain.current.then(async () => {
      try {
        const r = await fetch("/api/tickets/note", {
          method: "POST",
          body: JSON.stringify({ token: initial.token, ticket: no, passed_on, passed_to }),
        });
        if (!r.ok) setErr((await r.json().catch(() => ({}))).error ?? "Could not save that change.");
      } catch {
        setErr("Could not save that change. Check your connection.");
      }
    });
  }

  function update(no: number, patch: Partial<{ passed_on: boolean; passed_to: string | null }>, persist: boolean) {
    setTickets((prev) => prev.map((t) => (t.no === no ? { ...t, ...patch } : t)));
    if (persist) {
      const cur = tickets.find((t) => t.no === no)!;
      const next = { ...cur, ...patch };
      save(no, next.passed_on, next.passed_to);
    }
  }

  return (
    <section aria-label="Your tickets">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-ink/70">Assalamu Alaikum</p>
        <p className="font-serif text-3xl font-bold text-emerald">{initial.name}</p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div><dt className="text-xs text-ink/70">Pledged</dt><dd className="font-serif text-2xl font-bold">{tickets.length}</dd></div>
          <div><dt className="text-xs text-ink/70">Paid</dt><dd className="font-serif text-2xl font-bold text-emerald">{paid}</dd></div>
          <div><dt className="text-xs text-ink/70">Awaiting payment</dt><dd className="font-serif text-2xl font-bold">{unpaid}</dd></div>
        </dl>
        {unpaid > 0 && (
          <div className="mt-5 rounded-xl bg-sand p-4 text-sm">
            <p className="font-semibold text-emerald">To pay a ticket</p>
            <p className="mt-1">
              Zelle <b>{money(initial.ticket_price)}</b> to <b className="break-all">{initial.zelle_email}</b> and put that
              ticket&apos;s number (like <b>{formatTicket(tickets.find((t) => !t.paid)!.no)}</b>) in the memo. Payments are
              matched by hand, so it can take a day or two to show here.
            </p>
          </div>
        )}
      </div>

      <h2 className="mt-6 font-serif text-xl font-semibold text-emerald">Your tickets</h2>
      <p className="text-sm text-ink/70">
        Each ticket has its own number. If you hand a ticket to someone, tick the box so you remember. That&apos;s just your
        own note; only the committee marks a ticket paid.
      </p>
      <ul className="mt-3 space-y-3">
        {tickets.map((t) => (
          <li key={t.no} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-serif text-2xl font-bold text-emerald">{formatTicket(t.no)}</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  t.paid ? "bg-emerald text-sand" : "bg-sand-dark text-ink"
                }`}
              >
                {t.paid && (
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M8 13.2 4.8 10l-1.3 1.3L8 15.8l8.5-8.5-1.3-1.3z" />
                  </svg>
                )}
                {t.paid ? `Paid${t.received_on ? ` · ${t.received_on}` : ""}` : "Awaiting payment"}
              </span>
            </div>
            <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={t.passed_on}
                onChange={(e) => update(t.no, { passed_on: e.target.checked, passed_to: e.target.checked ? t.passed_to : null }, true)}
              />
              <span>I passed this ticket to someone</span>
            </label>
            {t.passed_on && (
              <div className="mt-1">
                <label htmlFor={`to-${t.no}`} className="sr-only">Who did you give {formatTicket(t.no)} to?</label>
                <input
                  id={`to-${t.no}`}
                  className="input !py-2.5"
                  placeholder="Who has it? (optional, e.g. Uncle Ahmed)"
                  maxLength={80}
                  value={t.passed_to ?? ""}
                  onChange={(e) => update(t.no, { passed_to: e.target.value }, false)}
                  onBlur={(e) => update(t.no, { passed_to: e.target.value.trim() || null }, true)}
                />
                {!t.paid && (
                  <p className="mt-1 text-xs text-ink/70">Tell them to put <b>{formatTicket(t.no)}</b> in the Zelle memo.</p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
    </section>
  );
}
