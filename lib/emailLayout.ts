// Shared branded shell for every email (receipt, pledge confirmation, reminder).
// Table layout and inline styles only, because mail clients ignore most CSS.
export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const EMERALD = "#0f4a3c";
const SAND = "#f6f1e7";
const GOLD = "#b8892b";
const INK = "#1c2420";

// Public base URL for links built outside a request (e.g. the Stripe webhook).
export function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://313.islamiccentercastlerock.org").replace(/\/$/, "");
}

export function button(label: string, url: string, tone: "primary" | "light" = "primary") {
  const bg = tone === "primary" ? EMERALD : SAND;
  const fg = tone === "primary" ? SAND : EMERALD;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0"><tr><td style="background:${bg};border-radius:10px"><a href="${esc(url)}" style="display:inline-block;padding:13px 22px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:${fg};text-decoration:none">${esc(label)}</a></td></tr></table>`;
}

export function emailShell(o: { preheader: string; heading: string; body: string; footerName: string; footerEin?: string }) {
  const site = baseUrl();
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${SAND}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND}"><tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:${EMERALD};padding:20px 28px;border-bottom:4px solid ${GOLD}">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:bold;color:${SAND};line-height:1">313</div>
<div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#e7d9b3;margin-top:4px">Islamic Center of Castle Rock</div>
</td></tr>
<tr><td style="padding:28px;font-family:Arial,sans-serif;font-size:16px;line-height:1.55;color:${INK}">
<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:${EMERALD}">${esc(o.heading)}</h1>
${o.body}
</td></tr>
<tr><td style="background:${SAND};padding:18px 28px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#5a635e">
${esc(o.footerName)}${o.footerEin ? ` · EIN ${esc(o.footerEin)}` : ""}<br>
<a href="${esc(site)}" style="color:${EMERALD}">${esc(site.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

// Small label/value rows used by the receipt details.
export function detailRows(rows: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #e6dfcf">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 12px 9px 0;border-bottom:1px solid #e6dfcf;font-size:14px;color:#5a635e;width:38%">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #e6dfcf;font-size:15px;font-weight:bold">${esc(v)}</td></tr>`
    )
    .join("")}</table>`;
}

export function callout(inner: string, dark = false) {
  return `<div style="background:${dark ? EMERALD : SAND};color:${dark ? SAND : INK};border-radius:10px;padding:14px 16px;margin:16px 0;font-size:15px">${inner}</div>`;
}
