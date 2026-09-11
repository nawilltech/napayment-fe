import "server-only";
import { authedBackendClient } from "./backend-client";
import { safeCall } from "./safe-call";

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
export async function computeOnboardingStatus() {
  const client = await authedBackendClient();
  const [businessDetails, documents, invites, webhookConfig, apiKeys] = await Promise.all([
    safeCall(client.business.getKycDetails()),
    safeCall(client.kyc.listDocuments()),
    safeCall(client.team.listInvites()),
    safeCall(client.apiKeys.getWebhookConfig()),
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
    webhookConfigured:
      webhookConfig === undefined ? true : Boolean(webhookConfig.callbackUrl || webhookConfig.webhookUrl),
    apiKeysDone: apiKeys === undefined ? true : apiKeys.totalElements > 0,
  };
}
