import type { Metadata } from "next";
import { ReviewSummary } from "@/components/onboarding/review-summary";

export const metadata: Metadata = { title: "Review & finish — Nawill Pay" };

export default function OnboardingReviewPage() {
  return <ReviewSummary />;
}
