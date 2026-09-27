"use client";

import { useActionState } from "react";
import type { BankResponse } from "@napayment/api-client";
import { Input } from "@napayment/ui/input";
import { Label } from "@napayment/ui/label";
import { Select } from "@napayment/ui/select";
import { createCollectionAccountAction, createProcessorAction } from "@/app/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";

export function CreateProcessorForm() {
  const [state, action] = useActionState(createProcessorAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2.5">
      <div className="min-w-[220px] flex-1">
        <Label htmlFor="name">New processor</Label>
        <Input id="name" name="name" placeholder="e.g. Paystack" required />
      </div>
      <SubmitButton>Add processor</SubmitButton>
      <div className="basis-full">
        <FormFeedback state={state} success="Processor added." />
      </div>
    </form>
  );
}

/** Where every collection is mirrored (SUPERADMIN only). One per platform. */
export function CreateCollectionAccountForm({ banks }: { banks: BankResponse[] }) {
  const [state, action] = useActionState(createCollectionAccountAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="bankId">Bank</Label>
        <Select id="bankId" name="bankId" required defaultValue="">
          <option value="" disabled>
            Choose a bank
          </option>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>
              {bank.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="accountNumber">Account number</Label>
          <Input id="accountNumber" name="accountNumber" inputMode="numeric" maxLength={10} className="font-mono" required />
        </div>
        <div>
          <Label htmlFor="accountName">Account name</Label>
          <Input id="accountName" name="accountName" required />
        </div>
      </div>
      <FormFeedback state={state} />
      <SubmitButton>Save collection account</SubmitButton>
    </form>
  );
}
