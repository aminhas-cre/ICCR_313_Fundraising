"use client";
import { useState } from "react";

const OPTIONS = [
  {
    id: "direct",
    label: "Direct invite",
    hint: "For one person or a small chat",
    text: "Assalamu alaikum. Join me in being one of the 313, founding supporters of our masjid, the Islamic Center of Castle Rock. 🕌",
  },
  {
    id: "extended",
    label: "Extended invite",
    hint: "For family or a larger group",
    text: "Assalamu alaikum family. I just became one of the 313 founding supporters of the Islamic Center of Castle Rock. 🕌 Join me, and share this with someone else, so we all share the reward.",
  },
] as const;

// Shares the plain campaign link (no per-person tracking). `text` overrides both options.
export default function ShareButtons({ text }: { text?: string }) {
  const [pick, setPick] = useState<(typeof OPTIONS)[number]["id"]>("direct");
  const [copied, setCopied] = useState(false);
  const chosen = OPTIONS.find((o) => o.id === pick)!;
  const full = () => `${text ?? chosen.text} ${window.location.origin}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(full());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this message:", full());
    }
  }

  return (
    <div>
      {text === undefined && (
        <fieldset>
          <legend className="sr-only">Choose who you are inviting</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {OPTIONS.map((o) => (
              <label
                key={o.id}
                className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-left text-sm ${
                  pick === o.id ? "border-emerald bg-white" : "border-sand-dark bg-sand"
                }`}
              >
                <input type="radio" name="share-option" className="mt-1 h-4 w-4" checked={pick === o.id} onChange={() => setPick(o.id)} />
                <span>
                  <span className="block font-semibold text-emerald">{o.label}</span>
                  <span className="block text-xs text-ink/70">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-sand p-3 text-left text-sm text-ink/90" aria-live="polite">{chosen.text}</p>
        </fieldset>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          className="btn-primary"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(full())}`;
          }}
          href="https://wa.me/"
        >
          Share on WhatsApp
        </a>
        <button type="button" className="btn-secondary" onClick={copy}>
          {copied ? "Message copied" : "Copy message"}
        </button>
      </div>
    </div>
  );
}
