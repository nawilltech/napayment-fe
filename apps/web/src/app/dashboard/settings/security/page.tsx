import type { Metadata } from "next";
import { TransactionPinForm } from "@/components/settings/transaction-pin-form";

export const metadata: Metadata = { title: "Security — Settings — Napayment" };

export default function SecuritySettingsPage() {
  return <TransactionPinForm />;
}
