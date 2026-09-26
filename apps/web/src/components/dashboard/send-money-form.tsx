"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { transferSchema } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/ui/pin-input";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useResolveRecipient, useTransfer } from "@/hooks/use-transfer";
import { formatNaira, nairaToKobo } from "@napayment/format";

type Step = "details" | "confirm" | "success";

export function SendMoneyForm() {
  const [step, setStep] = useState<Step>("details");
  const [recipientIdentifier, setRecipientIdentifier] = useState("");
  const [amountNaira, setAmountNaira] = useState("");
  const [narration, setNarration] = useState("");
  const [pin, setPin] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Kept stable across retries of the same confirmed transfer (a lost
  // response on a flaky connection must be safely retriable without risking
  // a second real transfer) - regenerated only when the sender goes back
  // and changes what they're sending.
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const resolveRecipient = useResolveRecipient();
  const transfer = useTransfer();

  function goBackToDetails() {
    idempotencyKeyRef.current = crypto.randomUUID();
    setPin("");
    transfer.reset();
    setStep("details");
  }

  function handleContinue() {
    setFormError(null);
    const amountKobo = nairaToKobo(amountNaira);
    if (!recipientIdentifier.trim()) {
      setFormError("Enter an account number or phone number");
      return;
    }
    if (!amountKobo) {
      setFormError("Enter a valid amount");
      return;
    }
    resolveRecipient.mutate(recipientIdentifier.trim(), {
      onSuccess: () => setStep("confirm"),
    });
  }

  function handleConfirm() {
    const amountKobo = nairaToKobo(amountNaira);
    const payload = {
      recipientIdentifier: recipientIdentifier.trim(),
      amount: amountKobo ?? "0",
      narration: narration.trim() || undefined,
      transactionPin: pin,
    };
    const parsed = transferSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the details above");
      return;
    }
    setFormError(null);
    transfer.mutate(
      { input: parsed.data, idempotencyKey: idempotencyKeyRef.current },
      { onSuccess: () => setStep("success") },
    );
  }

  if (step === "success" && transfer.data) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" />
            <CardTitle>Transfer sent</CardTitle>
          </div>
          <CardDescription>Your money is on its way.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="space-y-2 text-sm">
            {[
              ["Sent to", transfer.data.recipientDisplayName],
              ["Amount", formatNaira(transfer.data.amount)],
              ["Your new balance", formatNaira(transfer.data.senderNewBalance)],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-dashed border-line pb-2">
                <dt className="text-subtle">{label}</dt>
                <dd className="font-medium text-ink">{val}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
        <CardFooter className="justify-start gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setRecipientIdentifier("");
              setAmountNaira("");
              setNarration("");
              goBackToDetails();
            }}
          >
            Send another
          </Button>
          <Link href="/dashboard" className="text-sm font-medium text-brand hover:underline">
            Back to dashboard
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (step === "confirm") {
    const resolved = resolveRecipient.data;
    return (
      <Card>
        <CardHeader>
          <button
            type="button"
            onClick={goBackToDetails}
            className="flex items-center gap-1 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
          <CardTitle>Confirm transfer</CardTitle>
          <CardDescription>Enter your transaction PIN to send.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-dashed border-line pb-2">
              <dt className="text-subtle">Recipient</dt>
              <dd className="font-medium text-ink">
                {resolved?.displayName} · {resolved?.accountNumberMasked}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-dashed border-line pb-2">
              <dt className="text-subtle">Amount</dt>
              <dd className="font-mono text-base font-semibold text-ink">{formatNaira(nairaToKobo(amountNaira) ?? "0")}</dd>
            </div>
            {narration && (
              <div className="flex items-center justify-between gap-4 border-b border-dashed border-line pb-2">
                <dt className="text-subtle">Note</dt>
                <dd className="truncate font-medium text-ink">{narration}</dd>
              </div>
            )}
          </dl>

          <div>
            <Label htmlFor="transactionPin">Transaction PIN</Label>
            <PinInput id="transactionPin" value={pin} onChange={setPin} autoFocus />
          </div>

          {(formError || transfer.error) && (
            <Alert variant="warning">{formError ?? transfer.error?.message}</Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleConfirm} loading={transfer.isPending} disabled={pin.length !== 4}>
            Confirm &amp; send
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send money</CardTitle>
        <CardDescription>Transfer to another Napayment account number or phone number.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="recipientIdentifier">Recipient account number or phone number</Label>
          <Input
            id="recipientIdentifier"
            placeholder="e.g. 0123456789 or 08012345678"
            value={recipientIdentifier}
            onChange={(e) => setRecipientIdentifier(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="amount">Amount (₦)</Label>
          <Input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amountNaira}
            onChange={(e) => setAmountNaira(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="narration">Note (optional)</Label>
          <Textarea
            id="narration"
            rows={2}
            maxLength={128}
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
          />
        </div>

        {(formError || resolveRecipient.error) && (
          <Alert variant="warning">{formError ?? resolveRecipient.error?.message}</Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleContinue} loading={resolveRecipient.isPending}>
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}
