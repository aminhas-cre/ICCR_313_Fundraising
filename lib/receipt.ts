// Pure receipt builder (no server imports) so the admin preview and the real
// email render the exact same wording.
import { baseUrl, button, callout, detailRows, emailShell, esc } from "./emailLayout";

export interface ReceiptInput {
  name: string;
  tickets: string[]; // e.g. ["ICCR-2", "ICCR-3"]
  amount: number; // total for these tickets
  method: string;
  received_on: string; // YYYY-MM-DD
  legal_name: string;
  ein: string;
  receipt_statement: string;
  paidByName?: string | null; // who paid, when known (card payments)
  reference?: string | null; // e.g. Stripe payment id
  paidTotal?: number; // this donor's paid tickets overall, including these
  stillOpen?: string[]; // this donor's tickets that are not paid yet
  siteUrl?: string;
}

export function buildReceipt(r: ReceiptInput) {
  const statement = r.receipt_statement.replaceAll("{legal_name}", r.legal_name).replaceAll("{ein}", r.ein);
  const amount = `$${r.amount.toLocaleString("en-US")}`;
  const tickets = r.tickets.join(", ");
  const subject = `Your gift receipt: ${tickets}`;
  const site = (r.siteUrl ?? baseUrl()).replace(/\/$/, "");
  const checkUrl = `${site}/status`;
  const familyUrl = `${site}/pledge?for=others`;
  const open = r.stillOpen ?? [];
  const showPayer = r.paidByName && r.paidByName.trim().toLowerCase() !== r.name.trim().toLowerCase();

  const rows: [string, string][] = [
    ["Pledge numbers", tickets],
    ["Amount received", amount],
    ["Date received", r.received_on],
    ["Payment method", r.method.charAt(0).toUpperCase() + r.method.slice(1)],
  ];
  if (showPayer) rows.push(["Paid by", r.paidByName!.trim()]);
  if (r.reference) rows.push(["Reference", r.reference]);

  const statusLine =
    r.paidTotal !== undefined
      ? `Your pledges: ${r.paidTotal} paid${open.length ? `, ${open.length} still open (${open.join(", ")})` : ", none open"}.`
      : "";

  const text = [
    `Assalamu Alaikum ${r.name},`,
    "",
    "JazakAllahu khayran. We have received your gift.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    statement,
    "",
    r.legal_name,
    `EIN ${r.ein}`,
    "",
    ...(statusLine ? [statusLine] : []),
    `Check your pledges any time: ${checkUrl}`,
    `Pledge to invite family and friends: ${familyUrl}`,
  ].join("\n");

  const html = emailShell({
    preheader: `We received your ${amount} gift. JazakAllahu khayran.`,
    heading: "Gift received. JazakAllahu khayran.",
    footerName: r.legal_name,
    footerEin: r.ein,
    body: `<p style="margin:0 0 8px">Assalamu Alaikum ${esc(r.name)},</p>
<p style="margin:0">We have received your gift to ICCR 313. May Allah accept it from you. Please keep this email as your receipt.</p>
${detailRows(rows)}
<p style="margin:0 0 16px;font-size:13px;color:#5a635e">${esc(statement)}</p>
${statusLine ? callout(esc(statusLine)) : ""}
${button("Check my pledges", checkUrl)}
${callout(`<b>Bring your close ones.</b> Pledge donations for your family and friends and send each person their own ICCR number.`, true)}
${button("Pledge to invite family and friends", familyUrl, "light")}`,
  });

  return { subject, text, html };
}
