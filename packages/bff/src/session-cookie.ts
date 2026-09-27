import type { AuthResponse } from "@napayment/api-client";

/**
 * The session cookie's shape and lifecycle, shared by every Next.js app in
 * this repo (apps/web, apps/admin). Edge-safe on purpose - no next/headers -
 * because middleware (Edge runtime) imports it too.
 *
 * The backend's JWT never reaches the browser as JS-readable state (doc F2
 * ADR-FE-2): it lives in an httpOnly cookie set by the app's own server code.
 * Two lifetimes live in one cookie: the access token is short-lived (15 min)
 * and silently rotated by middleware; the refresh token (single-use,
 * rotating, NFR-7) is what the cookie's own expiry tracks.
 *
 * Flagged for production: the cookie is plain JSON, not signed/encrypted
 * (httpOnly + Secure + SameSite=Lax bound the risk; use e.g. iron-session).
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
  /** Null for individual and platform-staff accounts - see account.ts. */
  businessId: string | null;
  /** When the *access* token itself expires (epoch ms) - not the cookie's lifetime. */
  accessTokenExpiresAt: number;
}

/** Must match the backend's AUTH_JWT_REFRESH_EXPIRY_DAYS (default 30). */
export const REFRESH_TOKEN_LIFETIME_DAYS = 30;

/** Rotate once the access token has less than this left. */
export const REFRESH_BUFFER_MS = 2 * 60 * 1000;

export const REQUEST_ID_HEADER = "x-request-id";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60,
  };
}

export function sessionFromAuth(auth: AuthResponse): Session {
  return {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    userId: auth.userId,
    businessId: auth.businessId,
    accessTokenExpiresAt: Date.now() + auth.expiresInSeconds * 1000,
  };
}

export function parseSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function backendBaseUrl(): string {
  const url = process.env.NAWILL_API_BASE_URL;
  if (!url) {
    throw new Error(
      "NAWILL_API_BASE_URL is not set - see .env.example. The Java backend must be reachable server-side.",
    );
  }
  return url;
}

/**
 * Rotates the refresh token (POST /auth/refresh). Null means "sign in again":
 * invalid, expired, already rotated, revoked (reuse detected) - or a network
 * failure, which fails closed rather than proceeding on a stale token.
 */
export async function refreshSession(refreshToken: string): Promise<Session | null> {
  try {
    const res = await fetch(`${backendBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    return res.ok ? sessionFromAuth((await res.json()) as AuthResponse) : null;
  } catch {
    return null;
  }
}
