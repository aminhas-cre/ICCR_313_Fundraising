import type { Metadata } from "next";
import { EB_Garamond, Lato } from "next/font/google";
import "./globals.css";

const heading = EB_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading", display: "swap" });
const body = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "313: Support Your Castle Rock Muslim Community Center",
  description:
    "Support your Castle Rock Muslim Community Center. 313 people giving $250 each to keep the Islamic Center of Castle Rock strong. Pay for your ticket, then bring your family and friends.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
