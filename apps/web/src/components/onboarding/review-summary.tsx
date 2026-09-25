"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOnboardingStatus } from "@/hooks/use-onboarding";

const ITEMS = [
  { key: "businessDetailsDone", label: "Business details", href: "/onboarding/business" },
  { key: "kycSubmitted", label: "KYC documents submitted", href: "/onboarding/kyc" },
  { key: "teamInvited", label: "Team invited", href: "/onboarding/team", optional: true },
  { key: "apiKeysDone", label: "API key generated", href: "/onboarding/api-keys" },
  { key: "webhookConfigured", label: "Webhook configured", href: "/onboarding/api-keys", optional: true },
] as const;

export function ReviewSummary() {
  const router = useRouter();
  const { data: status } = useOnboardingStatus();

  const requiredDone = status
    ? status.businessDetailsDone && status.kycSubmitted && status.apiKeysDone
    : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & finish</CardTitle>
        <CardDescription>
          Your dashboard is usable regardless — completing this earns full activation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {ITEMS.map((item) => {
          const done = status?.[item.key] ?? false;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-paper"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-ink">
                {done ? <Check className="size-4 text-success" /> : <Circle className="size-4 text-faint" />}
                {item.label}
                {"optional" in item && item.optional && (
                  <span className="text-xs font-normal text-subtle">(optional)</span>
                )}
              </span>
              <span className="text-xs text-subtle">{done ? "Done" : "Set up"}</span>
            </Link>
          );
        })}
      </CardContent>
      <CardFooter>
        <Button disabled={!requiredDone} onClick={() => router.push("/dashboard")}>
          Go to dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}
