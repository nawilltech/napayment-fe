# Authentication & Sessions

## What the backend gives us

The `napayment` backend issues a short-lived (10–15 min) HS256 JWT on
signup/login (`AuthResponse { accessToken, tokenType, expiresInSeconds,
userId, businessId }`). There's no refresh-token endpoint yet — when the
token expires, the user has to log in again. The backend also has **no CORS
configuration**, which shapes the whole approach below.

## Why not just store the JWT in the browser

The obvious approach — save `accessToken` to `localStorage` or a JS-readable
cookie, attach it as `Authorization: Bearer <token>` from the browser — was
rejected for two concrete reasons:

1. **XSS blast radius.** Anything JS can read, a successful XSS attack can
   read too. A token in `localStorage` is a full account-takeover primitive
   for its entire lifetime. This isn't hypothetical caution — it's the same
   reasoning the backend's own security doc uses for keeping the access
   token short-lived in the first place.
2. **CORS.** The backend doesn't accept cross-origin requests today.
   A browser calling it directly would just fail.

## The pattern used here: a cookie-based BFF

"BFF" = Backend For Frontend. Next.js's Route Handlers act as a thin server
that:

1. Receives a login/signup request from the browser (same-origin — no CORS
   issue).
2. Calls the real Java backend **server-to-server** (`fetch` from Node, not
   the browser — no CORS involved either, since CORS is a browser
   enforcement mechanism).
3. Takes the JWT out of the backend's response and sets it as an **httpOnly,
   Secure, SameSite=Lax** cookie — never returned to client JS.
4. On every subsequent request, reads that cookie server-side and attaches
   `Authorization: Bearer <token>` when calling the backend.

The browser never sees the JWT. It just has an opaque, JS-inaccessible
session cookie that the browser sends automatically.

## How it's implemented

- **`apps/web/src/server/session.ts`** — `getSession()` / `setSession()` /
  `clearSession()`. The cookie (`napayment_session`) holds a small JSON blob:
  `{ accessToken, userId, businessId, expiresAt }`. This is a plain JSON
  cookie, not signed/encrypted — acceptable given httpOnly + Secure +
  SameSite bound the risk for now, but flagged in the file's own comment as
  something a production deployment should harden (e.g. with
  [`iron-session`](https://github.com/vvo/iron-session)) since a leaked
  cookie value could otherwise be read if it ever escaped the httpOnly
  boundary.
- **`apps/web/src/server/backend-client.ts`** — `publicBackendClient()` (no
  token, for signup/login/forgot-password) and `authedBackendClient()`
  (reads the session cookie, throws `"UNAUTHENTICATED"` if there isn't one).
  Every Route Handler that needs to call the backend as the signed-in user
  goes through this.
- **Route Handlers doing the actual login/signup**:
  `app/api/auth/{signup,login,accept-invite}/route.ts` — each calls the
  backend, then `setSession(...)`.
- **`apps/web/src/middleware.ts`** — reads the cookie (can't call
  `getSession()` directly in Edge middleware, so it does a lightweight
  inline check) and redirects: no session + visiting `/dashboard` or
  `/onboarding` → `/login`; has a session + visiting `/login` or `/signup`
  → `/dashboard`.
- **Logout**: `app/api/auth/logout/route.ts` just clears the cookie.

## What this means day-to-day

- **Any Server Component or Route Handler** can call `getSession()` or
  `authedBackendClient()` directly — no token plumbing needed.
- **Client Components never touch the token.** They call this app's own
  `/api/*` routes (via `apps/web/src/lib/api.ts`'s `apiFetch`), which ride
  along on the same-origin cookie automatically — no `Authorization` header
  to manage client-side at all.
- **A session expires in lockstep with the backend's JWT** (10–15 min). On a
  401 from the backend, the Route Handler surfaces that as a 401 to the
  client, and the relevant hook's `onError` (or the next protected-route
  visit, via middleware) sends the user back to `/login`.

## Permission-gated endpoints and Server Components

The backend gates many endpoints behind specific permissions the caller's
role may or may not hold (e.g. `business:kyc-manage` is business-owner-only
— an invited teammate's role template never includes it). A Server Component
that calls such an endpoint directly can get a `403`, and an **uncaught**
error there crashes the whole page render (this happened for real — see
`nawill-pay-frontend.md` doc F9's "Invited-teammate 403s crashing Server
Components" entry). `apps/web/src/server/safe-call.ts` wraps any such call
so a `401`/`403` degrades to `undefined` instead of crashing — see
[`security.md`](./security.md) for more on the permission model itself.

## Further reading

- [MDN: HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) (see the `HttpOnly`, `Secure`, `SameSite` attributes)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [JWT introduction](https://jwt.io/introduction)
- [Next.js: cookies() API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- `nawill-pay-frontend.md` doc F2 ADR-FE-2 (the full ADR behind this decision) and doc F5 (security posture)
