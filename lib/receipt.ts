// Pure receipt builder (no server imports) so the admin preview and the
// Phase 2 email sender render the exact same wording.
export interface ReceiptInput {
  name: string;
  ticket: string;
  amount: number;
  method: string;
  received_on: string; // YYYY-MM-DD
  legal_name: string;
  ein: string;
  receipt_statement: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildReceipt(r: ReceiptInput) {
  const statement = r.receipt_statement.replaceAll("{legal_name}", r.legal_name).replaceAll("{ein}", r.ein);
  const amount = `$${r.amount.toLocaleString("en-US")}`;
  const subject = `Your gift receipt: ${r.ticket}`;

  const text = [
    "Assalamu Alaikum " + r.name + ",",
    "",
    "JazakAllahu khayran. We have received your gift.",
    "",
    `Ticket: ${r.ticket}`,
    `Amount received: ${amount}`,
    `Date received: ${r.received_on}`,
    `Payment method: ${r.method}`,
    "",
    statement,
    "",
    `${r.legal_name}`,
    `EIN ${r.ein}`,
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1c2420">
<p>Assalamu Alaikum ${esc(r.name)},</p>
<p>JazakAllahu khayran. We have received your gift.</p>
<table style="border-collapse:collapse;margin:16px 0">
<tr><td style="padding:4px 16px 4px 0;color:#555">Ticket</td><td><b>${esc(r.ticket)}</b></td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#555">Amount received</td><td><b>${esc(amount)}</b></td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#555">Date received</td><td>${esc(r.received_on)}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:#555">Payment method</td><td style="text-transform:capitalize">${esc(r.method)}</td></tr>
</table>
<p style="font-size:14px">${esc(statement)}</p>
<p style="font-size:14px;color:#555">${esc(r.legal_name)}<br>EIN ${esc(r.ein)}</p>
</div>`;

  return { subject, text, html };
}
