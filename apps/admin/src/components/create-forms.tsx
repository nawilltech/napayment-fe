"use client";

import { useActionState, useEffect, useState } from "react";
import {
  apiRequest,
  SAME_ORIGIN,
  type BankResponse,
  type PageResponse,
  type ResolvedBankAccountResponse,
} from "@napayment/api-client";
import { BankCombobox } from "@napayment/ui/bank-combobox";
import { Input } from "@napayment/ui/input";
import { Label } from "@napayment/ui/label";
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

async function searchBanks(term: string): Promise<BankResponse[]> {
  return (await apiRequest<PageResponse<BankResponse>>(SAME_ORIGIN, "/api/banks", { query: { term } })).content;
}

type NameLookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "resolved"; accountName: string }
  | { status: "failed"; message: string };

function resolveAccountName(bankId: string, accountNumber: string): Promise<ResolvedBankAccountResponse> {
  return apiRequest<ResolvedBankAccountResponse>(SAME_ORIGIN, "/api/banks/resolve-account", {
    query: { bankId, accountNumber },
  });
}

/**
 * Where every collection is mirrored (SUPERADMIN only). One per platform.
 * The account name is never typed in: it comes from Name Enquiry once a bank
 * and a 10-digit number are entered, and the backend stores its own
 * resolved name on save.
 */
export function CreateCollectionAccountForm() {
  const [state, action] = useActionState(createCollectionAccountAction, {});
  const [bank, setBank] = useState<BankResponse | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [lookup, setLookup] = useState<NameLookup>({ status: "idle" });

  useEffect(() => {
    if (!bank || !/^\d{10}$/.test(accountNumber)) {
      setLookup({ status: "idle" });
      return;
    }
    let current = true;
    setLookup({ status: "loading" });
    resolveAccountName(bank.id, accountNumber)
      .then((resolved) => current && setLookup({ status: "resolved", accountName: resolved.accountName }))
      .catch((error: Error) => current && setLookup({ status: "failed", message: error.message }));
    return () => {
      current = false;
    };
  }, [bank, accountNumber]);

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="bankId">Bank</Label>
        <BankCombobox id="bankId" name="bankId" search={searchBanks} onChange={setBank} required />
      </div>
      <div>
        <Label htmlFor="accountNumber">Account number</Label>
        <Input
          id="accountNumber"
          name="accountNumber"
          inputMode="numeric"
          maxLength={10}
          className="font-mono"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          required
        />
      </div>
      <div>
        <Label htmlFor="accountName">Account name</Label>
        <Input
          id="accountName"
          readOnly
          tabIndex={-1}
          aria-live="polite"
          aria-invalid={lookup.status === "failed"}
          className="bg-paper"
          placeholder="Filled in automatically from the bank"
          value={
            lookup.status === "resolved"
              ? lookup.accountName
              : lookup.status === "loading"
                ? "Looking up account name…"
                : ""
          }
        />
        {lookup.status === "failed" ? <p className="mt-1.5 text-[13px] text-danger">{lookup.message}</p> : null}
      </div>
      <FormFeedback state={state} />
      <SubmitButton disabled={lookup.status !== "resolved"}>Save collection account</SubmitButton>
    </form>
  );
}
