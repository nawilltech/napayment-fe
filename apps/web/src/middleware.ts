import { createSessionMiddleware } from "@napayment/bff/middleware";
import { SESSION_COOKIE_NAME } from "@/session-config";

export const middleware = createSessionMiddleware({
  cookieName: SESSION_COOKIE_NAME,
  protectedPrefixes: ["/dashboard", "/onboarding", "/admin-account"],
  authOnlyPrefixes: ["/login", "/signup"],
  loginPath: "/login",
  homePath: "/dashboard",
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin-account", "/login", "/signup", "/api/:path*"],
};
