"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { PaymentMethodResponse } from "@napayment/api-client";
import type { ActionState } from "@napayment/bff/actions";
import { plural } from "@napayment/format";
import { Button } from "@napayment/ui/button";
import { Input } from "@napayment/ui/input";
import { Label } from "@napayment/ui/label";
import {
  createPaymentMethodAction,
  deletePaymentMethodAction,
  setPaymentMethodActiveAction,
  updatePaymentMethodAction,
} from "@/app/actions";
import { CreateDialog } from "./create-dialog";
import { FormFeedback, SubmitButton } from "./form-feedback";
import { PasswordConfirmButton } from "./password-confirm-button";

/** "+ Add payment method": the create form in a dialog. */
export function AddPaymentMethodButton() {
  return (
    <CreateDialog
      label="Add payment method"
      title="Add a payment method"
      description="Once added, payment processors can offer it. Its code is permanent - processors and transactions refer to it."
      wide
    >
      {(close) => <CreatePaymentMethodForm onSaved={close} />}
    </CreateDialog>
  );
}

/** Configuration -> Payment methods: add one to the catalogue (FR-Proc-2). */
export function CreatePaymentMethodForm({ onSaved }: { onSaved?: () => void }) {
  const [state, action] = useActionState(createPaymentMethodAction, {});
  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state, onSaved]);
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_120px]">
        <div>
          <Label htmlFor="pm-name">Name</Label>
          <Input id="pm-name" name="name" placeholder="e.g. Mobile money" required maxLength={64} />
        </div>
        <div>
          <Label htmlFor="pm-code">Code</Label>
          <Input id="pm-code" name="code" placeholder="e.g. MOBILE_MONEY" required maxLength={32} className="font-mono uppercase" />
        </div>
        <div>
          <Label htmlFor="pm-order">Order</Label>
          <Input id="pm-order" name="displayOrder" type="number" min={0} max={1000} placeholder="100" inputMode="numeric" />
        </div>
      </div>
      <div>
        <Label htmlFor="pm-description">Description</Label>
        <Input id="pm-description" name="description" placeholder="Optional - shown to staff" maxLength={256} />
      </div>
      <FormFeedback state={state} success="Payment method added." />
      <SubmitButton>Add payment method</SubmitButton>
    </form>
  );
}

export function PaymentMethodDetailsForm({ method }: { method: PaymentMethodResponse }) {
  const [state, action] = useActionState(updatePaymentMethodAction.bind(null, method.id), {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div>
          <Label htmlFor="pm-name">Name</Label>
          <Input id="pm-name" name="name" defaultValue={method.name} required maxLength={64} />
        </div>
        <div>
          <Label htmlFor="pm-order">Order</Label>
          <Input id="pm-order" name="displayOrder" type="number" min={0} max={1000} defaultValue={method.displayOrder} />
        </div>
      </div>
      <div>
        <Label htmlFor="pm-description">Description</Label>
        <Input id="pm-description" name="description" defaultValue={method.description ?? ""} maxLength={256} />
      </div>
      <p className="text-xs text-subtle">
        Code <span className="font-mono">{method.code}</span> can&apos;t change - processors and past transactions refer to
        it. Lower order numbers show first.
      </p>
      <FormFeedback state={state} success="Saved." />
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}

export function PaymentMethodPlatformSwitch({ method }: { method: PaymentMethodResponse }) {
  const active = method.status === "ACTIVE";
  return (
    <div className="space-y-3">
      <p className="text-[13.5px] text-muted">
        {active
          ? "Active: processors that offer it can take payments with it."
          : "Inactive: no processor can take new payments with it. Processors keep it listed for when it's reactivated."}
      </p>
      <PasswordConfirmButton
        label={active ? "Deactivate for the platform" : "Activate for the platform"}
        title={active ? `Deactivate ${method.name}?` : `Activate ${method.name}?`}
        description={
          active
            ? `Payments with ${method.name} will stop across every processor and business until it's reactivated.`
            : `Processors that offer ${method.name} will be able to take payments with it again.`
        }
        confirmLabel={active ? "Deactivate" : "Activate"}
        variant={active ? "destructive" : "primary"}
        onConfirm={(password) => setPaymentMethodActiveAction(method.id, !active, password)}
      />
    </div>
  );
}

/** Delete while unused; once processors or transactions use it, only deactivation is possible. */
export function DeletePaymentMethodButton({ method }: { method: PaymentMethodResponse }) {
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  if (method.processorCount > 0) {
    return (
      <p className="text-[13.5px] text-muted">
        Used by {plural(method.processorCount, "processor")}, so it can&apos;t be deleted - deactivate it instead.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-[13.5px] text-muted">Not used by any processor. Deleting is permanent.</p>
      <FormFeedback state={state} />
      {confirming ? (
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            loading={pending}
            onClick={() => startTransition(async () => setState(await deletePaymentMethodAction(method.id)))}
          >
            Delete {method.name}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
          Delete…
        </Button>
      )}
    </div>
  );
}
