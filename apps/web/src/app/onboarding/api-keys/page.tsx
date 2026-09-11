import type { Metadata } from "next";
import { ApiKeysForm } from "@/components/onboarding/api-keys-form";

export const metadata: Metadata = { title: "API keys & webhooks — Nawill Pay" };

export default function OnboardingApiKeysPage() {
  return <ApiKeysForm showContinue />;
}
