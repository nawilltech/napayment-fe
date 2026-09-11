import "server-only";
import type { Session } from "./session";
import { authedBackendClient } from "./backend-client";
import { getOnboardingProgress } from "./dev-store";

export async function computeOnboardingStatus(session: Session) {
  const [progress, apiKeys] = await Promise.all([
    getOnboardingProgress(session.businessId),
    authedBackendClient().then((client) => client.apiKeys.list({ size: 1 })),
  ]);

  return {
    ...progress,
    apiKeysDone: apiKeys.totalElements > 0,
  };
}
