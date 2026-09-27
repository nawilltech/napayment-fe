import type { Metadata } from "next";
import { requireBusinessAccount } from "@/server/console";
import { TeamInviteForm } from "@/components/onboarding/team-invite-form";

export const metadata: Metadata = { title: "Team — Settings — Napayment" };

export default async function TeamSettingsPage() {
  await requireBusinessAccount();
  return <TeamInviteForm />;
}
