// The card / Apple Pay / debit call to action. Built to look like a button you can tap:
// solid colour, card icon, arrow, shadow, hover lift, focus ring. Link or button.
function CardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 flex-none" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" strokeLinecap="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 flex-none" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function CardButton({
  label,
  href,
  onClick,
  disabled = false,
  tone = "light",
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "light" | "dark";
}) {
  const base =
    "group flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl px-5 py-3 text-left text-base font-bold shadow-md transition focus:outline-none focus-visible:ring-4 focus-visible:ring-gold focus-visible:ring-offset-2";
  const look = disabled
    ? "cursor-not-allowed bg-sand-dark text-ink/60 shadow-none"
    : tone === "dark"
      ? "cursor-pointer border-2 border-gold-light bg-sand text-emerald hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:translate-y-0"
      : "cursor-pointer bg-emerald text-sand hover:-translate-y-0.5 hover:bg-emerald-dark hover:shadow-lg active:translate-y-0";
  const inner = (
    <>
      <CardIcon />
      <span className="flex-1">{label}</span>
      {!disabled && <span className="transition group-hover:translate-x-0.5"><Arrow /></span>}
    </>
  );
  const note = (
    <p className={`mt-1.5 text-center text-xs ${tone === "dark" && !disabled ? "text-sand/80" : "text-ink/70"}`}>
      {disabled ? "Card payments are coming soon." : "Secure checkout by Stripe. Apple Pay, debit and credit cards."}
    </p>
  );
  if (href && !disabled) {
    return (
      <div>
        <a href={href} className={`${base} ${look}`}>{inner}</a>
        {note}
      </div>
    );
  }
  return (
    <div>
      <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${look}`}>{inner}</button>
      {note}
    </div>
  );
}
