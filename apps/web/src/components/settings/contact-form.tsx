"use client";

import { useEffect, useState } from "react";
import { contactSettingsSchema } from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useContactSettings, useSaveContactSettings } from "@/hooks/use-onboarding";

function parseEmails(value: string): string[] {
  return value
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export function ContactForm() {
  const { data: existing } = useContactSettings();
  const save = useSaveContactSettings();

  const [disputeEmails, setDisputeEmails] = useState("");
  const [refundEmails, setRefundEmails] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [generalEmail, setGeneralEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setDisputeEmails(existing.disputeEmails.join(", "));
      setRefundEmails(existing.refundEmails.join(", "));
      setSupportEmail(existing.supportEmail ?? "");
      setGeneralEmail(existing.generalEmail);
    }
  }, [existing]);

  function handleSubmit() {
    const parsed = contactSettingsSchema.safeParse({
      disputeEmails: parseEmails(disputeEmails),
      refundEmails: parseEmails(refundEmails),
      supportEmail,
      generalEmail,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setError(null);
    save.mutate(parsed.data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact</CardTitle>
        <CardDescription>Where we send dispute, refund, and support notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="disputeEmails">Dispute emails (comma-separated)</Label>
          <Input id="disputeEmails" value={disputeEmails} onChange={(e) => setDisputeEmails(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="refundEmails">Refund emails (comma-separated)</Label>
          <Input id="refundEmails" value={refundEmails} onChange={(e) => setRefundEmails(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="supportEmail">Support email</Label>
          <Input id="supportEmail" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="generalEmail">General email</Label>
          <Input id="generalEmail" value={generalEmail} onChange={(e) => setGeneralEmail(e.target.value)} />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} loading={save.isPending}>
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}
