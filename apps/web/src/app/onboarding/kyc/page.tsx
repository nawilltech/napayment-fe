import type { Metadata } from "next";
import { KycForm } from "@/components/onboarding/kyc-form";

export const metadata: Metadata = { title: "KYC documents — Nawill Pay" };

export default function OnboardingKycPage() {
  return <KycForm />;
}
