import type { Metadata } from "next";
import { BusinessList } from "@/components/business-list";

export const metadata: Metadata = { title: "KYC review — Napayment Admin" };

/** The review queue: submissions awaiting a decision, oldest first. */
export default async function KycQueuePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return <BusinessList path="/kyc" params={await searchParams} pinnedStatus="PENDING_REVIEW" />;
}
