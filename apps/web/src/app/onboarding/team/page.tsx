import type { Metadata } from "next";
import { TeamInviteForm } from "@/components/onboarding/team-invite-form";

export const metadata: Metadata = { title: "Invite your team — Napayment" };

export default function OnboardingTeamPage() {
  return <TeamInviteForm showContinue />;
}
