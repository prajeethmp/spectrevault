import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SpectreVault — Multi-Party Ephemeral Secret Vault (k-of-n Shamir)",
  description:
    "Next-generation zero-knowledge ephemeral pastebin and threshold vault with Galois Field GF(2^8) Shamir Secret Sharing, AES-256-GCM, Atomic Burn-on-Read, and DOM-Isolated Canvas Rendering.",
  keywords: [
    "Shamir Secret Sharing",
    "Galois Field",
    "Zero Knowledge",
    "Ephemeral Vault",
    "Burn on Read",
    "AES-256-GCM",
    "PrivateBin alternative",
    "Anti Exfiltration",
  ],
  authors: [{ name: "SpectreVault" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-slate-950`}
      >
        <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
          {/* Subtle background glow effect */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-cyan-600/10 via-sky-600/5 to-transparent blur-3xl rounded-full" />
            <div className="absolute top-1/3 -left-32 w-80 h-80 bg-emerald-600/5 blur-3xl rounded-full" />
            <div className="absolute bottom-10 -right-32 w-80 h-80 bg-cyan-600/5 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
