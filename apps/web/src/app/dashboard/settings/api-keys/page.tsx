import type { Metadata } from "next";
import { ApiKeysForm } from "@/components/onboarding/api-keys-form";

export const metadata: Metadata = { title: "API Keys & Webhooks — Settings — Napayment" };

export default function ApiKeysSettingsPage() {
  return <ApiKeysForm />;
}
