import type { Metadata } from "next";
import { BusinessList } from "@/components/business-list";

export const metadata: Metadata = { title: "Businesses — Napayment Admin" };

export default async function BusinessesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return <BusinessList path="/businesses" params={await searchParams} />;
}
