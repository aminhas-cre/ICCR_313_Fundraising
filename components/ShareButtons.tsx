"use client";
import { useState } from "react";

export default function ShareButtons({ refCode, text }: { refCode?: string; text?: string }) {
  const [copied, setCopied] = useState(false);
  const link = () =>
    `${window.location.origin}/pledge${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`;
  const message = text ?? "Join me in the 313: founding supporters building our masjid at Islamic Center of Castle Rock.";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", link());
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        className="btn-primary"
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${message} ${link()}`)}`;
        }}
        href="https://wa.me/"
      >
        Share on WhatsApp
      </a>
      <button type="button" className="btn-secondary" onClick={copy}>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
