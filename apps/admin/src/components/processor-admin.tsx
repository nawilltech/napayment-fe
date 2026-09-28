"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type {
  PaymentMethodCode,
  PaymentMethodOption,
  PaymentMethodResponse,
  PaymentProcessorResponse,
} from "@napayment/api-client";
import type { ActionState } from "@napayment/bff/actions";
import { plural } from "@napayment/format";
import { Badge } from "@napayment/ui/badge";
import { Button } from "@napayment/ui/button";
import { Input } from "@napayment/ui/input";
import { Label } from "@napayment/ui/label";
import {
  createProcessorAction,
  setProcessorForAllAction,
  setProcessorLogoAction,
  setProcessorMethodAction,
  updateProcessorAction,
} from "@/app/actions";
import { CreateDialog } from "./create-dialog";
import { FormFeedback, SubmitButton } from "./form-feedback";
import { ConfirmAction } from "./confirm-action";
import { LogoPicker } from "./processor-logo";

/** Payment method chips; retired methods are struck through. */
export function MethodChips({ methods }: { methods: PaymentMethodOption[] }) {
  if (methods.length === 0) return <span className="text-[13px] text-subtle">None</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {methods.map((m) => (
        <Badge key={m.method} variant={m.active ? "pending" : "neutral"} className={m.active ? undefined : "line-through"}>
          {m.label}
        </Badge>
      ))}
    </span>
  );
}

/** "+ Add processor": the create form in a dialog. */
export function AddProcessorButton({ methods }: { methods: PaymentMethodResponse[] }) {
  return (
    <CreateDialog
      label="Add processor"
      title="Add a payment processor"
      description="Its API keys live in the deployment configuration under the processor's code - never here."
      wide
    >
      {(close) => <CreateProcessorForm methods={methods} onSaved={close} />}
    </CreateDialog>
  );
}

/** Configuration -> Payment processors: add one with the methods it offers (FR-Proc-1/2). */
export function CreateProcessorForm({ methods, onSaved }: { methods: PaymentMethodResponse[]; onSaved?: () => void }) {
  const [state, action] = useActionState(createProcessorAction, {});
  const [logo, setLogo] = useState<string | null>(null);
  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state, onSaved]);
  return (
    <form action={action} className="space-y-4">
      <LogoPicker name="logo" label="New processor" value={logo} onChange={setLogo} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_120px]">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="e.g. Paystack" required maxLength={64} />
        </div>
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" placeholder="e.g. PAYSTACK" required maxLength={32} className="font-mono uppercase" />
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Input id="priority" name="priority" type="number" min={0} max={1000} placeholder="100" inputMode="numeric" />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 text-[13px] font-semibold text-ink">Payment methods</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {methods
            .filter((m) => m.status === "ACTIVE")
            .map((m) => (
              <label key={m.code} className="flex items-center gap-2 text-[13.5px] text-ink">
                <input type="checkbox" name="methods" value={m.code} className="size-4 accent-brand" />
                {m.name}
              </label>
            ))}
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-[13.5px] text-ink">
        <input type="checkbox" name="defaultEnabled" defaultChecked className="mt-0.5 size-4 accent-brand" />
        <span>
          On for all businesses
          <span className="block text-xs text-subtle">You can still switch it off for individual businesses.</span>
        </span>
      </label>
      <FormFeedback state={state} success="Processor added." />
      <SubmitButton>Add processor</SubmitButton>
    </form>
  );
}

/** Logo on the processor page: changes save immediately. */
export function ProcessorLogoEditor({ processor }: { processor: PaymentProcessorResponse }) {
  const [state, setState] = useState<ActionState>({});
  const [, startTransition] = useTransition();
  return (
    <div className="space-y-3">
      <LogoPicker
        label={processor.name}
        value={processor.logo}
        onChange={(logo) => startTransition(async () => setState(await setProcessorLogoAction(processor.id, logo)))}
      />
      <FormFeedback state={state} success="Logo saved." />
    </div>
  );
}

export function ProcessorDetailsForm({ processor }: { processor: PaymentProcessorResponse }) {
  const [state, action] = useActionState(updateProcessorAction.bind(null, processor.id), {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={processor.name} required maxLength={64} />
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Input id="priority" name="priority" type="number" min={0} max={1000} defaultValue={processor.priority} />
        </div>
      </div>
      <p className="text-xs text-subtle">
        Code <span className="font-mono">{processor.code}</span> can&apos;t change - it links the processor to its keys in
        the deployment configuration. Lower priority numbers are tried first.
      </p>
      <FormFeedback state={state} success="Saved." />
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}

/** Every catalogue method: offered, disabled (kept for history) or not offered, with the matching action. */
export function ProcessorMethodsEditor({
  processor,
  allMethods,
}: {
  processor: PaymentProcessorResponse;
  allMethods: PaymentMethodResponse[];
}) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<PaymentMethodCode | null>(null);
  // Processor-level state; `active` here is false when either the processor or the platform switched it off.
  const offered = new Map(processor.methods.map((m) => [m.method, m.active]));

  function toggle(method: PaymentMethodCode, enable: boolean) {
    setBusy(method);
    startTransition(async () => {
      setState(await setProcessorMethodAction(processor.id, method, enable));
      setBusy(null);
    });
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line-soft">
        {allMethods.map(({ code: method, name: label, status: platformStatus }) => {
          const active = offered.get(method);
          const platformOff = platformStatus !== "ACTIVE";
          const status = platformOff
            ? "Deactivated platform-wide"
            : active === undefined
              ? "Not offered"
              : active
                ? "Offered"
                : "Disabled";
          return (
            <li key={method} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
                <span className="block text-xs text-subtle">{status}</span>
              </span>
              <Button
                size="sm"
                variant={active ? "outline" : "secondary"}
                loading={pending && busy === method}
                disabled={pending || platformOff}
                onClick={() => toggle(method, !active)}
              >
                {active ? "Disable" : active === undefined ? "Add" : "Enable"}
              </Button>
            </li>
          );
        })}
      </ul>
      <FormFeedback state={state} />
    </div>
  );
}

export function ProcessorForAllSwitch({ processor }: { processor: PaymentProcessorResponse }) {
  const overrides = processor.businessesSwitchedOn + processor.businessesSwitchedOff;
  const clears = overrides > 0 ? ` This clears ${plural(overrides, "business setting")}.` : "";
  return (
    <div className="space-y-3">
      <p className="text-[13.5px] text-muted">
        Default for businesses: <strong className="text-ink">{processor.defaultEnabled ? "On" : "Off"}</strong>.{" "}
        {processor.businessesSwitchedOn} switched on and {processor.businessesSwitchedOff} switched off individually.
      </p>
      <div className="flex flex-wrap items-start gap-2">
        <ConfirmAction
          icon="activate"
          label="Switch on for all businesses"
          title={`Switch ${processor.name} on for all businesses?`}
          description={`Every business will be able to use it.${clears}`}
          confirmLabel="Switch on for all"
          onConfirm={(password) => setProcessorForAllAction(processor.id, true, password)}
        />
        <ConfirmAction
          icon="deactivate"
          label="Switch off for all businesses"
          title={`Switch ${processor.name} off for all businesses?`}
          description={`No business will be able to use it unless switched on individually later.${clears}`}
          confirmLabel="Switch off for all"
          destructive
          onConfirm={(password) => setProcessorForAllAction(processor.id, false, password)}
        />
      </div>
    </div>
  );
}
