import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Special_Elite } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Napayment — Business Console",
  description:
    "Collect fees, bills and levies for schools, hospitals, government agencies and businesses - by transfer, payment link or cash, with SMS receipts. A Nawill Technology product.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable} ${specialElite.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
