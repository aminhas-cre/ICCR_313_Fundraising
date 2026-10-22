import { formatTicket } from "./tickets";
import { baseUrl, button, callout, emailShell, esc } from "./emailLayout";
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const list = (nums: number[]) => nums.map(formatTicket).join(", ");
const firstName = (n: string) => n.trim().split(/\s+/)[0] || n;

const wrap = (heading: string, preheader: string, inner: string) =>
  emailShell({ heading, preheader, body: inner, footerName: "Islamic Center of Castle Rock", footerEin: "99-2085129" });

export interface PledgeMailInput {
  name: string;
  newTickets: number[];
  allTickets: number[]; // everything this person holds, including the new ones
  price: number;
  zelleEmail: string;
  venmoHandle: string;
  launchgoodUrl: string;
  chosenMethods: string[]; // labels the donor ticked, e.g. ["Zelle"]
  statusUrl: string;
  shareUrl: string;
  familyUrl: string;
  payUrl: string | null; // card checkout link, only when Stripe is configured
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
    `Each ticket is ${money(i.price)} and is tracked by its own ICCR number. When a ticket is paid, the person paying puts that ticket's number in the Zelle memo or Venmo note.`,
    `Example: if you give your uncle ticket ${formatTicket(example)}, he sends ${money(i.price)} by Zelle or Venmo with "${formatTicket(example)}" in the memo, and that exact ticket is marked paid.`,
    "",
    `HOW TO PAY: Zelle to ${i.zelleEmail}${i.venmoHandle ? ` or Venmo @${i.venmoHandle} (https://venmo.com/u/${i.venmoHandle})` : ""} and put the ticket number in the memo or note.`,
    ...(i.launchgoodUrl ? [`OR GIVE ${money(i.price)} PER TICKET ON LAUNCHGOOD: ${i.launchgoodUrl}\nUse the same email you pledged with and, if there is a comment box, add your ticket number.`] : []),
    ...(i.payUrl ? [`Or pay by card, Apple Pay or debit: ${i.payUrl}`] : []),
    ...(i.chosenMethods.length ? [`You told us you plan to pay by: ${i.chosenMethods.join(", ")}.`] : []),
    "",
    "DONATE FIRST, THEN BRING YOUR CLOSE ONES",
    "Please make your own donation first. Then, highly recommended: pledge tickets for your family and friends and send each person their ICCR number so they can pay it.",
    `Pledge to invite family and friends: ${i.familyUrl}`,
    "",
    `Check which of your tickets are paid any time with your email: ${i.statusUrl}`,
    "",
    `Share this page with family and friends: ${i.shareUrl}`,
    "Every person you bring in multiplies your reward, in sha Allah.",
  ].join("\n");

  const html = wrap("Your pledge is in", `${total} pledge${total === 1 ? "" : "s"} saved. Here are your ICCR numbers.`, `
<p>Assalamu Alaikum ${esc(firstName(i.name))},</p>
<p>JazakAllahu khayran. You are now signed up for <b>${total} ticket${total === 1 ? "" : "s"}</b> in the 313.</p>
<p style="margin:16px 0"><b>Your tickets:</b> ${esc(list(i.allTickets))}<br>
<b>Just added:</b> ${esc(list(i.newTickets))} (${esc(money(i.newTickets.length * i.price))})</p>
<div style="background:#f6f1e7;border-radius:10px;padding:14px 16px;margin:16px 0">
<p style="margin:0 0 6px"><b>Every ticket has its own number</b></p>
<p style="margin:0">Each ticket is ${esc(money(i.price))} and is tracked by its own ICCR number. When a ticket is paid, the person paying puts <b>that ticket's number</b> in the Zelle memo or Venmo note.</p>
<p style="margin:8px 0 0">Example: if you give your uncle ticket <b>${esc(formatTicket(example))}</b>, he sends ${esc(money(i.price))} by Zelle or Venmo with <b>${esc(formatTicket(example))}</b> in the memo, and that exact ticket is marked paid.</p>
</div>
<p><b>How to pay:</b> Zelle to <b>${esc(i.zelleEmail)}</b>${i.venmoHandle ? ` or Venmo <a href="https://venmo.com/u/${esc(i.venmoHandle)}">@${esc(i.venmoHandle)}</a>` : ""} and put the ticket number in the memo or note.${i.launchgoodUrl ? `<br>Or give ${esc(money(i.price))} per ticket on <a href="${esc(i.launchgoodUrl)}">LaunchGood</a> (use the same email you pledged with and, if there is a comment box, add your ticket number).` : ""}${i.payUrl ? `<br>Or <a href="${esc(i.payUrl)}">pay by card, Apple Pay or debit</a>.` : ""}${i.chosenMethods.length ? `<br><i>You told us you plan to pay by: ${esc(i.chosenMethods.join(", "))}.</i>` : ""}</p>
<div style="background:#0f4a3c;color:#f6f1e7;border-radius:10px;padding:14px 16px;margin:16px 0">
<p style="margin:0 0 6px"><b>Donate first, then bring your close ones</b></p>
<p style="margin:0">Please make your own donation first. Then, <b>highly recommended</b>: pledge tickets for your family and friends and send each person their ICCR number so they can pay it.</p>
<p style="margin:10px 0 0"><a style="color:#f6f1e7;font-weight:bold" href="${esc(i.familyUrl)}">Pledge to invite family and friends</a></p>
</div>
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
  chosenMethods: string[];
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
    `Plans to pay by: ${i.chosenMethods.length ? i.chosenMethods.join(", ") : "(not chosen)"}`,
    "",
    `Campaign total: ${i.pledgedSoFar} of ${i.goal} tickets pledged.`,
    `Manage tickets: ${i.adminUrl}`,
  ].join("\n");
  const html = wrap("New pledge", `${i.name} pledged ${i.newTickets.length}`, `
<p><b>${esc(i.name)}</b> just pledged <b>${i.newTickets.length}</b> ticket${i.newTickets.length === 1 ? "" : "s"}.</p>
<p><b>New tickets:</b> ${esc(list(i.newTickets))}<br>
<b>Total held by this person:</b> ${i.totalHeld}<br>
<b>Email:</b> ${esc(i.email)}<br>
<b>Phone:</b> ${esc(i.phone ?? "(none)")}<br>
<b>Plans to pay by:</b> ${esc(i.chosenMethods.length ? i.chosenMethods.join(", ") : "(not chosen)")}</p>
<p>Campaign total: <b>${i.pledgedSoFar}</b> of ${i.goal} tickets pledged.</p>
<p><a href="${esc(i.adminUrl)}">Open the admin tickets page</a></p>`);
  return { subject, text, html };
}

export interface ReminderInput {
  name: string;
  unpaid: number[]; // this person's unpaid ICCR numbers
  price: number;
  zelleEmail: string;
  venmoHandle: string;
  launchgoodUrl: string;
  cardEnabled: boolean;
}

// For people who pledged but have not donated yet.
export function pledgeReminder(i: ReminderInput) {
  const base = baseUrl();
  const n = i.unpaid.length;
  const total = money(n * i.price);
  const checkUrl = `${base}/status`;
  const payUrl = `${base}/pay?t=${i.unpaid.join(",")}`;
  const example = formatTicket(i.unpaid[0]);
  const subject = `Your ICCR 313 pledge${n === 1 ? "" : "s"}: ${list(i.unpaid)}`;

  const text = [
    `Assalamu Alaikum ${firstName(i.name)},`,
    "",
    `JazakAllahu khayran for pledging to the 313. Your ICCR number${n === 1 ? " is" : "s are"} still waiting for the donation: ${list(i.unpaid)} (${total}).`,
    "",
    "HOW TO GIVE",
    ...(i.cardEnabled ? [`Card, Apple Pay or debit: ${payUrl}`] : []),
    `Zelle: ${i.zelleEmail} (put ${example} in the memo)`,
    ...(i.venmoHandle ? [`Venmo: @${i.venmoHandle} (put ${example} in the note)`] : []),
    ...(i.launchgoodUrl ? [`LaunchGood: ${i.launchgoodUrl} (use the email you pledged with)`] : []),
    "",
    "Already sent it? Thank you. Payments by Zelle and Venmo are matched by hand, so it can take a day or two to show.",
    `Check your pledges any time: ${checkUrl}`,
  ].join("\n");

  const payLines = [
    `<b>Zelle:</b> ${esc(i.zelleEmail)} (put <b>${esc(example)}</b> in the memo)`,
    ...(i.venmoHandle ? [`<b>Venmo:</b> @${esc(i.venmoHandle)} (put <b>${esc(example)}</b> in the note)`] : []),
    ...(i.launchgoodUrl ? [`<b>LaunchGood:</b> <a href="${esc(i.launchgoodUrl)}">give here</a> (use the email you pledged with)`] : []),
  ].join("<br>");

  const html = wrap("Your ICCR numbers are waiting", `${n} pledge${n === 1 ? "" : "s"} (${total}) still open. It takes a minute.`, `
<p style="margin:0 0 8px">Assalamu Alaikum ${esc(firstName(i.name))},</p>
<p style="margin:0">JazakAllahu khayran for pledging to the 313. Your donation is the last step, in sha Allah.</p>
${callout(`<b>${esc(list(i.unpaid))}</b><br>${esc(total)} · ${n} pledge${n === 1 ? "" : "s"} still open`)}
${i.cardEnabled ? button(`Give ${total} by card or Apple Pay`, payUrl) : ""}
<p style="margin:12px 0 4px"><b>Or by:</b></p>
<p style="margin:0 0 16px;font-size:15px">${payLines}</p>
<p style="margin:0 0 12px;font-size:14px;color:#5a635e">Already sent it? Thank you. Zelle and Venmo are matched by hand, so it can take a day or two to show.</p>
${button("Check my pledges", checkUrl, "light")}`);
  return { subject, text, html };
}
