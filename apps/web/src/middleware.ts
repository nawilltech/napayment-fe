import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps `Session.accessToken` fresh (NFR-7). This is the one place that
 * actually calls `POST /auth/refresh`, and it has to be here rather than in
 * a Server Component or `getSession()`: Next.js only allows writing cookies
 * from a Route Handler, a Server Action, or middleware - never from a plain
 * Server Component render. Running on every matched request (see `matcher`
 * below, deliberately wider than just the protected page routes - it also
 * covers every `/api/**` Route Handler, since a client-side fetch mid-
 * session needs the same silent renewal a page navigation gets) means the
 * access token is rotated here, before it ever reaches `getSession()`
 * downstream, which is why that function doesn't re-check expiry itself.
 *
 * Must stay in sync with apps/web/src/server/session.ts's `Session` shape
 * and `SESSION_COOKIE_NAME` - duplicated here rather than imported, since
 * session.ts pulls in `next/headers` (`"server-only"`), which isn't meant
 * for the Edge middleware runtime this file executes in.
 */

const SESSION_COOKIE_NAME = "napayment_session";
const REFRESH_TOKEN_LIFETIME_DAYS = 30; // must match session.ts's own constant
const REFRESH_BUFFER_MS = 2 * 60 * 1000; // rotate once the access token has <2 min left

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];
const AUTH_ONLY_PREFIXES = ["/login", "/signup"];

interface SessionCookie {
  accessToken: string;
  refreshToken: string;
  userId: string;
  businessId: string;
  accessTokenExpiresAt: number;
}

function readSession(raw: string | undefined): SessionCookie | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionCookie;
  } catch {
    return null;
  }
}

async function refreshSession(refreshToken: string): Promise<SessionCookie | null> {
  const baseUrl = process.env.NAWILL_API_BASE_URL;
  if (!baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null; // invalid / expired / already-rotated / revoked (reuse detected)
    const auth = await res.json();
    return {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      userId: auth.userId,
      businessId: auth.businessId,
      accessTokenExpiresAt: Date.now() + auth.expiresInSeconds * 1000,
    };
  } catch {
    return null; // network failure - fail closed to a re-login rather than proceed on a stale token
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let session = readSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  let rotatedCookieValue: string | null = null;
  let sessionInvalidated = false;

  if (session && session.accessTokenExpiresAt - Date.now() < REFRESH_BUFFER_MS) {
    const refreshed = await refreshSession(session.refreshToken);
    if (refreshed) {
      session = refreshed;
      rotatedCookieValue = JSON.stringify(refreshed);
      // Forward the rotated token to the request this same middleware pass
      // is about to let through, so the Server Component/Route Handler it
      // reaches doesn't see the stale one.
      request.cookies.set(SESSION_COOKIE_NAME, rotatedCookieValue);
    } else {
      session = null;
      sessionInvalidated = true;
    }
  }

  const authed = Boolean(session);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(url);
    if (sessionInvalidated) redirectResponse.cookies.delete(SESSION_COOKIE_NAME);
    return redirectResponse;
  }

  if (AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request });
  if (rotatedCookieValue) {
    response.cookies.set(SESSION_COOKIE_NAME, rotatedCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_TOKEN_LIFETIME_DAYS * 24 * 60 * 60,
    });
  } else if (sessionInvalidated) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/signup", "/api/:path*"],
};
