"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { ROLE_TEMPLATE_META, type RoleTemplate } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { DevGapNotice } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface InviteView {
  email: string;
  roleTemplate: RoleTemplate;
  status: string;
}

export function AcceptInviteCard({
  token,
  invite,
  businessName,
}: {
  token: string;
  invite: InviteView;
  businessName: string;
}) {
  const [accepted, setAccepted] = useState(invite.status === "ACCEPTED");
  const accept = useMutation({
    mutationFn: () => api.post("/api/onboarding/invites/accept", { token }),
    onSuccess: () => setAccepted(true),
  });

  return (
    <div className="w-full max-w-md rounded-xl border border-navy-700 bg-surface p-8">
      <h1 className="text-lg font-semibold text-navy-900">You&apos;ve been invited</h1>
      <p className="mt-2 text-sm text-navy-500">
        <span className="font-medium text-navy-800">{businessName}</span> invited{" "}
        <span className="font-medium text-navy-800">{invite.email}</span> to join as{" "}
        <span className="font-medium text-navy-800">{ROLE_TEMPLATE_META[invite.roleTemplate].label}</span>.
      </p>

      <div className="mt-4">
        <StatusBadge status={accepted ? "ACCEPTED" : invite.status} />
      </div>

      <DevGapNotice>
        <>
          there&apos;s no backend &quot;join an existing business&quot; signup path yet — accepting
          here only marks the invite accepted. Creating the actual staff account under{" "}
          {businessName} is blocked on that gap.
        </>
      </DevGapNotice>

      {accepted ? (
        <div className="mt-6 flex items-center gap-2 rounded-md bg-success-surface p-3 text-sm text-success">
          <CheckCircle2 className="size-4" />
          Invite accepted
        </div>
      ) : (
        <Button className="mt-6 w-full" onClick={() => accept.mutate()} loading={accept.isPending}>
          Accept invite
        </Button>
      )}
    </div>
  );
}
