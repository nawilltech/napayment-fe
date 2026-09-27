import "server-only";
import { createSessionStore } from "@napayment/bff/session";
import { SESSION_COOKIE_NAME } from "@/session-config";

export type { Session } from "@napayment/bff/session-cookie";

export const sessionStore = createSessionStore(SESSION_COOKIE_NAME);
export const { getSession, setSession, clearSession } = sessionStore;
