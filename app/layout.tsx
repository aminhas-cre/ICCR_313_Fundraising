import type { Metadata } from "next";
import { EB_Garamond, Lato } from "next/font/google";
import "./globals.css";

const heading = EB_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading", display: "swap" });
const body = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-body", display: "swap" });

// Absolute base so link-preview images (WhatsApp, iMessage) resolve to full URLs.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://iccr-313-fundraising.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "313: Support Your Castle Rock Muslim Community Center",
  description:
    "Support your Castle Rock Muslim Community Center. 313 people giving $250 each to keep the Islamic Center of Castle Rock strong. Donate, then bring your family and friends.",
  openGraph: {
    title: "ICCR 313: Support Your Castle Rock Muslim Community Center",
    description: "313 people giving $250 each to keep the Islamic Center of Castle Rock strong. Donate, then bring your family and friends.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
