import "server-only";
import { cache } from "react";
import { authedBackendClient } from "./backend-client";
import { safeCall } from "./safe-call";
import type { OnboardingStep } from "@/components/onboarding/stepper";

/**
 * These checks are all gated behind business-owner-only permissions
 * (`business:kyc-manage`, `apikeys:manage`, `roles:manage` isn't checked
 * here but the same story applies). A teammate who joined via invite under
 * the ADMIN/DEVELOPER/ACCOUNT_OFFICER role templates (doc F6) doesn't hold
 * `business:kyc-manage` under any of them - only the actual business owner
 * does. For that caller every `business.*`/`kyc.*` call 403s; each is
 * wrapped in `safeCall` so that degrades to "treat as done, don't nag a
 * teammate with an activation checklist they have no permission to act on"
 * rather than crashing the page (the bug this replaced).
 */
// cache(): the console layout and the Home checklist both need this in one
// request - dedupe so it's one round of backend calls, not two.
export const computeOnboardingStatus = cache(async () => {
  const client = await authedBackendClient();
  const [businessDetails, documents, invites, webhookConfig, apiKeys] = await Promise.all([
    safeCall(client.business.getKycDetails()),
    safeCall(client.kyc.listDocuments()),
    safeCall(client.team.listInvites()),
    // 404s with "No active API key for this business" until one's been
    // generated - true for every brand-new business on its first visit here.
    safeCall(client.apiKeys.getWebhookConfig(), [404]),
    safeCall(client.apiKeys.list({ size: 1 })),
  ]);

  return {
    businessDetailsDone: businessDetails === undefined ? true : Boolean(businessDetails),
    // No direct "current KYC status" read-back exists yet (doc F9 addendum -
    // GET /business/kyc/details doesn't include kycStatus even though the
    // Business entity has it). All 4 required documents present is the best
    // available proxy: submission is blocked until they are, so this is
    // accurate except for the narrow window between "all docs uploaded" and
    // "submit button actually clicked."
    kycSubmitted: documents === undefined ? true : documents.length >= 4,
    teamInvited: invites === undefined ? true : invites.length > 0,
    // undefined here covers both "no permission to see it" (don't nag) and
    // "no API key yet" (genuinely not configured) - defaulting to true is
    // still correct for the latter case too, since the stepper combines this
    // with apiKeysDone (false until a key exists), which is the real gate.
    webhookConfigured:
      webhookConfig === undefined ? true : Boolean(webhookConfig.callbackUrl || webhookConfig.webhookUrl),
    apiKeysDone: apiKeys === undefined ? true : apiKeys.totalElements > 0,
  };
});

export type OnboardingStatus = Awaited<ReturnType<typeof computeOnboardingStatus>>;

/** One list drives the onboarding stepper, the sidebar "3/5" tag and the Home checklist. */
export function activationSteps(status: OnboardingStatus): OnboardingStep[] {
  return [
    { key: "business", label: "Business details", href: "/onboarding/business", done: status.businessDetailsDone },
    { key: "kyc", label: "KYC documents", href: "/onboarding/kyc", done: status.kycSubmitted },
    { key: "team", label: "Invite your team", href: "/onboarding/team", done: status.teamInvited },
    {
      key: "api-keys",
      label: "API keys & webhooks",
      href: "/onboarding/api-keys",
      done: status.apiKeysDone && status.webhookConfigured,
    },
    { key: "review", label: "Review & finish", href: "/onboarding/review", done: false },
  ];
}

/** Same gate the dashboard banner has always used - review isn't a stored state. */
export function isActivationDone(status: OnboardingStatus): boolean {
  return status.businessDetailsDone && status.kycSubmitted && status.apiKeysDone;
}
