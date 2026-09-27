import type { Metadata } from "next";
import { fontVariables } from "@napayment/ui/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Napayment — Admin",
  description: "Napayment platform administration: businesses, KYC review, transactions and audit logs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fontVariables} antialiased`}>{children}</body>
    </html>
  );
}
