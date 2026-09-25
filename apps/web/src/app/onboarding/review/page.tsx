import type { Metadata } from "next";
import { ReviewSummary } from "@/components/onboarding/review-summary";

export const metadata: Metadata = { title: "Review & finish — Napayment" };

export default function OnboardingReviewPage() {
  return <ReviewSummary />;
}
