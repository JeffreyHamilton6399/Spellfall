import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-barlow",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const SITE_URL = "https://spellfall.jeffreyhamilton6399.partykit.dev";

export const metadata: Metadata = {
  title: "Spellfall — Multiplayer Word Battle Royale",
  description: "Type fast. Deal damage. Outlast everyone. Spellfall is a free multiplayer word battle-royale where your vocabulary is your weapon.",
  icons: [
    { rel: "icon", url: "/icon.svg", type: "image/svg+xml" },
  ],
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Spellfall",
    title: "Spellfall — Multiplayer Word Battle Royale",
    description: "Type fast. Deal damage. Outlast everyone.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary",
    title: "Spellfall — Multiplayer Word Battle Royale",
    description: "Type fast. Deal damage. Outlast everyone.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
