import type { Metadata } from "next";
import { TeamInviteForm } from "@/components/onboarding/team-invite-form";

export const metadata: Metadata = { title: "Team — Settings — Napayment" };

export default function TeamSettingsPage() {
  return <TeamInviteForm />;
}
