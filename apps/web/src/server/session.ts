import "server-only";
import { cookies } from "next/headers";

/**
 * Session cookie (doc F2 ADR-FE-2): the backend's JWT never reaches the
 * browser as JS-readable state. It's set here as an httpOnly cookie by our
 * own Route Handlers (src/app/api/auth/*) right after a real backend
 * login/signup/refresh call, and read back server-side (Server Components,
 * Route Handlers) to attach `Authorization: Bearer <token>` on the backend
 * proxy.
 *
 * Two different lifetimes live in one cookie, on purpose: `accessToken`
 * itself is short-lived (15 min, `nawill.auth.jwt.expiry-minutes`
 * backend-side) and gets silently rotated by `middleware.ts` well before it
 * expires; `refreshToken` is the backend's real, revocable, single-use-
 * rotating credential (NFR-7, 30 days, `RefreshTokenService`) that makes
 * that rotation possible without forcing a re-login. The cookie's own
 * browser-side expiry tracks the refresh token's lifetime, not the access
 * token's - `REFRESH_TOKEN_LIFETIME_DAYS` below must stay in sync with the
 * backend's `AUTH_JWT_REFRESH_EXPIRY_DAYS` (default 30) or the cookie will
 * outlive (or die before) the token it's meant to carry.
 *
 * Simplification flagged for production: this cookie is a plain JSON blob,
 * not signed/encrypted (httpOnly + Secure + SameSite=Lax bound the risk for
 * a scaffold, but a production deployment should use a signed/encrypted
 * session, e.g. `iron-session`, so a leaked cookie value can't be inspected
 * or tampered with even if it somehow escapes the httpOnly boundary).
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
  businessId: string;
  /** When the *access* token itself expires (epoch ms) - not the session/cookie's own lifetime. */
  accessTokenExpiresAt: number;
}

export const SESSION_COOKIE_NAME = "napayment_session";

/** Must match the backend's AUTH_JWT_REFRESH_EXPIRY_DAYS default (app/src/main/resources/application.yml). */
export const REFRESH_TOKEN_LIFETIME_DAYS = 30;

export async function setSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60,
  });
}

/**
 * Returns the session as-is, including a possibly-expired access token.
 * `middleware.ts` is what keeps `accessToken` fresh (it runs before this on
 * every matched request) - this function does not itself call `/auth/refresh`,
 * since a Server Component can't write the rotated cookie back even if it
 * wanted to (Next.js only allows cookie mutation from Route Handlers/Server
 * Actions/Middleware, never a plain Server Component render).
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
