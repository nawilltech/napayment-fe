"use client";

import { useActionState, useState, useTransition } from "react";
import type { ActionState } from "@napayment/bff/actions";
import { Button } from "@napayment/ui/button";
import { Label } from "@napayment/ui/label";
import { Textarea } from "@napayment/ui/textarea";
import { approveKycAction, rejectKycAction } from "@/app/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";

/** Approve, or reject with a reason the business will see. Decisions are recorded in the audit log. */
export function KycReview({ businessId }: { businessId: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [approveState, setApproveState] = useState<ActionState>({});
  const [approving, startApprove] = useTransition();
  const [rejectState, reject] = useActionState(rejectKycAction.bind(null, businessId), {});

  if (rejecting) {
    return (
      <form action={reject} className="space-y-3">
        <div>
          <Label htmlFor="reason">Reason for rejection</Label>
          <Textarea id="reason" name="reason" rows={3} maxLength={512} required placeholder="e.g. Proof of address is older than 3 months" />
          <p className="mt-1 text-xs text-subtle">The business sees this, so say what to fix.</p>
        </div>
        <FormFeedback state={rejectState} />
        <div className="flex gap-2">
          <SubmitButton variant="destructive">Reject KYC</SubmitButton>
          <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <FormFeedback state={approveState} />
      <div className="flex flex-wrap gap-2">
        <Button loading={approving} onClick={() => startApprove(async () => setApproveState(await approveKycAction(businessId)))}>
          Approve KYC
        </Button>
        <Button variant="outline" onClick={() => setRejecting(true)} disabled={approving}>
          Reject…
        </Button>
      </div>
    </div>
  );
}
