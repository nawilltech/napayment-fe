import "server-only";
import { cookies } from "next/headers";

/**
 * Session cookie (doc F2 ADR-FE-2): the backend's JWT never reaches the
 * browser as JS-readable state. It's set here as an httpOnly cookie by our
 * own Route Handlers (src/app/api/auth/*) right after a real backend
 * login/signup call, and read back server-side (Server Components, Route
 * Handlers) to attach `Authorization: Bearer <token>` on the backend proxy.
 *
 * Simplification flagged for production: this cookie is a plain JSON blob,
 * not signed/encrypted (httpOnly + Secure + SameSite=Lax bound the risk for
 * a scaffold, but a production deployment should use a signed/encrypted
 * session, e.g. `iron-session`, so a leaked cookie value can't be inspected
 * or tampered with even if it somehow escapes the httpOnly boundary).
 */
export interface Session {
  accessToken: string;
  userId: string;
  businessId: string;
  expiresAt: number; // epoch ms
}

const COOKIE_NAME = "napayment_session";

export async function setSession(session: Session) {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
