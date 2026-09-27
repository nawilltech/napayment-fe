import { createSessionMiddleware } from "@napayment/bff/middleware";
import { SESSION_COOKIE_NAME } from "@/session-config";

export const middleware = createSessionMiddleware({
  cookieName: SESSION_COOKIE_NAME,
  protectedPrefixes: ["/overview", "/kyc", "/businesses", "/transactions", "/audit-logs", "/processors", "/collection-account", "/settings"],
  authOnlyPrefixes: ["/login"],
  loginPath: "/login",
  homePath: "/overview",
});

export const config = {
  matcher: [
    "/overview/:path*",
    "/kyc/:path*",
    "/businesses/:path*",
    "/transactions/:path*",
    "/audit-logs/:path*",
    "/processors/:path*",
    "/collection-account/:path*",
    "/settings/:path*",
    "/login",
    "/api/:path*",
  ],
};
