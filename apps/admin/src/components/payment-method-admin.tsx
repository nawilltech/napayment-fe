"use client";

import { useActionState, useEffect } from "react";
import type { PaymentMethodResponse } from "@napayment/api-client";
import { Input } from "@napayment/ui/input";
import { Label } from "@napayment/ui/label";
import {
  createPaymentMethodAction,
  updatePaymentMethodAction,
} from "@/app/actions";
import { CreateDialog } from "./create-dialog";
import { FormFeedback, SubmitButton } from "./form-feedback";

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

