"use client";

import { useActionState, useState, useTransition } from "react";
import type { BusinessPaymentProcessor, ProcessorAvailabilitySource } from "@napayment/api-client";
import type { ActionState } from "@napayment/bff/actions";
import { formatDateTime } from "@napayment/format";
import { Alert } from "@napayment/ui/alert";
import { Badge } from "@napayment/ui/badge";
import { Button } from "@napayment/ui/button";
import { Label } from "@napayment/ui/label";
import { cn } from "@napayment/ui/lib/cn";
import { Textarea } from "@napayment/ui/textarea";
import {
  activateBusinessAction,
  deactivateBusinessAction,
  setBusinessProcessorAction,
  type BusinessProcessorSetting,
} from "@/app/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";
import { MethodChips } from "./processor-admin";
import { LogoTile } from "./processor-logo";

/** FR-Admin-6: deactivate (with a reason) or reactivate a business. */
export function BusinessStatusControl({
  businessId,
  active,
  reason,
  changedAt,
}: {
  businessId: string;
  active: boolean;
  reason: string | null;
  changedAt: string | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deactivateState, deactivate] = useActionState(deactivateBusinessAction.bind(null, businessId), {});
  const [activateState, setActivateState] = useState<ActionState>({});
  const [activating, startActivate] = useTransition();

  if (!active) {
    return (
      <div className="space-y-3">
        <Alert variant="warning">
          Deactivated{changedAt && ` ${formatDateTime(changedAt)}`}: {reason}
        </Alert>
        <p className="text-[13.5px] text-muted">
          The business can&apos;t receive or move money or use its API keys. Its team can still sign in and view data.
        </p>
        <FormFeedback state={activateState} />
        <Button
          loading={activating}
          onClick={() => startActivate(async () => setActivateState(await activateBusinessAction(businessId)))}
        >
          Reactivate business
        </Button>
      </div>
    );
  }

  if (confirming) {
    return (
      <form action={deactivate} className="space-y-3">
        <div>
          <Label htmlFor="deactivate-reason">Reason</Label>
          <Textarea id="deactivate-reason" name="reason" rows={3} maxLength={512} required placeholder="e.g. Chargeback investigation" />
          <p className="mt-1 text-xs text-subtle">Recorded in the audit log.</p>
        </div>
        <FormFeedback state={deactivateState} />
        <div className="flex gap-2">
          <SubmitButton variant="destructive">Deactivate business</SubmitButton>
          <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13.5px] text-muted">
        Active. Deactivating stops collections, settlements, transfers and API keys; the team keeps read-only access.
      </p>
      <Button variant="outline" onClick={() => setConfirming(true)}>
        Deactivate…
      </Button>
    </div>
  );
}

const SOURCE_LABEL: Record<ProcessorAvailabilitySource, string> = {
  PROCESSOR_INACTIVE: "Processor inactive platform-wide",
  BUSINESS_SETTING: "Set for this business",
  PLATFORM_DEFAULT: "Platform default",
};

const SETTINGS: { value: BusinessProcessorSetting; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

function currentSetting(row: BusinessPaymentProcessor): BusinessProcessorSetting {
  return row.businessSetting === null ? "default" : row.businessSetting ? "on" : "off";
}

/** FR-Admin-5: every processor for this business, whether it's available and why, with On / Off / Default. */
export function BusinessProcessorsTable({ businessId, rows }: { businessId: string; rows: BusinessPaymentProcessor[] }) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  function change(processorId: string, setting: BusinessProcessorSetting) {
    startTransition(async () => setState(await setBusinessProcessorAction(businessId, processorId, setting)));
  }

  if (rows.length === 0) return <p className="text-[13.5px] text-subtle">No payment processors on the platform yet.</p>;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line-soft">
        {rows.map((row) => {
          const setting = currentSetting(row);
          return (
            <li key={row.processorId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <LogoTile name={row.name} logo={row.logo} size={24} />
                  <span className="text-[13.5px] font-semibold text-ink">{row.name}</span>
                  <Badge variant={row.available ? "success" : "neutral"}>{row.available ? "Available" : "Unavailable"}</Badge>
                </div>
                <p className="text-xs text-subtle">
                  {SOURCE_LABEL[row.source]}
                  {row.source === "PLATFORM_DEFAULT" && ` (${row.defaultEnabled ? "on" : "off"})`}
                </p>
                <MethodChips methods={row.methods} />
              </div>
              <div role="radiogroup" aria-label={`${row.name} for this business`} className="flex rounded-lg border border-line p-0.5">
                {SETTINGS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={setting === option.value}
                    disabled={pending}
                    onClick={() => setting !== option.value && change(row.processorId, option.value)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors disabled:opacity-60",
                      setting === option.value ? "bg-brand text-cream" : "text-muted hover:text-ink",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <FormFeedback state={state} />
    </div>
  );
}
