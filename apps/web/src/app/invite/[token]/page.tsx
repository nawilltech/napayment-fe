import { findInviteByToken, getProfileByBusinessId } from "@/server/dev-store";
import { AcceptInviteCard } from "@/components/onboarding/accept-invite-card";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await findInviteByToken(token);

  if (!found) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
        <div className="w-full max-w-md rounded-xl border border-navy-700 bg-surface p-8 text-center">
          <h1 className="text-lg font-semibold text-navy-900">Invite not found</h1>
          <p className="mt-2 text-sm text-navy-500">This invite link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const inviterProfile = await getProfileByBusinessId(found.businessId);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4">
      <AcceptInviteCard
        token={token}
        invite={found.invite}
        businessName={inviterProfile?.businessName ?? "a Nawill Pay business"}
      />
    </div>
  );
}
