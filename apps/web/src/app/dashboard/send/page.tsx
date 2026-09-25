import type { Metadata } from "next";
import { SendMoneyForm } from "@/components/dashboard/send-money-form";

export const metadata: Metadata = { title: "Send Money — Napayment" };

export default function SendMoneyPage() {
  return (
    <div className="max-w-lg">
      <SendMoneyForm />
    </div>
  );
}
