import "server-only";
import {
  createBackendClient,
  type AuthResponse,
  type BackendClient,
  type LoginRequest,
  type UserResponse,
} from "@napayment/api-client";
import { backendBaseUrl, sessionFromAuth } from "./session-cookie";
import type { SessionStore } from "./session";

/** Thrown by signIn when `allow` rejects the account - no session was created. */
export class SignInNotAllowedError extends Error {}

/**
 * Backend login, then the session cookie. Shared by web's route handler and
 * admin's server action. `allow` (e.g. "platform staff only") is checked with
 * the fresh token *before* any cookie is written, so a rejected account never
 * holds a session here - its refresh token is revoked straight away.
 */
export async function signIn(
  store: SessionStore,
  client: BackendClient,
  credentials: LoginRequest,
  allow?: (user: UserResponse) => boolean,
): Promise<AuthResponse> {
  const auth = await client.auth.login(credentials);
  if (allow) {
    const me = await createBackendClient({ baseUrl: backendBaseUrl(), accessToken: auth.accessToken }).users.me();
    if (!allow(me)) {
      await client.auth.logout({ refreshToken: auth.refreshToken }).catch(() => {});
      throw new SignInNotAllowedError();
    }
  }
  await store.setSession(sessionFromAuth(auth));
  return auth;
}

/**
 * Best-effort server-side revoke (so the refresh token can't be replayed even
 * if the cookie leaks), then always clear the local session - a backend
 * failure must never block the sign-out the user asked for.
 */
export async function signOut(store: SessionStore, client: BackendClient) {
  const session = await store.getSession();
  if (session) {
    try {
      await client.auth.logout({ refreshToken: session.refreshToken });
    } catch {
      // ignore - local session is cleared regardless
    }
  }
  await store.clearSession();
}
