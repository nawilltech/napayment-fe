import type { Metadata } from "next";
import { ThemeProvider } from "@napayment/ui/theme";
import { ThemeHead } from "@napayment/ui/theme-head";
import { fontVariables } from "@napayment/ui/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Napayment — Admin",
  description: "Napayment platform administration: businesses, KYC review, transactions and audit logs.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeHead />
      </head>
      <body className={`${fontVariables} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
