import type { Metadata } from "next";
import { requireBusinessAccount } from "@/server/console";
import { ApiKeysForm } from "@/components/onboarding/api-keys-form";

export const metadata: Metadata = { title: "API Keys & Webhooks — Settings — Napayment" };

export default async function ApiKeysSettingsPage() {
  await requireBusinessAccount();
  return <ApiKeysForm />;
}
