import { formatTicket } from "./tickets";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const list = (nums: number[]) => nums.map(formatTicket).join(", ");
const firstName = (n: string) => n.trim().split(/\s+/)[0] || n;

const wrap = (inner: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1c2420;line-height:1.5">${inner}</div>`;

export interface PledgeMailInput {
  name: string;
  newTickets: number[];
  allTickets: number[]; // everything this person holds, including the new ones
  price: number;
  zelleEmail: string;
  statusUrl: string;
  shareUrl: string;
}

// Confirmation to the donor: how many tickets they hold now, each with its own number.
export function pledgeConfirmation(i: PledgeMailInput) {
  const total = i.allTickets.length;
  const example = i.newTickets[1] ?? i.newTickets[0];
  const subject = `Your ICCR 313 pledge: ${total} ticket${total === 1 ? "" : "s"}`;

  const text = [
    `Assalamu Alaikum ${firstName(i.name)},`,
    "",
    `JazakAllahu khayran. You are now signed up for ${total} ticket${total === 1 ? "" : "s"} in the 313.`,
    "",
    `Your tickets: ${list(i.allTickets)}`,
    `Just added: ${list(i.newTickets)} (${money(i.newTickets.length * i.price)})`,
    "",
    "EVERY TICKET HAS ITS OWN NUMBER",
    `Each ticket is ${money(i.price)} and is tracked by its own ICCR number. When a ticket is paid, the person paying puts that ticket's number in the Zelle memo.`,
    `Example: if you give your uncle ticket ${formatTicket(example)}, he sends ${money(i.price)} by Zelle with "${formatTicket(example)}" in the memo, and that exact ticket is marked paid.`,
    "",
    `HOW TO PAY: Zelle to ${i.zelleEmail} and put the ticket number in the memo.`,
    "",
    `Check which of your tickets are paid any time with your email: ${i.statusUrl}`,
    "",
    `Share this page with family and friends: ${i.shareUrl}`,
    "Every person you bring in multiplies your reward, in sha Allah.",
  ].join("\n");

  const html = wrap(`
<p>Assalamu Alaikum ${esc(firstName(i.name))},</p>
<p>JazakAllahu khayran. You are now signed up for <b>${total} ticket${total === 1 ? "" : "s"}</b> in the 313.</p>
<p style="margin:16px 0"><b>Your tickets:</b> ${esc(list(i.allTickets))}<br>
<b>Just added:</b> ${esc(list(i.newTickets))} (${esc(money(i.newTickets.length * i.price))})</p>
<div style="background:#f6f1e7;border-radius:10px;padding:14px 16px;margin:16px 0">
<p style="margin:0 0 6px"><b>Every ticket has its own number</b></p>
<p style="margin:0">Each ticket is ${esc(money(i.price))} and is tracked by its own ICCR number. When a ticket is paid, the person paying puts <b>that ticket's number</b> in the Zelle memo.</p>
<p style="margin:8px 0 0">Example: if you give your uncle ticket <b>${esc(formatTicket(example))}</b>, he sends ${esc(money(i.price))} by Zelle with <b>${esc(formatTicket(example))}</b> in the memo, and that exact ticket is marked paid.</p>
</div>
<p><b>How to pay:</b> Zelle to <b>${esc(i.zelleEmail)}</b> and put the ticket number in the memo.</p>
<p>Check which of your tickets are paid any time with your email:<br><a href="${esc(i.statusUrl)}">${esc(i.statusUrl)}</a></p>
<p>Share this page with family and friends:<br><a href="${esc(i.shareUrl)}">${esc(i.shareUrl)}</a><br>
<span style="color:#555">Every person you bring in multiplies your reward, in sha Allah.</span></p>`);
  return { subject, text, html };
}

export interface AdminAlertInput {
  name: string;
  email: string;
  phone: string | null;
  newTickets: number[];
  totalHeld: number;
  pledgedSoFar: number; // tickets issued overall
  goal: number;
  adminUrl: string;
}

export function adminPledgeAlert(i: AdminAlertInput) {
  const subject = `New pledge: ${i.name} (${i.newTickets.length} ticket${i.newTickets.length === 1 ? "" : "s"})`;
  const text = [
    `${i.name} just pledged ${i.newTickets.length} ticket${i.newTickets.length === 1 ? "" : "s"}.`,
    "",
    `New tickets: ${list(i.newTickets)}`,
    `Total held by this person: ${i.totalHeld}`,
    `Email: ${i.email}`,
    `Phone: ${i.phone ?? "(none)"}`,
    "",
    `Campaign total: ${i.pledgedSoFar} of ${i.goal} tickets pledged.`,
    `Manage tickets: ${i.adminUrl}`,
  ].join("\n");
  const html = wrap(`
<p><b>${esc(i.name)}</b> just pledged <b>${i.newTickets.length}</b> ticket${i.newTickets.length === 1 ? "" : "s"}.</p>
<p><b>New tickets:</b> ${esc(list(i.newTickets))}<br>
<b>Total held by this person:</b> ${i.totalHeld}<br>
<b>Email:</b> ${esc(i.email)}<br>
<b>Phone:</b> ${esc(i.phone ?? "(none)")}</p>
<p>Campaign total: <b>${i.pledgedSoFar}</b> of ${i.goal} tickets pledged.</p>
<p><a href="${esc(i.adminUrl)}">Open the admin tickets page</a></p>`);
  return { subject, text, html };
}
