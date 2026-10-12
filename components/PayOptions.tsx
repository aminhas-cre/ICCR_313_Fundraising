// Zelle + Venmo ("free ways to pay"), shared by every page that tells people how to pay.
// No hooks, so it works in both server and client components.
export const venmoUrl = (handle: string) => `https://venmo.com/u/${handle}`;

// The QR image in /public is for @ICCR1 only; hide it if the handle is changed.
const hasQr = (handle: string) => handle.toLowerCase() === "iccr1";

export default function PayOptions({
  zelle,
  venmo,
  tone = "light",
  example,
}: {
  zelle: string;
  venmo: string;
  tone?: "light" | "dark";
  example?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className="text-sm">
      <ul className="space-y-2">
        <li>
          <b>Zelle:</b> <span className="break-all font-semibold">{zelle}</span>
        </li>
        {venmo && (
          <li>
            <b>Venmo:</b>{" "}
            <a
              href={venmoUrl(venmo)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex min-h-[44px] items-center font-semibold underline ${dark ? "text-sand" : "text-emerald"}`}
            >
              @{venmo}
            </a>
          </li>
        )}
      </ul>
      {venmo && hasQr(venmo) && (
        <details className="mt-1">
          <summary className={`inline-flex min-h-[44px] cursor-pointer items-center font-semibold underline ${dark ? "text-sand" : "text-emerald"}`}>
            Show Venmo QR code
          </summary>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/venmo-qr.png"
            alt={`Venmo QR code for Islamic Center Castle Rock, @${venmo}`}
            width={320}
            height={314}
            className="mt-2 h-auto w-full max-w-[320px] rounded-xl bg-white"
          />
        </details>
      )}
      <p className={`mt-2 ${dark ? "" : "text-ink/90"}`}>
        Put the <b>ticket number</b> in the Zelle memo{venmo ? " or Venmo note" : ""}
        {example ? <>, for example <b>{example}</b></> : ""}. Several tickets in one payment? List them all.
      </p>
    </div>
  );
}
