# NAWILL PAY — FRONTEND

## Web & Mobile Engineering Handbook

*Framework decision, architecture, state management, API integration, screen inventory, and roadmap for the two client surfaces built against the `napayment` backend.*

Version 0.2 (Framework selection + architecture, plus the Business Console's onboarding surface — signup through KYC, team invites, API keys/webhooks — implemented against it)

Prepared by: Nawill Technology Ltd — Engineering
Date: September 2026

**Implementation status (added post-v0.1 of this document):** the Business Console's full onboarding flow — business/individual signup, KYC document upload, team invites, API key + IP whitelist + webhook config, and the corresponding Settings tabs — is built in `apps/web` per this handbook's own architecture (Chapters F2/F4/F8). The Consumer Wallet App (`apps/mobile`) is scaffolded only, per doc F10. Every screen backed by a real backend endpoint calls it through the BFF proxy (doc F2 ADR-FE-2); every screen backed by a gap in doc F9 is served by `apps/web/src/server/dev-store.ts`, a JSON-file dev stand-in, clearly marked `TODO(FE-Gap, doc F9)` at each call site with a suggested contract — see `docs/api-contracts/` for copy-pasteable request/response JSON per gap.

---

This document is the frontend counterpart to the backend's `docs/nawill-pay.md` master specification. Citation scheme: **doc F-N** refers to a chapter here; a bare **doc N** (no `F`) refers to the corresponding chapter in the backend spec (e.g. `doc 3 §2.5` is the backend's HMAC auth flow). Requirement IDs (`FR-x`, `NFR-x`) are the backend's own and are reused verbatim rather than renumbered, since the frontend exists to serve them, not redefine them.

## Table of Contents

- **[Chapter F1 — Scope & Product Surfaces](#chapter-f1--scope--product-surfaces)**
- **[Chapter F2 — Web Framework Decision](#chapter-f2--web-framework-decision)**
- **[Chapter F3 — Mobile Framework Decision](#chapter-f3--mobile-framework-decision)**
- **[Chapter F4 — State Management & Data Layer](#chapter-f4--state-management--data-layer)**
- **[Chapter F5 — Security & Offline Resilience](#chapter-f5--security--offline-resilience)**
- **[Chapter F6 — API Surface Reference](#chapter-f6--api-surface-reference)**
- **[Chapter F7 — Screen Inventory & Process Flows](#chapter-f7--screen-inventory--process-flows)**
- **[Chapter F8 — Repository Layout, Naming & Design Tokens](#chapter-f8--repository-layout-naming--design-tokens)**
- **[Chapter F9 — Backend Gaps the Frontend Will Need](#chapter-f9--backend-gaps-the-frontend-will-need)**
- **[Chapter F10 — Roadmap](#chapter-f10--roadmap)**

---

## Chapter F1 — Scope & Product Surfaces

The backend's actor model (doc 1 §2) splits cleanly into two client surfaces with almost no UI overlap. Building them as one universal app would force the dashboard's information-dense data-grid UX and the wallet app's single-thumb consumer UX into the same component system for no benefit — so this handbook treats them as two products sharing one backend and one internal package layer (doc F8).

### 1. Business Console (web)

Serves `BUSINESS` owners, their `ADMIN`/staff users, and `SUPERADMIN`. This is the Paystack-shaped dashboard: settlement configuration, API keys, payment links, team/RBAC, transaction history, admin analytics. The screenshots captured in `assets/reference-screenshots/` (real Paystack dashboard — `dashboard.paystack.com`) are **UX reference only**, used to inform information architecture (sidebar grouping, tabbed settings, data-table density, status-pill conventions) — not a design to copy verbatim. Nawill Pay's own visual identity (doc F8 §Design Tokens) replaces Paystack's orange/dark-navy theme entirely.

### 2. Consumer Wallet App (mobile)

Serves individual `USER` actors per FR-Auth-1 — "onboard and authenticate with minimal friction... fund your wallet and transfer money." Virtual account balance, collection history, payment-link sharing, KYC tiers, notifications, security settings. This surface is *ahead of* what the backend currently exposes in one important way: see doc F9 — there is no peer-to-peer "send to another Nawill user" endpoint yet, only collect-into-your-own-account flows (transactions, payment links, dynamic accounts, third-party collect/withdraw). The mobile app's IA is designed for where the backend is going, per the user's direction not to limit scope to what's implemented today; the send/transfer screen ships as soon as doc F9's gap is closed.

### Explicitly out of scope, v0.1 FE

Full offline transaction *execution* (only queuing + optimistic UI, doc F5), card issuing UI, multi-currency UI (schema is currency-ready per doc 1 §1.4 but the UI is NGN-only until a second currency actually ships), agency-banking UI. Mirrors the backend's own MVP scope cuts (doc 1 §1.4).

---

## Chapter F2 — Web Framework Decision

**Decision: Next.js 15 (App Router) + TypeScript, deployed as the Business Console.**

### ADR-FE-1 — Next.js over a plain Vite/CRA SPA or Remix

Rejected alternatives:
- **Vite + React Router SPA** — no SSR means a blank-screen-until-JS-loads first paint, which is a real cost on the uneven Nigerian network conditions the backend is explicitly designed around (NFR-2). Would also require hand-rolling route-level code-splitting and a BFF layer that Next.js's Route Handlers give for free.
- **Remix** — comparable architecture, but Next.js has the larger ecosystem, more African-market hiring pool, and first-class support from the component libraries chosen below (shadcn/ui, TanStack Table/Query).

Rationale: the reference screenshots show a data-table-and-tabbed-settings-heavy SaaS dashboard. Next.js's nested layouts map directly onto that shape — `app/(dashboard)/settings/[tab]/page.tsx` mirrors the Profile/Contact/Accounts/Preferences/Team/API-Keys tab structure seen in the reference captures. React Server Components let read-only screens (transaction list, settlement history) ship near-zero client JS, which matters more here than on a typical SaaS dashboard because of NFR-2.

### ADR-FE-2 — Cookie-based session via Next.js Route Handlers, not JWT in localStorage

The backend issues a short-lived (10–15 min) bearer JWT (doc 3 §2.1) with no refresh-token rotation yet (see doc F9). Storing that token in `localStorage`/a JS-readable cookie gives any successful XSS full account takeover for the token's lifetime. Instead:

- `POST /app/api/auth/login` (a Next.js Route Handler, not the backend path) calls the backend's `POST /api/v1/auth/login`, then sets the returned `accessToken` as an **httpOnly, Secure, SameSite=Lax** cookie.
- Server Components and Route Handlers read the cookie server-side and attach `Authorization: Bearer <token>` when calling the backend; client components never see the raw token.
- This requires a backend change: the backend has **no CORS configuration today** (confirmed absent from `SecurityConfig` and `application.yml`). See doc F9 — either enable CORS scoped to the Console's origin(s), or (preferred, and consistent with doc 2 §3's already-planned API Gateway layer) put both behind one reverse-proxy origin so no cross-origin request ever happens.
- Trade-off accepted: state-changing Route Handlers must independently defend against CSRF (`SameSite=Lax` plus an `Origin`-header check on mutating requests), since cookie auth reintroduces CSRF risk that bearer-in-header auth doesn't have.

### ADR-FE-3 — Tailwind CSS + shadcn/ui (Radix primitives), not MUI/Chakra/Ant

The reference screenshots' density (multi-column data tables, small-footprint status pills, tabbed panels, a persistent icon sidebar) is exactly shadcn/ui's target shape, and because shadcn/ui ships as copy-in source (not an npm-versioned component library), the navy/cream brand (doc F8) can fully replace Paystack's look with no fighting a pre-themed component system's defaults. MUI/Chakra were rejected on that basis — both are heavier to re-skin away from their own visual identity.

### ADR-FE-4 — TanStack Table for every list screen

Every list endpoint the backend exposes already returns the same `PageResponse<T>` envelope (`content`, `page`, `size`, `totalElements`, `totalPages` — doc F6), and most now support a `term` search param (per the backend's "paginate every list endpoint, add term search" commit — though not yet uniformly, see doc F6's pagination-coverage note). One `<DataTable>` wrapper around TanStack Table's server-side-pagination mode, parameterized by columns, drives Transactions, Settlement Accounts, Payment Links, Dynamic Accounts, Team/Roles, API Keys, and the Reference-Data pickers (bank/country selects) — a single component, not one per resource.

---

## Chapter F3 — Mobile Framework Decision

**Decision: React Native via Expo (EAS Build + EAS Update) + TypeScript, for the Consumer Wallet App.**

### ADR-FE-5 — React Native/Expo over Flutter over native (Swift/Kotlin)

Rejected: **Flutter.** Better raw animation/rendering performance, but Dart means zero code-sharing with the TypeScript web app — the API client, Zod validation schemas, offline-mutation-queue logic, and idempotency-key generation (doc F4/F5) would all need a second, parallel implementation. For a small team building a payments product where *correctness and validation-parity with the backend* matter more than bespoke animation (this is a wallet app, not a game), that duplication is a real ongoing cost with no matching benefit. This mirrors the backend's own stated rationale for choosing a modular monolith over microservices at MVP stage (doc 2 §1.1: "keeps operational overhead low for a small team").

Rejected: **Native (Swift + Kotlin, two codebases).** Best possible platform integration, but 2–3x the implementation cost for an MVP with one small team — premature until scale or platform-specific requirements (e.g. deep biometric/secure-enclave work beyond what Expo's modules cover) actually demand it.

Rationale for Expo specifically (over bare React Native): EAS Update ships JS-only bug fixes over the air without an app-store review cycle — meaningful for a financial app where a broken screen needs to be fixable same-day. `expo-secure-store` (iOS Keychain / Android Keystore) and `expo-local-authentication` (biometric app-lock) are maintained, audited modules rather than something to hand-roll.

### ADR-FE-6 — NativeWind, for design-token parity with the web app

Tailwind syntax on React Native. The same `tailwind.config` color/spacing/radius tokens (doc F8) back both the Console and the Wallet App, so "the navy used for a primary button" is defined once and consumed twice, not redefined per platform.

### ADR-FE-7 — Token storage & app-lock

`expo-secure-store` for the access token (Keychain/Keystore-backed, not `AsyncStorage`, which is unencrypted). `expo-local-authentication` gates app foreground-resume behind biometrics/device passcode when enabled in Settings — a sensible default for a wallet app even though the backend has no server-side "device binding" concept yet (nothing here depends on the backend knowing about it).

---

## Chapter F4 — State Management & Data Layer

Four distinct kinds of state, deliberately not collapsed into one library — each library below is chosen because it's the wrong tool for the others' job:

| State kind | Tool | Why |
|---|---|---|
| Server cache (transactions, settlement accounts, balances, ...) | **TanStack Query v5** | Identical API on web and React Native; retry/backoff and mutation pause-resume map directly onto NFR-2 and the backend's idempotency-key contract (doc 3 §1.1) — a paused-then-retried mutation is safe by construction because it replays with the same key. |
| Client-only UI state (wizard step, sidebar collapsed, active tab, modal open) | **Zustand** | No boilerplate versus Redux Toolkit; works unchanged in React Native. Never used for anything the backend also has an opinion about — if the backend could disagree with it, it belongs in TanStack Query, not here. |
| Form state & validation | **React Hook Form + Zod** | Zod schemas live in a shared `packages/schemas` package, hand-mirroring the backend's Bean Validation constraints (doc F6) — e.g. `splitPercentage` bounded `0.01–100`, password strength matching `@StrongPassword`, `linkType=PERMANENT` forbidding `expiresAt`. Validating client-side before the request leaves the device is a real UX win on poor connectivity: fail fast locally instead of waiting on a round trip to learn the split percentage was invalid. |
| Persisted offline queue | **TanStack Query's mutation cache + a small outbox**, backed by IndexedDB (web, via `idb-keyval`) / `AsyncStorage` (mobile) | See doc F5. |

### API client & type generation

**Decision: generate TypeScript types from the backend's live OpenAPI document, not hand-transcribe DTOs.** The backend already ships `springdoc-openapi` (`common-core`'s `OpenApiConfig`, `/v3/api-docs`, Swagger UI at `/swagger-ui.html`) — this is the authoritative, always-current contract. `packages/api-client` runs:

```bash
npx openapi-typescript http://localhost:8080/v3/api-docs -o packages/api-client/src/schema.d.ts
```

as a pre-build/CI step, then a thin hand-written fetch wrapper (`packages/api-client/src/endpoints/*.ts`, one file per backend resource — auth, roles, api-keys, virtual-accounts, transactions, bank-accounts, settlement-accounts, settlements, collection-account, payment-links, temporary-accounts, payment-processors, reference-data) exposes typed functions built on those generated types, each returning a `TanStack Query`-ready shape (`queryFn`/`mutationFn` pairs). This keeps FE types honest against what the backend actually returns instead of drifting from hand-copied DTOs — and doc F6 documents today's shapes precisely enough to build this wrapper immediately, without waiting on the codegen step to be wired up.

### Idempotency-Key generation (client-side half of doc 3 §1.1)

Generated via `crypto.randomUUID()` **at the moment a mutation is initiated** (e.g. when the user taps "Pay", not when the request actually leaves the device) and attached as the `Idempotency-Key` header. This is what makes the offline outbox (doc F5) safe: a mutation queued while offline and replayed on reconnect carries the *same* key it would have carried had the network been up, so a duplicate send from a flaky retry is a no-op on the backend, not a double charge.

### Auth/session handling per platform

| | Web (Console) | Mobile (Wallet) |
|---|---|---|
| Token storage | httpOnly cookie, set by a Next.js Route Handler (doc F2 ADR-FE-2) | `expo-secure-store` |
| Attaching to requests | Server Components / Route Handlers read the cookie, never the browser | Axios/fetch interceptor reads from secure store |
| Expiry handling | No refresh-token endpoint exists yet (doc F9) — on a 401, clear the cookie and redirect to `/login` | Same: on 401, clear secure store and redirect to the login stack |
| CSRF | `SameSite=Lax` cookie + `Origin` header check on Route Handlers | N/A (no cookies, no browser) |

---

## Chapter F5 — Security & Offline Resilience

The frontend's job is downstream of, not a substitute for, the backend's own security posture (doc 3 §2). Specifically:

- **The API key secret (`sk_live_…`) is never persisted client-side beyond one render.** `POST /api/v1/api-keys` / `/regenerate` return the plaintext secret exactly once (doc F6) — the Console displays it in a "copy now, you won't see this again" panel and holds it only in transient component state, never in TanStack Query's cache (which persists, per below) and never in `localStorage`.
- **The dashboard's own session uses JWT** (doc F2 ADR-FE-2); HMAC/API-key auth (doc 3 §2.5) is exclusively a server-to-server mechanism for a business's *own backend* calling `/collect` and `/withdraw` — the Console UI never signs a request itself, it only manages the credential.
- **CORS is currently unconfigured on the backend** — flagged again here because it blocks the Console from calling the API from a browser at all until resolved (doc F9).

### Offline resilience (NFR-2)

The backend's own resilience posture already fails open under network/Redis stress (idempotency's Redis lock, rate limiting — doc 3 §1.2/§2.4) rather than blocking traffic; the frontend mirrors that philosophy on the client side:

1. **Read cache**: TanStack Query's `persistQueryClient` (web: `@tanstack/query-async-storage-persister` over IndexedDB; mobile: over `AsyncStorage`) keeps the last-fetched balance/transaction-list/settlement-config visible immediately on app open, even fully offline, marked visually stale rather than blanked.
2. **Write outbox**: a mutation attempted while offline (`navigator.onLine === false` on web, `NetInfo` on mobile) is queued in the same persisted store with its already-generated idempotency key (above), and TanStack Query's `onlineManager` replays the queue automatically on reconnect — no custom polling loop needed.
3. **Optimistic UI**: for low-risk, easily-reversible actions (creating a payment link, toggling auto-settle) the UI updates immediately and rolls back on a failed replay. For actual money movement (collect, withdraw, settle) the UI shows an explicit "queued — will send when back online" state rather than pretending success, since silently optimistic money-movement UI is the wrong trade-off for a payments app.

---

## Chapter F6 — API Surface Reference

Sourced directly from the backend's controllers/DTOs (not the aspirational master spec) as of the `feat/pagination-and-term-search` branch. This is a snapshot for building the initial `packages/api-client` — once the OpenAPI-codegen step (doc F4) is wired up, that generated schema is the source of truth and this table should be treated as historical.

All paths are prefixed `/api/v1`. Two auth mechanisms: **JWT** (`Authorization: Bearer <token>`, permission-gated via `@PreAuthorize("@auth.can('resource:action')")`, `SUPERADMIN` bypasses all checks) and **API-key/HMAC** (`X-Public-Key` / `X-Timestamp` / `X-Signature` headers — server-to-server only, doc 3 §2.5). Public/no-auth: `auth/signup`, `auth/login`, `auth/forgot-password`, `auth/reset-password`, all of `/pay/**`.

**Pagination coverage is inconsistent today** — flagged in doc F9 as worth normalizing backend-side: paginated-with-search (`term`, `page`, `size`): Roles, Payment Processors, Admin Divisions, Banks, Countries. Paginated-without-search: API Keys (+ IP whitelist), Bank Accounts, Dynamic Accounts, Payment Links, Settlement Accounts, Virtual Accounts. **No list endpoint at all**: Transactions (create + get-by-id only), Settlements (create only, returns the array from that one call), Collection Account (single active record, not a list).

Every paginated response: `{ content: T[]; page: number; size: number; totalElements: number; totalPages: number }` (default `page=0`, `size=20`).

### Auth — `/auth`
| Method & path | Auth | Request → Response |
|---|---|---|
| `POST /signup` | public | `SignupRequest` → 201 `AuthResponse` |
| `POST /login` | public | `LoginRequest` → `AuthResponse` |
| `POST /forgot-password` | public | `ForgotPasswordRequest` → `ForgotPasswordResponse` |
| `POST /reset-password` | public | `ResetPasswordRequest` (6-digit `token`) → `MessageResponse` |
| `POST /change-password` | JWT | `ChangePasswordRequest` → `MessageResponse` |

`AuthResponse` (used for both signup and login — there is no separate login response type): `{ accessToken, tokenType: "Bearer", expiresInSeconds, userId, businessId }`. `SignupRequest` presence of `businessName` triggers a business signup. `ForgotPasswordResponse.resetToken` is returned **directly in the API response** today, not emailed/SMS'd (doc F9 gap).

### RBAC / Roles — `/roles` (`roles:manage`, JWT)
`POST /` and `GET /` (`term?, page, size`, business-scoped). `CreateRoleRequest { name, permissionNames[] }` → `RoleResponse { id, name, businessId, permissionNames[] }`.

Full permission catalog (no central constants class exists backend-side — literals only): `transactions:create/read`, `virtualaccounts:read`, `processors:configure/read`, `roles:manage`, `users:read`, `settlements:read/manage`, `apikeys:manage`, `paymentlinks:manage/read`, `collection-account:manage` (unassigned — SUPERADMIN-only), `temporaryaccounts:manage`, and `collect:create`/`withdraw:create` (synthesized only by the API-key filter, never in the DB).

### API Keys — `/api-keys` (`apikeys:manage`, JWT)
| Method & path | Notes |
|---|---|
| `POST /` | 201 `ApiKeyGeneratedResponse { id, publicKey, secretKey }` — secret shown once |
| `POST /regenerate` | same shape; old pair → INACTIVE |
| `GET /` | `page, size` → `PageResponse<ApiKeyResponse { id, publicKey, status, createdAt }>` |
| `POST /ip-whitelist` | `{ cidr }` → 201 |
| `GET /ip-whitelist` | `page, size` → `PageResponse<string>` |
| `DELETE /ip-whitelist?cidr=` | 204 |

### Virtual Accounts — `/virtual-accounts` (`virtualaccounts:read`, JWT)
`GET /` only (`page, size`) → `PageResponse<VirtualAccountResponse { id, accountNumber, userId, businessId, currency, balance }>`. No create endpoint — provisioning is signup-triggered only (FR-1).

### Transactions — `/transactions`
| Method & path | Permission | Notes |
|---|---|---|
| `POST /` | `transactions:create` | `@Idempotent`; `CreateTransactionRequest { virtualAccountId, paymentProcessorId, transactionType: CREDIT\|DEBIT, amount }` → 201 |
| `GET /{id}` | `transactions:read` | ownership-checked; **no list endpoint** |

`TransactionResponse { id, amount, charge, transactionStatus, transactionType, sessionId, virtualAccountId, paymentProcessorId, createdAt }`. Enums: `TransactionStatus = PENDING\|PROCESSING\|PAID\|FAILED\|ON_HOLD`, `TransactionType = CREDIT\|DEBIT`.

### Bank Accounts & Verification — `/bank-accounts`, `/banks/resolve-account`
`POST /bank-accounts` (`settlements:manage`) — `CreateBankAccountRequest { bankId, accountNumber, accountName }` → `BankAccountResponse`. `GET /bank-accounts` (`settlements:read`, `page, size`). Account name is always re-resolved server-side via `BankVerificationService` (live Paystack `GET /bank/resolve` call, doc `payments.md`) — never trusts client-supplied `accountName` for the *stored* value; `GET /banks/resolve-account` (`settlements:manage`) previews the resolved name before submission.

### Settlement Accounts & Settlements — `/settlement-accounts`, `/settlements`
| Method & path | Permission | Notes |
|---|---|---|
| `POST /settlement-accounts` | `settlements:manage` | `{ bankAccountId, splitPercentage: 0.01–100.00 }` → rejects if business total would exceed 100% |
| `GET /settlement-accounts` | `settlements:read` | `page, size`, scoped to caller's virtual account |
| `PATCH /settlement-accounts/auto-settle` | `settlements:manage` | `{ autoSettle: boolean }` → 204 |
| `POST /settlements` | `settlements:manage` | `@Idempotent`; `{ amount? }` (omit = full balance) → `SettlementResponse[]`, one per split |

`SettlementResponse { id, virtualAccountId, settlementAccountId, amount, settlementStatus, reference }`. Enum `SettlementStatus = PENDING\|PROCESSING\|COMPLETED\|FAILED`.

### Collection Account — `/collection-account` (`collection-account:manage` — SUPERADMIN-only in practice)
`POST /` and `GET /` (single active record, not a list) → `CollectionAccountResponse { id, bankId, accountNumber, accountName, balance }`.

### Payment Links — business `/payment-links`, public `/pay`
| Method & path | Auth | Notes |
|---|---|---|
| `POST /payment-links` | `paymentlinks:manage`, JWT | `@Idempotent`; `{ amount?, linkType: PERMANENT\|TEMPORARY, expiresAt?, singleUse }` — `expiresAt` forbidden for PERMANENT, defaults +24h for TEMPORARY |
| `GET /payment-links` | `paymentlinks:read`, JWT | `page, size` |
| `DELETE /payment-links/{id}` | `paymentlinks:manage`, JWT | revoke |
| `GET /pay/{shortCode}` | public | resolve |
| `POST /pay/{shortCode}` | public | `@Idempotent`; `{ amount? }` (only if link has no fixed amount) → `TransactionResponse` |

`PaymentLinkResponse { id, shortCode, amount, currency, linkType, expiresAt, singleUse, linkStatus }`. Enum `PaymentLinkStatus = ACTIVE\|EXPIRED\|REDEEMED\|REVOKED`. The public pay controller is deliberately separate from the business-facing one — different caller trust boundary (doc `payments.md`).

### Dynamic (Temporary) Virtual Accounts — `/temporary-accounts` (`temporaryaccounts:manage`, JWT)
`POST /` — `{ expectedAmount?, expiresAt?, reference? }` (defaults +30min) → 201. `GET /` — `page, size`. `POST /{accountNumber}/simulate-deposit` — `@Idempotent`; `{ amount }` → `TransactionResponse` (sandbox stand-in for the real NIBSS inbound webhook, doc `payments.md`).

`DynamicVirtualAccountResponse { id, accountNumber, expectedAmount, expiresAt, status, reference }`. Enum `DynamicAccountStatus = ACTIVE\|EXPIRED\|PAID\|REVOKED`.

### Third-party Collect / Withdraw — `/collect`, `/withdraw` (API-key/HMAC only — **not called from either client UI directly**; documented here because the Console's API Keys screen is what a business uses to integrate *their own* backend against these)
`POST /collect` — `{ amount }` → 201 `TransactionResponse` (CREDIT). `POST /withdraw` — `{ amount? }` → 200 `SettlementResponse[]`. Both `@Idempotent`.

### Payment Processor — `/payment-processors`
`POST /` (`processors:configure`) `{ name }` → 201. `GET /`, `/{id}` (`processors:read`, `term?, page, size`) → `{ id, name, status }`.

### Reference Data — `/countries`, `/countries/{id}/states`, `/states/{parentId}/children`, `/banks`
All require a valid JWT (no `permitAll` entry) but no specific permission. All support `term?, page, size` except the two path-level lookups.
- `CountryResponse { id, name, iso3, flagUrl, currency }`
- `AdminDivisionResponse { id, countryId, name, level, parentId }` (level 1=State, 2=LGA, 3=Ward — Ward unseeded today)
- `BankResponse { id, name, code }`

### Shared shapes
```ts
interface PageResponse<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }
interface ErrorResponse { timestamp: string; status: number; errorCode: string; message: string; requestId: string | null; details: string[] }
```

**Money encoding caveat**: monetary fields (`amount`, `balance`, `charge`, `expectedAmount`) are Java `BigInteger` in minor units and serialize as JSON numbers; `splitPercentage` is `BigDecimal`. Type these as `string` client-side rather than `number` if there's any chance of exceeding `Number.MAX_SAFE_INTEGER` — unlikely for kobo amounts at MVP scale, but cheap to get right up front rather than retrofit.

---

## Chapter F7 — Screen Inventory & Process Flows

Each screen cites the backend process flow it drives (doc 4 Part C) so a screen's behavior is traceable back to the spec, the way the backend's own controllers cite `FR-x`.

### Business Console (web)

| Screen | Backend flow | Key endpoints |
|---|---|---|
| Sign up (individual or business) | doc 4 §C.1 | `POST /auth/signup` |
| Log in / Forgot / Reset password | doc 4 §C.1 | `/auth/login`, `/auth/forgot-password`, `/auth/reset-password` |
| Dashboard home (balance, recent activity) | — | `GET /virtual-accounts`, `GET /transactions/{id}` per recent id |
| Transactions | doc 4 §C.2 | `GET /transactions/{id}` (no list yet — doc F9) |
| Bank Accounts | doc 4 §C.6 | `POST/GET /bank-accounts`, `GET /banks/resolve-account` |
| Settlement Accounts & Splits | doc 4 §C.6 | `/settlement-accounts`, `PATCH .../auto-settle` |
| Settlements (manual trigger + history) | doc 4 §C.6 | `POST /settlements` |
| Collection Account *(SUPERADMIN only)* | doc 4 §C.6 | `/collection-account` |
| API Keys & Webhooks | doc 4 §C.7 | `/api-keys`, `/api-keys/ip-whitelist` |
| Payment Links | doc 4 §C.8 | `/payment-links` |
| Dynamic Accounts *(+ sandbox simulate-deposit in test mode)* | doc 4 §C.8 | `/temporary-accounts` |
| Team & Roles | doc 4 §C.4, FR-5a | `/roles` |
| Settings — Profile / Contact / Accounts / Preferences | — | `/auth/change-password`; rest pending doc F9 |
| Payment Processors *(Supply Admin)* | doc 4 §C.4, FR-6 | `/payment-processors` |
| Reference-data pickers (bank/country/state selects) | — | `/banks`, `/countries`, `/countries/{id}/states` |
| Reports *(blocked on backend)* | doc 4 §C.3 | none yet — doc F9 |
| Audit Logs *(blocked on backend)* | doc 4 §C.5 | none yet — doc F9 |

### Consumer Wallet App (mobile)

| Screen | Backend flow | Key endpoints |
|---|---|---|
| Onboarding (signup, KYC tier 1) | doc 4 §C.1 | `POST /auth/signup`; KYC endpoints don't exist yet — doc F9 |
| Home (balance, virtual account number) | — | `GET /virtual-accounts` |
| Transaction history | doc 4 §C.2 | blocked on a list endpoint — doc F9 |
| Collect (share payment link / dynamic account) | doc 4 §C.8 | `/payment-links`, `/temporary-accounts` |
| Send to another Nawill user | doc 4 §C.2 (partial) | **no endpoint yet** — doc F9, highest-priority gap |
| Notifications | doc 1 FR-Notif-1 | not implemented backend-side — doc F9 |
| Security (2FA, change password, biometric app-lock) | doc 1 FR-8 | `/auth/change-password`; 2FA endpoints don't exist yet |
| Profile / Settings | — | pending doc F9 |

---

## Chapter F8 — Repository Layout, Naming & Design Tokens

### Monorepo layout

Turborepo + npm workspaces (implemented with npm, not pnpm — a small deviation from the original plan; npm workspaces cover the same need with one less tool to install, and nothing here depends on pnpm specifically), mirroring the backend's own "shared kernel + per-capability modules" shape (doc 2 §1.1) so the same mental model applies on both sides of the stack. This is the actual layout as built, not just the plan:

```
napayment-fe/
├── apps/
│   ├── web/                    Next.js 15 App Router — Business Console (built)
│   │   └── src/
│   │       ├── app/            Routes: (auth)/, onboarding/, dashboard/, invite/[token]/, api/**
│   │       ├── components/     ui/ (primitives), onboarding/, dashboard/, settings/, auth/
│   │       ├── hooks/          TanStack Query hooks, one file per resource group
│   │       ├── lib/            Browser-side fetch helper (api.ts), cn()/format helpers (utils.ts)
│   │       └── server/         session.ts, backend-client.ts, dev-store.ts, route-helpers.ts
│   └── mobile/                  Expo (React Native) — Consumer Wallet App (scaffold only)
├── packages/
│   ├── api-client/              Typed fetch wrapper over the backend (doc F6) — hand-maintained
│   │   └── src/                 today (types.ts/http.ts/client.ts); swap for OpenAPI-generated
│   │                            types once the backend's CORS gap (doc F9) closes and codegen
│   │                            is wired up, per doc F4 — the call-site shape won't change.
│   ├── schemas/                 Zod validation schemas mirroring backend Bean Validation
│   ├── ui-tokens/                Design tokens: color/spacing/radius (below)
│   └── (no ui-web/ui-native yet) UI primitives live directly in apps/web/src/components/ui
│                                today (Radix + Tailwind, hand-built — see doc F2 ADR-FE-3)
│                                since only one app consumes them so far; split into a shared
│                                ui-web package if/when a second web surface needs them.
├── assets/
│   └── reference-screenshots/  Paystack UX reference captures — gitignored (contains the
│                                account holder's personal info), local reference only
└── docs/
    ├── nawill-pay-frontend.md  This document
    └── api-contracts/           JSON request/response contracts for every doc F9 gap
```

### Naming conventions

Deliberately reuses the backend's own convention table shape (doc 4 Part B) so an engineer moving between repos doesn't context-switch styles.

| Element | Convention | Example |
|---|---|---|
| Components | PascalCase, noun-based | `TransactionTable`, `SettlementSplitForm` |
| Hooks | camelCase, `use`-prefixed | `useTransactions`, `useAutoSettleToggle` |
| API client functions | verb-first camelCase, matching backend method names | `createSettlementAccount()`, `resolveBankAccount()` |
| Zod schemas | suffixed `Schema` | `CreateSettlementAccountSchema` |
| Files (components) | kebab-case matching the exported component | `transaction-table.tsx` |
| Files (routes, Next.js App Router) | Next.js convention | `app/(dashboard)/settlements/page.tsx` |
| Branches / commits | identical to backend (doc 4 Part B.1) | `feature/NW-142-payment-links`, Conventional Commits |
| Env vars (web, client-exposed) | `NEXT_PUBLIC_*` | `NEXT_PUBLIC_API_BASE_URL` |
| Env vars (mobile, client-exposed) | `EXPO_PUBLIC_*` | `EXPO_PUBLIC_API_BASE_URL` |

### Design tokens

Sampled directly from the provided logo mark (`assets/reference-screenshots/Screenshot 2026-09-11 at 03.15.45.png`):

| Token | Value | Usage |
|---|---|---|
| `color.brand.navy` | `#262B49` | Primary — sidebar, headers, primary buttons |
| `color.brand.cream` | `#ECE6D9` | Accent — on-navy text/icon, subtle surface fills |

These are the two anchor points; a full Tailwind scale (`navy-50`…`navy-900`, `cream-50`…`cream-900`) should be generated from them and reviewed by design before the first screen ships — treat the two sampled values as fixed brand anchors, not the complete palette. Status colors (success/warning/danger, for `transactionStatus`/`settlementStatus`/link-status pills) are deliberately **not** sampled from the Paystack reference captures (their green/red are Paystack's brand, not ours) — pick a palette that passes contrast against both `navy` and `cream` surfaces in light and dark mode.

---

## Chapter F9 — Backend Gaps the Frontend Will Need

Per direction not to limit the UI to what the backend documents today: these are gaps identified while building this handbook, ordered by how soon the frontend blocks on them. Each should become its own backend ticket, citing the relevant `FR-x` the way every existing backend module does. Where a concrete request/response contract was worked out while building the Console's onboarding flow against these gaps, it's linked below and lives as copy-pasteable JSON under `docs/api-contracts/`.

| Gap | Blocks | Notes |
|---|---|---|
| **CORS configuration** | ~~The Console calling the API from a browser at all~~ Worked around, not fully resolved | Still no CORS setup in `SecurityConfig`/`application.yml`, but the built Console never calls the backend from the browser at all — every request routes through a Next.js Route Handler acting as a BFF (doc F2 ADR-FE-2, `apps/web/src/server/backend-client.ts`), which is a server-to-server call. Still worth fixing backend-side for any *other* future browser-based client. |
| **`GET /users/me` (or equivalent profile read)** | Displaying the signed-in user's name/email/phone anywhere | Not previously called out explicitly — found while wiring the Console's header and Settings → Profile. `AuthResponse` (signup/login) returns only `{ accessToken, userId, businessId, ... }`, no profile fields. Stopgap: `apps/web/src/server/dev-store.ts` caches what the signup form itself submitted, keyed by `userId`. Contract: `docs/api-contracts/users-me.json`. |
| **Transaction list endpoint** | Transaction history screens on both Console and Wallet App | `TransactionController` only has `POST /` and `GET /{id}` — no `GET /transactions` at all. The built dashboard home explicitly shows this as blocked rather than faking a list. |
| **Refresh-token rotation** | Session length / re-login frequency | README lists this as explicitly out of scope for v0.1 (doc 3 §2.1 describes the target design already). Access-token-only means a 10–15 min forced re-login today; the built session cookie (doc F2 ADR-FE-2) expires in lockstep with it. |
| **Peer-to-peer send** | The Wallet App's core "transfer money" flow (FR-Auth-1) | Today's transaction/collect endpoints only credit/debit the *caller's own* virtual account; there's no "send from my account to another Nawill user's account" endpoint. |
| **"Join an existing business" signup path** | Team invite acceptance actually creating a staff account | Distinct from peer-to-peer send, above. `POST /api/v1/auth/signup` always creates a brand-new business (or a plain individual) — there's no way for an invited user to sign up *under* the inviting business_id with their assigned role. The built `/invite/[token]` accept page marks the invite accepted in the dev-store only; it cannot create the real account. Contract sketch: `docs/api-contracts/team-invites.json`. |
| **KYC endpoints (business details, owner BVN/NIN, document upload, submit-for-review)** | Onboarding → KYC step, FR-8/FR-8a's ₦50,000 enhanced-KYC trigger | README explicitly flags FR-8/FR-8a as `TODO` — no KYC entity/endpoint exists in the controller set at all yet. The built Console implements the full upload UI against a dev-store stand-in (local disk under `.data/uploads/`). Contracts: `docs/api-contracts/business-details.json`, `owner-identity.json`, `kyc-documents.json`, `kyc-submit.json`. |
| **Team invitation endpoints + email dispatch** | Onboarding → Invite your team step, FR-5a | No invitation concept exists (only `POST /api/v1/roles`, which the Console *does* call for real — see doc F6). The invite envelope itself (token, email delivery, accept flow) is dev-store only. Contract: `docs/api-contracts/team-invites.json`. |
| **API key webhook/callback URL fields** | Onboarding → API Keys & Webhooks step, FR-9 | `ApiKeyCredential` has no callback/webhook URL column despite FR-9 calling for one. Contract: `docs/api-contracts/webhook-config.json`. |
| **Business contact settings** | Settings → Contact tab | No equivalent field on the `Business` entity. Contract: `docs/api-contracts/contact-settings.json`. |
| **2FA endpoints** | Security settings screen, FR-8 | Flagged `TODO` in the backend README, no endpoints exist. Not yet built on the frontend either (Settings → Profile only exposes change-password, which is real). |
| **Notification delivery** | In-app/push notification screen, FR-Notif-1; also blocks real invite-email delivery above | `ForgotPasswordResponse.resetToken` is returned directly in the API response today rather than emailed/SMS'd — notification dispatch isn't wired up yet at all. The built forgot-password screen surfaces this token directly in the UI with an explicit dev-gap notice, rather than pretending an email was sent. |
| **Reporting/statement export (FR-Report-1)** | Reports screen | No reporting module/endpoints exist yet. |
| **Audit log read endpoint** | Admin "Audit Logs" screen (doc 4 §C.5) | `UserChangeLog`/activity logging exists in the design (doc 2 §4.2) but there's no `GET` surface for the frontend to read it back. |
| **Consistent pagination** | Predictable `<DataTable>` behavior across every list screen | See doc F6 — several list endpoints (API Keys, Bank Accounts, Dynamic Accounts, Payment Links, Settlement Accounts, Virtual Accounts) are paginated but don't yet support `term` search, unlike Roles/Processors/Reference-Data. |
| **Admin/superadmin cross-business views** | SUPERADMIN portal screens (FR-3, doc 4 §C.4) | Every current list endpoint scopes to the caller's own business/virtual account; there's no "list all businesses" / "list all transactions platform-wide" surface for the analytics dashboard FR-3 describes. |

---

## Chapter F10 — Roadmap

Mirrors the backend's own release-tagged requirements table (doc 1 §6), so frontend and backend releases stay legible against each other.

| Release | Theme | Depends on | Status |
|---|---|---|---|
| **FE v0.1 — Console shell + full onboarding** | Auth (signup/login/forgot/reset/change-password), the full onboarding wizard (business details, KYC upload, team invites, API keys/webhooks, review), dashboard shell, Settings (Profile/Contact/Team/API Keys), Virtual Account balance display | Backend v0.1 — CORS wasn't actually a blocker, see doc F9's revised note | **Built** (`apps/web`) |
| **FE v0.1.x — Settlement, links & dynamic accounts** | Bank Accounts / Settlement Accounts / Settlements / Payment Links / Dynamic Accounts screens (beyond the API Keys work already shipped in v0.1 above) | Backend v0.1.x (already implemented backend-side) | Not started |
| **FE v0.2 — Team, processors, reconciliation views** | Payment Processor config (Supply Admin), reconciliation-mismatch review screen (Team & Roles UI already shipped in v0.1 above, against a real `POST /api/v1/roles`) | Backend v0.2 (FR-6, FR-7, FR-Recon-1/2, FR-5a) | Not started |
| **FE v0.3 — Wallet App launch, reporting, offline hardening** | Consumer Wallet App v1 (needs peer-to-peer send, doc F9), Reports screen, full offline-outbox rollout (doc F5) | Backend v0.3 (FR-Notif-1, FR-Report-1, NFR-2, NFR-10) + doc F9's send/KYC/2FA/notification gaps | Mobile is scaffolded only (`apps/mobile`) |
| **FE v1.0 — Multi-currency** | Currency selector, FX-aware amount displays | Backend v1.0 | Not started |
