import "server-only";
import { cookies } from "next/headers";
import { parseSession, sessionCookieOptions, type Session } from "./session-cookie";

/**
 * Read/write the session cookie from Server Components, Route Handlers and
 * Server Actions. Each app has its own cookie name, so signing in to one
 * never signs you in to the other.
 *
 * getSession() returns the session as-is, possibly with an expired access
 * token: middleware keeps it fresh before the request gets here, because a
 * Server Component render can't write a rotated cookie back.
 */
export function createSessionStore(cookieName: string) {
  return {
    async getSession(): Promise<Session | null> {
      return parseSession((await cookies()).get(cookieName)?.value);
    },
    async setSession(session: Session) {
      (await cookies()).set(cookieName, JSON.stringify(session), sessionCookieOptions());
    },
    async clearSession() {
      (await cookies()).delete(cookieName);
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
