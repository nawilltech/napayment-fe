import { Logo } from "@/components/brand/logo";
import { AcceptInviteForm } from "@/components/onboarding/accept-invite-form";

/**
 * No public "resolve invite by token" endpoint exists yet (doc F9 addendum -
 * only POST/GET/DELETE /api/v1/team/invitations, all business-owner-scoped
 * and authenticated, plus POST /api/v1/auth/signup/accept-invite itself,
 * which needs no prior lookup since it derives the email from the token
 * server-side). So this page can't show "you're joining X as Y" up front -
 * it just collects the new user's details and submits directly.
 */
export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-cream px-4 py-8">
      <Logo size={36} wordmarkClassName="text-ink" />
      <AcceptInviteForm token={token} />
    </div>
  );
}
