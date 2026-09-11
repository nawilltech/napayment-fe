# Security

This is a payments product — security decisions here aren't abstract best
practice, they map to specific threats. This page covers what the frontend
is responsible for; see `nawill-pay-frontend.md` doc F5 for the full
security-posture writeup and doc 3 of the backend spec for the backend's own
half of this.

## Session handling (XSS containment)

Covered in full in [`authentication-and-sessions.md`](./authentication-and-sessions.md).
The short version: the backend's JWT is set as an httpOnly cookie by a
Next.js Route Handler and never touches browser-readable storage
(`localStorage`, a JS-readable cookie). A successful XSS attack can't
exfiltrate the session token, because there's no JS-accessible copy of it to
steal.

## The permission model, and why a Server Component can crash on it

The backend gates endpoints behind fine-grained permission strings (e.g.
`business:kyc-manage`, `transactions:read`) checked against the caller's
role. A business owner has broad access; an invited teammate's role
(`ADMIN`/`DEVELOPER`/`ACCOUNT_OFFICER` — see
`packages/schemas/src/onboarding.ts`'s `ROLE_TEMPLATE_META`) has a narrower,
fixed permission set that **never** includes `business:kyc-manage` — that's
intentionally owner-only.

This is correct backend behavior, but it means any frontend code calling
such an endpoint must expect a `403` from a legitimately-authenticated,
just-not-permitted user — this isn't an error condition to alarm on, it's an
expected response your code has to handle. A real incident from exactly this:
`computeOnboardingStatus()` called several owner-gated endpoints unguarded
inside a Server Component; an invited teammate's `403` was an uncaught
exception there, which crashed the whole page (a Server Component render has
no per-query error boundary the way a client-side TanStack Query hook
does). Fixed by `apps/web/src/server/safe-call.ts`, which catches a
`401`/`403` and returns `undefined` instead of throwing — re-throwing
anything else, since a `5xx` or network failure *is* worth surfacing, not
silently swallowing.

**The rule going forward: any Server Component calling an endpoint that
isn't guaranteed available to every authenticated user must go through
`safeCall()`.** This is a pattern to repeat, documented in
`nawill-pay-frontend.md` doc F9.

## Secrets never persist client-side beyond one render

A business's API secret key (`sk_live_…`, from `POST /api-keys` or
`/api-keys/regenerate`) is shown exactly once, per the backend's own design
— it's never returned again after that response. `components/onboarding/api-keys-form.tsx`
holds it only in transient `useState`, explicitly **not** in the TanStack
Query cache (which persists across the session) and never in
`localStorage`. Once the user closes the reveal dialog, it's gone from
memory — the UI has no way to show it again, matching the backend's own
one-time-display guarantee.

## CSRF

Because auth is cookie-based (not a bearer token the client attaches
manually), this app is exposed to CSRF in a way a bearer-token API wouldn't
be. Two mitigations:

- The session cookie is `SameSite=Lax` — a cross-site `<form>` POST or a
  malicious `<img>`/fetch from another origin doesn't carry it.
- `Secure` is set in production, so the cookie is never sent over plain
  HTTP.

There's no additional CSRF-token mechanism beyond `SameSite=Lax` today —
worth revisiting (an `Origin` header check on mutating Route Handlers) before
this goes to production, per `nawill-pay-frontend.md` doc F5.

## Input validation happens twice, on purpose

Every form's Zod schema (see
[`forms-and-validation.md`](./forms-and-validation.md)) validates
client-side for fast feedback *and* server-side (`parseBody()` in every
Route Handler) as the actual trust boundary. A Route Handler can be hit
directly, bypassing the form UI — server-side validation is what actually
protects the backend from malformed input, the client-side copy is a UX
convenience layered on top.

## File uploads (KYC documents)

`POST /api/onboarding/kyc/documents` forwards a `multipart/form-data` body
straight through to the backend (`apps/web/src/app/api/onboarding/kyc/documents/route.ts`)
without buffering or re-parsing the file — the backend enforces the 10MB
size limit and content-type restrictions itself. Downloads
(`GET .../{id}/download`) are similarly streamed through, never cached or
written to disk by the Next.js layer, and the backend itself
ownership-checks every download (never a public URL).

## What the frontend does *not* do

- **No HMAC signing.** The backend's third-party `/collect`/`/withdraw`
  surface (doc 3 §2.5 of the backend spec) is HMAC-signed, server-to-server
  auth for a *business's own backend* integrating with Nawill Pay — not
  something the Console UI itself ever does. The Console only manages the
  key pair; it never signs a request.
- **No client-side rate limiting** — that's the backend's job
  (`RateLimitService`, doc 3 §2.4).
- **No encryption-at-rest concerns** — this app holds no persistent
  storage of sensitive data itself; everything sensitive lives in the
  backend's database, accessed per-request through the BFF.

## Further reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cross-Site Request Forgery (CSRF) Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value)
- `nawill-pay-frontend.md` doc F5 (frontend security & offline resilience) and doc 3 of the backend spec (the backend's own security deep-dive)
