import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "napayment_session";
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];
const AUTH_ONLY_PREFIXES = ["/login", "/signup"];

function hasValidSession(request: NextRequest): boolean {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return false;
  try {
    const session = JSON.parse(raw) as { expiresAt: number };
    return session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasValidSession(request);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/signup"],
};
