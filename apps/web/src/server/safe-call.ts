import "server-only";
import { ApiError } from "@napayment/api-client";

/**
 * Some backend endpoints are gated behind business-owner-only permissions
 * (`business:kyc-manage`, `business:manage`) or a specific role template's
 * subset (`transactions:read`, `virtualaccounts:read`, `apikeys:manage` -
 * none of ADMIN/DEVELOPER/ACCOUNT_OFFICER's fixed permission sets, doc F6,
 * grant all three). A teammate who joined via invite under one of those
 * templates will get a real `403` from several of these calls - expected,
 * not a bug in itself. The bug is calling them unguarded in a Server
 * Component: an uncaught `ApiError` there crashes the whole page render
 * instead of degrading gracefully, which is what actually happened here.
 *
 * Wrap any owner/role-gated call site with this so a `403` (or a `401` from
 * a mid-request session expiry) degrades to `undefined` instead of crashing
 * the page. Anything else re-throws - a `5xx` or network failure is a real
 * problem worth surfacing, not something to silently paper over.
 *
 * Some endpoints also `404` for a reason that's entirely expected mid-
 * onboarding rather than owner/role gating - e.g. `GET /api-keys/webhook-config`
 * 404s with "No active API key for this business" until one's been
 * generated, which is true for every brand-new business on its very first
 * onboarding page. Pass those status codes via `extraStatuses` at the
 * specific call site that expects them - deliberately not swallowed by
 * default, since a 404 elsewhere usually *does* mean something is wrong.
 */
export async function safeCall<T>(promise: Promise<T>, extraStatuses: number[] = []): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 401 || extraStatuses.includes(error.status))) {
      return undefined;
    }
    throw error;
  }
}
