import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { accountKind } from "@/lib/account";
import { authedBackendClient } from "./backend-client";
import { activationSteps, computeOnboardingStatus, isActivationDone } from "./onboarding-status";
import { getSession } from "./session";

/**
 * Everything the console shell needs about the signed-in account, loaded
 * once per request (cache) and shared by the layouts and pages that ask.
 *
 * Platform staff are sent to /admin-account before any business endpoint is
 * called; the business-only onboarding checks run for business accounts
 * only - the backend answers them with 400 for anyone without a business.
 */
/** The signed-in user (once per request); no session means back to /login. */
export const getCurrentUser = cache(async () => {
  if (!(await getSession())) redirect("/login");
  return (await authedBackendClient()).users.me();
});

export const loadConsole = cache(async () => {
  const me = await getCurrentUser();
  const kind = accountKind(me);
  if (kind === "platform") redirect("/admin-account");
  if (kind === "individual") return { me, kind, steps: null, activation: undefined } as const;

  const status = await computeOnboardingStatus();
  const steps = activationSteps(status);
  return {
    me,
    kind,
    steps,
    activation: {
      done: steps.filter((s) => s.done).length,
      total: steps.length,
      complete: isActivationDone(status),
    },
  } as const;
});

/** Guard for business-only pages (activation, team, API keys, contact). */
export async function requireBusinessAccount() {
  const account = await loadConsole();
  if (account.kind !== "business") redirect("/dashboard");
  return account;
}
