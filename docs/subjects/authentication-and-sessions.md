# Authentication & Sessions

## What the backend gives us

The `napayment` backend issues a short-lived (15 min, `AUTH_JWT_EXPIRY_MINUTES`)
HS256 access token on signup/login, **plus** a long-lived (30 days,
`AUTH_JWT_REFRESH_EXPIRY_DAYS`), rotating, server-revocable refresh token
(`AuthResponse { accessToken, refreshToken, tokenType, expiresInSeconds,
userId, businessId }`) — `RefreshTokenService` is Redis-backed, single-use
(every `POST /auth/refresh` call kills the presented token and issues a new
one), and detects reuse: replaying an already-rotated-out token revokes the
*entire* chain, not just the replayed token, since that pattern is exactly
what a stolen-and-replayed token looks like (OWASP's recommended refresh
rotation). `POST /auth/logout` revokes a refresh token on demand. The
backend also has **no CORS configuration**, which shapes the whole approach
below.

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

## The pattern used here: a cookie-based BFF, with silent refresh

"BFF" = Backend For Frontend. Next.js's Route Handlers act as a thin server
that:

1. Receives a login/signup request from the browser (same-origin — no CORS
   issue).
2. Calls the real Java backend **server-to-server** (`fetch` from Node, not
   the browser — no CORS involved either, since CORS is a browser
   enforcement mechanism).
3. Takes the access + refresh tokens out of the backend's response and sets
   them together as one **httpOnly, Secure, SameSite=Lax** cookie — neither
   ever returned to client JS.
4. On every subsequent request, reads that cookie server-side and attaches
   `Authorization: Bearer <accessToken>` when calling the backend.
5. **Before the access token expires**, `middleware.ts` silently exchanges
   the refresh token for a new pair and rewrites the cookie — the user is
   never forced back to `/login` just because 15 minutes passed.

The browser never sees either token. It just has an opaque, JS-inaccessible
session cookie that the browser sends automatically, and that cookie quietly
renews itself in the background for up to 30 days of inactivity-free use.

## How it's implemented

- **`apps/web/src/server/session.ts`** — `getSession()` / `setSession()` /
  `clearSession()`. The cookie (`napayment_session`, `SESSION_COOKIE_NAME`)
  holds `{ accessToken, refreshToken, userId, businessId, accessTokenExpiresAt }`.
  Two different lifetimes live in this one cookie on purpose: the cookie's
  own browser-side expiry tracks the **refresh** token's 30-day lifetime
  (`REFRESH_TOKEN_LIFETIME_DAYS`, must stay in sync with the backend's
  `AUTH_JWT_REFRESH_EXPIRY_DAYS`), while `accessTokenExpiresAt` tracks the
  much shorter-lived access token *inside* it. `getSession()` deliberately
  does **not** re-check `accessTokenExpiresAt` itself and does not call
  `/auth/refresh` — see the next section for why. This is a plain JSON
  cookie, not signed/encrypted — acceptable given httpOnly + Secure +
  SameSite bound the risk for now, but flagged in the file's own comment as
  something a production deployment should harden (e.g. with
  [`iron-session`](https://github.com/vvo/iron-session)).
- **`apps/web/src/middleware.ts` — where the actual refresh happens.** This
  is the *only* place that calls `POST /auth/refresh`, and it has to be:
  Next.js only allows writing cookies from a Route Handler, a Server Action,
  or middleware — **never from a plain Server Component render**. A Server
  Component that noticed its access token was stale would have no way to
  fix it even if it wanted to. So middleware runs on every matched request
  (see its `matcher` — deliberately wider than just the protected pages, it
  also covers every `/api/**` Route Handler, since a client-side fetch
  mid-session needs the same silent renewal a page navigation gets), and:
  - If the access token has less than 2 minutes left (`REFRESH_BUFFER_MS`),
    it calls the backend, gets a **new** access+refresh pair (the old
    refresh token is now dead — single-use rotation), and writes the
    rotated cookie onto both the outgoing response (so the browser gets the
    new cookie) *and* the incoming request object (so the Server Component
    this same middleware pass is about to let through sees the fresh token
    too, not the stale one it started with).
  - If the refresh call itself fails (expired/revoked/already-rotated
    refresh token, or a network error), the session is treated as fully
    logged out: cookie cleared, redirected to `/login` for a protected page.
  - Duplicates `SESSION_COOKIE_NAME` and `REFRESH_TOKEN_LIFETIME_DAYS` as
    local constants rather than importing them from `session.ts` — that
    file pulls in `next/headers` (`"server-only"`), which isn't meant for
    the Edge runtime middleware executes in. Keep the two in sync by hand.
- **`apps/web/src/server/backend-client.ts`** — `publicBackendClient()` (no
  token, for signup/login/refresh/logout/forgot-password) and
  `authedBackendClient()` (reads the session cookie, throws
  `"UNAUTHENTICATED"` if there isn't one). Every Route Handler that needs to
  call the backend as the signed-in user goes through this.
- **Route Handlers doing the actual login/signup/logout**:
  `app/api/auth/{signup,login,accept-invite}/route.ts` each call the
  backend, then `setSession(...)` with the fresh access+refresh pair.
  `app/api/auth/logout/route.ts` calls the backend's real
  `POST /auth/logout` (revoking the refresh token server-side, best-effort —
  a failure there never blocks the local sign-out the user asked for)
  *before* clearing the local cookie.

## Why the refresh logic isn't in `getSession()` or a 401-retry interceptor

Two designs were available and rejected in favor of the middleware approach:

1. **Reactive (retry-on-401)**: call the backend, get a 401, refresh, retry
   the original call. Simpler to reason about locally, but doubles latency
   on every access-token expiry and still can't write the rotated cookie
   from deep inside a Server Component's render for the reason above.
2. **Refresh inside `getSession()`**: would need to be called from every
   Server Component *and* write cookies from contexts that can't.

Proactive refresh in middleware, ahead of the access token's actual expiry,
sidesteps both problems: by the time any Server Component or Route Handler
calls `getSession()`, middleware has already run and the token is fresh.

## What this means day-to-day

- **Any Server Component or Route Handler** can call `getSession()` or
  `authedBackendClient()` directly and trust the access token is valid — no
  token plumbing, no expiry checking, no refresh calls of their own.
- **Client Components never touch either token.** They call this app's own
  `/api/*` routes (via `apps/web/src/lib/api.ts`'s `apiFetch`), which ride
  along on the same-origin cookie automatically.
- **A session now survives up to 30 days of use** without a forced
  re-login, silently renewing itself well before the 15-minute access token
  would otherwise expire. Logging out — or a detected refresh-token reuse
  (a strong signal of theft) — ends it immediately, everywhere that token
  chain was valid.

## Permission-gated endpoints and Server Components

The backend gates many endpoints behind specific permissions the caller's
role may or may not hold (e.g. `business:kyc-manage` is business-owner-only
— an invited teammate's role template never includes it), and some also
`404` for a reason that's expected mid-onboarding rather than a real error
(e.g. no webhook config exists until an API key does). A Server Component
that calls such an endpoint directly can get an error status it doesn't
expect, and an **uncaught** one there crashes the whole page render (this
happened for real, twice — see `nawill-pay-frontend.md` doc F9's entries on
it). `apps/web/src/server/safe-call.ts` wraps any such call so specific,
expected status codes degrade to `undefined` instead of crashing — see
[`security.md`](./security.md) for more on the permission model itself.

## Further reading

- [MDN: HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) (see the `HttpOnly`, `Secure`, `SameSite` attributes)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) (see the refresh-token rotation section specifically)
- [JWT introduction](https://jwt.io/introduction)
- [Next.js: Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) (the "Using Cookies" section covers the exact request+response cookie-mutation pattern used here)
- `nawill-pay-frontend.md` doc F2 ADR-FE-2 (the full ADR behind this decision) and doc F5 (security posture)
