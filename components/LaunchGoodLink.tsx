// "Give through LaunchGood": external donation page. We match the donation to a ticket by hand, like Zelle.
export default function LaunchGoodLink({ url, price, tone = "light", noun = "ticket" }: { url: string; price: number; tone?: "light" | "dark"; noun?: string }) {
  if (!url) return null;
  const dark = tone === "dark";
  return (
    <div className="text-sm">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-full px-5 py-3 font-semibold ${
          dark ? "bg-sand text-emerald hover:bg-white" : "bg-emerald text-sand hover:bg-emerald-dark"
        }`}
      >
        Donate ${price.toLocaleString("en-US")} on LaunchGood
      </a>
      <ul className={`mt-2 list-disc space-y-1 pl-5 ${dark ? "" : "text-ink/90"}`}>
        <li>Give ${price.toLocaleString("en-US")} per {noun}.</li>
        <li>Use the same email you pledged with.</li>
        <li>If there&apos;s a comment box, add your {noun} number (like ICCR-12).</li>
      </ul>
      <p className={`mt-1 text-xs ${dark ? "text-sand/80" : "text-ink/70"}`}>We match LaunchGood donations to {noun}s by hand, so it can take a day or two to show.</p>
    </div>
  );
}
