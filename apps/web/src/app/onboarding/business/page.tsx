import type { Metadata } from "next";
import { BusinessDetailsForm } from "@/components/onboarding/business-details-form";

export const metadata: Metadata = { title: "Business details — Napayment" };

export default function OnboardingBusinessPage() {
  return <BusinessDetailsForm />;
}
