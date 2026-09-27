import { NextResponse, type NextRequest } from "next/server";
import { parseSession, REFRESH_BUFFER_MS, REQUEST_ID_HEADER, refreshSession, sessionCookieOptions } from "./session-cookie";

export interface SessionMiddlewareOptions {
  cookieName: string;
  /** Need a session - anonymous visitors are sent to loginPath?next=... */
  protectedPrefixes: string[];
  /** Pointless when signed in (login, signup) - signed-in visitors are sent to homePath. */
  authOnlyPrefixes: string[];
  loginPath: string;
  homePath: string;
}

/**
 * Every matched request (NFR-7):
 * - stamps an X-Request-Id (kept if a CDN/LB already set one) on the request
 *   and the response, for log correlation with the backend;
 * - rotates the access token once it's within REFRESH_BUFFER_MS of expiry.
 *   It has to happen here: only middleware, Route Handlers and Server Actions
 *   may write cookies, never a Server Component render;
 * - enforces the protected / auth-only route prefixes.
 */
export function createSessionMiddleware(options: SessionMiddlewareOptions) {
  const { cookieName } = options;

  return async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestId = request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set(REQUEST_ID_HEADER, requestId);

    let session = parseSession(request.cookies.get(cookieName)?.value);
    let rotatedCookieValue: string | null = null;
    let sessionInvalidated = false;

    if (session && session.accessTokenExpiresAt - Date.now() < REFRESH_BUFFER_MS) {
      const refreshed = await refreshSession(session.refreshToken);
      if (refreshed) {
        session = refreshed;
        rotatedCookieValue = JSON.stringify(refreshed);
        // Let this same request see the rotated token, not the stale one.
        request.cookies.set(cookieName, rotatedCookieValue);
      } else {
        session = null;
        sessionInvalidated = true;
      }
    }

    const redirect = (pathnameTo: string, search?: Record<string, string>) => {
      const url = request.nextUrl.clone();
      url.pathname = pathnameTo;
      url.search = new URLSearchParams(search).toString();
      const response = NextResponse.redirect(url);
      response.headers.set(REQUEST_ID_HEADER, requestId);
      if (sessionInvalidated) response.cookies.delete(cookieName);
      return response;
    };

    if (!session && options.protectedPrefixes.some((p) => pathname.startsWith(p))) {
      return redirect(options.loginPath, { next: pathname });
    }
    if (session && options.authOnlyPrefixes.some((p) => pathname.startsWith(p))) {
      return redirect(options.homePath);
    }

    const response = NextResponse.next({ request: { headers: forwardedHeaders } });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    if (rotatedCookieValue) response.cookies.set(cookieName, rotatedCookieValue, sessionCookieOptions());
    else if (sessionInvalidated) response.cookies.delete(cookieName);
    return response;
  };
}
