import type { UserResponse } from "@napayment/api-client";

/**
 * Who is signed in, as far as the console is concerned. The backend decides
 * business scope by `businessId`, not `userType` (CurrentUserResolver
 * #requireBusinessScope): business owners and invited teammates have one;
 * individual signups and platform staff don't.
 *
 * - business   - the full Business Console
 * - individual - the console minus business-only parts (activation, KYC,
 *                team, API keys), which the backend rejects without a business
 * - platform   - Napayment staff; belongs in the admin console, not here
 */
export type AccountKind = "business" | "individual" | "platform";

const PLATFORM_USER_TYPES: ReadonlySet<string> = new Set(["ADMIN", "SUPERADMIN"]);

export function accountKind(user: Pick<UserResponse, "userType" | "businessId">): AccountKind {
  if (PLATFORM_USER_TYPES.has(user.userType)) return "platform";
  return user.businessId ? "business" : "individual";
}
