import type { Metadata } from "next";
import { fontVariables } from "@napayment/ui/lib/fonts";
import "./globals.css";
import { Providers } from "./providers";

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
      <body className={`${fontVariables} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
