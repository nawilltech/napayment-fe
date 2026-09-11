# API Integration & the Backend Proxy

## The three layers

```
Browser (Client Component)
   │  fetch("/api/transactions?...")         same-origin, cookie rides along automatically
   ▼
Next.js Route Handler (apps/web/src/app/api/**/route.ts)
   │  authedBackendClient() → client.transactions.list(...)
   ▼
packages/api-client (createBackendClient)
   │  fetch(`${NAWILL_API_BASE_URL}/api/v1/transactions?...`, { headers: { Authorization: `Bearer ...` } })
   ▼
napayment Java backend
```

Three distinct pieces, each with one job:

1. **`packages/api-client`** — a typed, framework-agnostic fetch wrapper.
   Knows the shape of every backend endpoint. Has no Next.js import, no
   React import — it runs identically in a Route Handler today and, when
   the mobile app is built out, directly from React Native (mobile calls
   the backend directly, no BFF needed there since there's no browser CORS
   concern on a native app).
2. **Next.js Route Handlers** (`apps/web/src/app/api/**/route.ts`) — the
   BFF. Reads the session cookie, constructs an authenticated `api-client`
   instance, calls it, returns the result as JSON. This is also where
   request bodies get validated (`parseBody`, see
   [`forms-and-validation.md`](./forms-and-validation.md)).
3. **`apps/web/src/lib/api.ts`** — the browser-side fetch helper Client
   Components use to call *this app's own* `/api/*` routes (never the Java
   backend directly). Throws a typed `ClientApiError` on a non-2xx
   response, which every `hooks/use-*.ts` mutation's `onError` catches to
   show a toast.

## Why go through this app's own `/api/*` layer at all, instead of calling `packages/api-client` directly from a Client Component

Because the JWT lives in an httpOnly cookie (see
[`authentication-and-sessions.md`](./authentication-and-sessions.md)),
browser JS has no token to attach to a direct backend call even if CORS
allowed it. The Route Handler is the only place that *can* construct an
authenticated request, since it's the only place that can read the cookie.

## `packages/api-client` in detail

- **`src/types.ts`** — every request/response interface and enum, hand-
  transcribed from the backend's actual Java DTOs (not guessed, not from a
  spec doc — read directly from the controller/record source). This file's
  own header comment explains it's a deliberate stopgap: once the backend's
  CORS gap closes and a codegen step against its live OpenAPI document
  (`springdoc-openapi`, already wired backend-side) is set up, that
  generated schema becomes the source of truth instead. Until then, **if
  you change a backend DTO, update this file to match** — nothing enforces
  the two staying in sync automatically today.
- **`src/http.ts`** — the low-level `apiRequest()` function. Handles JSON
  bodies, `FormData` bodies (file upload — passed through untouched so
  `fetch` can set its own multipart boundary), and `apiRequestBinary()` for
  streaming a file download through without buffering it.
- **`src/client.ts`** — `createBackendClient(config)` returns one object
  grouped by resource: `client.auth.*`, `client.users.*`, `client.business.*`,
  `client.kyc.*`, `client.team.*`, `client.apiKeys.*`, `client.transactions.*`,
  etc. — one function per real backend endpoint. This is what both
  `publicBackendClient()` and `authedBackendClient()`
  (`apps/web/src/server/backend-client.ts`) return.

## Adding a new endpoint — the checklist

1. Add the request/response types to `packages/api-client/src/types.ts`,
   matching the backend's actual DTO field-for-field.
2. Add the function to the right resource group in
   `packages/api-client/src/client.ts`.
3. Add a Route Handler under `apps/web/src/app/api/**/route.ts` that calls
   it via `authedBackendClient()` (or `publicBackendClient()` for an
   unauthenticated endpoint), validating the request body with a Zod schema
   from `packages/schemas` if it's a mutation.
4. If the endpoint has a permission requirement not every role holds, check
   whether it'll be called from a Server Component — if so, wrap it in
   `safeCall()` (see [`security.md`](./security.md)).
5. Add a `hooks/use-*.ts` hook (a `useQuery`/`useMutation` pair) for any
   Client Component that needs it.
6. Update `docs/nawill-pay-frontend.md` doc F6 with the new endpoint —
   that document is the canonical API reference until the codegen step
   exists.

## Money values

Every amount from the backend is a minor-unit integer (kobo) serialized as a
string (`BigInteger`/`BigDecimal` in Java don't round-trip safely as a JS
`number` past `Number.MAX_SAFE_INTEGER`). `apps/web/src/lib/utils.ts`'s
`formatNaira()` is the one place that divides by 100 and formats as
currency — never do that math inline in a component.

## Further reading

- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
- [MDN: FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- `nawill-pay-frontend.md` doc F4 ("API client & type generation") and doc F6 (the full current endpoint reference)
