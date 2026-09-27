import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { accountKind } from "@napayment/bff/account";
import { authedBackendClient } from "./backend-client";
import { sessionStore } from "./session";

/**
 * The signed-in staff member, once per request. Sign-in already refuses
 * non-staff accounts (actions.ts); this is the defence-in-depth check for a
 * session that somehow isn't staff - cleared via the sign-out route, since a
 * Server Component can't delete cookies itself.
 */
export const getStaff = cache(async () => {
  if (!(await sessionStore.getSession())) redirect("/login");
  const me = await (await authedBackendClient()).users.me();
  if (accountKind(me) !== "platform") redirect("/api/auth/sign-out?reason=staff-only");
  return me;
});
