# NAWILL PAY — FRONTEND

## Web & Mobile Engineering Handbook

*Framework decision, architecture, state management, API integration, screen inventory, and roadmap for the two client surfaces built against the `napayment` backend.*

Version 0.2 (Framework selection + architecture, plus the Business Console's onboarding surface — signup through KYC, team invites, API keys/webhooks — implemented against it)

Prepared by: Nawill Technology Ltd — Engineering
Date: September 2026

**Implementation status (added post-v0.1 of this document):** the Business Console's full onboarding flow — business/individual signup, KYC document upload, team invites, API key + IP whitelist + webhook config, and the corresponding Settings tabs — is built in `apps/web` per this handbook's own architecture (Chapters F2/F4/F8), along with a **Transactions** screen (filterable/paginated list + analytics dashboard: stat tiles, a daily-volume bar chart, status/type breakdowns). The Consumer Wallet App (`apps/mobile`) is scaffolded only, per doc F10. Every screen calls a real backend endpoint through the BFF proxy (doc F2 ADR-FE-2) — **`apps/web/src/server/dev-store.ts` (the JSON-file dev stand-in every onboarding screen was originally built against) has been deleted**: the backend closed essentially every doc F9 gap it was covering for (`GET /users/me`, business KYC/KYB, owner BVN/NIN identity, KYC document upload+download, KYC submit, team invitations + a real invite-acceptance signup path, API-key webhook config, business contact settings) in one pass, and every Route Handler that used to read/write it now calls the real endpoint instead. See the revised doc F9 table for what's still actually open (a small remainder, not the original eight gaps) and doc F6 for the endpoints themselves. `docs/api-contracts/` is kept as a historical record of the contracts this integration was built against — each file now links to where it landed.

**Next phase — Payouts & Treasury:** full UI design in `docs/treasury-settlements-ui-design.md`. **Partially built:** the transaction PIN (Settings → Security) and peer-to-peer wallet transfer (Send Money, `/dashboard/send`) shipped first — ahead of the settlement/payout-split screens that doc originally scoped the PIN around — since that's what the backend implemented first (FR-Auth-1/2). The PIN mechanism (`POST /api/v1/auth/transaction-pin`, verified via `TransactionPinGateway`) is the same one that will gate settlements/payout-split changes once those land; see `docs/api-contracts/transaction-pin.json` for the real (not proposed) contract. **Still not built:** settlement accounts/payout splits, settlements history, bank accounts, payment links, temporary accounts — backend for those, plus the real-money-movement parts (live NIP disbursement, the collection account's real-bank link), is in progress on a separate track.

---

This document is the frontend counterpart to the backend's `docs/nawill-pay.md` master specification. Citation scheme: **doc F-N** refers to a chapter here; a bare **doc N** (no `F`) refers to the corresponding chapter in the backend spec (e.g. `doc 3 §2.5` is the backend's HMAC auth flow). Requirement IDs (`FR-x`, `NFR-x`) are the backend's own and are reused verbatim rather than renumbered, since the frontend exists to serve them, not redefine them.

**New to the codebase?** Start at [`docs/subjects/README.md`](./subjects/README.md) instead — it's the faster onboarding path (a directory map plus a brief what/why/further-reading for each major technology), and it links back here for anything that needs the full depth this document provides.

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

**Addendum (Wallet App v1):** not adopted for the first build. NativeWind's Metro/Babel setup was unverified against Expo SDK 57, so the app uses React Native `StyleSheet` over a typed theme (`apps/mobile/src/theme`) whose values mirror `packages/ui-tokens` one-to-one. Token parity holds; class-name parity doesn't. Revisit once NativeWind is confirmed on the SDK in use.

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

Sourced directly from the backend's controllers/DTOs (not the aspirational master spec), current through the `feat(onboarding): implement backend for business onboarding/KYC` commit. This is a snapshot for building the initial `packages/api-client` — once the OpenAPI-codegen step (doc F4) is wired up, that generated schema is the source of truth and this table should be treated as historical.

All paths are prefixed `/api/v1`. Two auth mechanisms: **JWT** (`Authorization: Bearer <token>`, permission-gated via `@PreAuthorize("@auth.can('resource:action')")`, `SUPERADMIN` bypasses all checks) and **API-key/HMAC** (`X-Public-Key` / `X-Timestamp` / `X-Signature` headers — server-to-server only, doc 3 §2.5). Public/no-auth: `auth/signup`, `auth/login`, `auth/forgot-password`, `auth/reset-password`, all of `/pay/**`.

**Pagination coverage is inconsistent today** — flagged in doc F9 as worth normalizing backend-side: paginated-with-search (`term`, `page`, `size`): Roles, Payment Processors, Admin Divisions, Banks, Countries, **and now Transactions** (its `term` matches `sessionId`). Paginated-without-search: API Keys (+ IP whitelist), Bank Accounts, Dynamic Accounts, Payment Links, Settlement Accounts, Virtual Accounts. **No list endpoint at all**: Settlements (create only, returns the array from that one call), Collection Account (single active record, not a list).

Every paginated response: `{ content: T[]; page: number; size: number; totalElements: number; totalPages: number }` (default `page=0`, `size=20`).

### Auth — `/auth`
| Method & path | Auth | Request → Response |
|---|---|---|
| `POST /signup` | public | `SignupRequest` (now requires `confirmPassword`, checked against `password` server-side) → 201 `AuthResponse` |
| `POST /login` | public | `LoginRequest` → `AuthResponse` |
| `POST /refresh` | public | `RefreshTokenRequest { refreshToken }` → `AuthResponse` — rotates: the presented token dies, a new one is issued |
| `POST /logout` | public | `RefreshTokenRequest { refreshToken }` → `MessageResponse` — revokes the token server-side |
| `POST /forgot-password` | public | `ForgotPasswordRequest` → `ForgotPasswordResponse` |
| `POST /reset-password` | public | `ResetPasswordRequest` (6-digit `token`) → `MessageResponse` |
| `POST /change-password` | JWT | `ChangePasswordRequest` → `MessageResponse` |

`AuthResponse` (used for signup, login, refresh, AND signup/accept-invite — there is no separate response type per endpoint): `{ accessToken, refreshToken, tokenType: "Bearer", expiresInSeconds, userId, businessId }`. `SignupRequest` presence of `businessName` triggers a business signup. `ForgotPasswordResponse` is now just `{ message }` — the 6-digit reset code is delivered via `EmailGateway` to the account's inbox as a `/reset-password?email=...&token=...` link (`AuthService#resetUrl`), never returned in the API response.

**Refresh tokens (NFR-7 — resolved, previously the top doc F9 gap):** `RefreshTokenService` is Redis-backed, rotating, single-use — every `POST /refresh` call kills the presented token and issues a fresh one; replaying an already-rotated-out token revokes the *entire* chain (reuse detection, OWASP's recommended pattern), not just the replayed token. 30-day lifetime (`AUTH_JWT_REFRESH_EXPIRY_DAYS`), independent of the access token's own 15-minute one (`AUTH_JWT_EXPIRY_MINUTES`). The frontend's own half of this lives in `apps/web/src/middleware.ts` — see doc F9 and `docs/subjects/authentication-and-sessions.md` for the full flow, since a Server Component can't itself write the rotated cookie.

`POST /signup/accept-invite` — FR-5a's "join an existing business" variant, added alongside the team-invitations feature below. `AcceptInviteRequest { token, firstName, middleName?, lastName, phoneNo, password }` → 201 `AuthResponse` (same shape as signup/login, including a refresh token). No `email` field — the backend derives it from the invitation the token resolves to. Rejects with `400 INVALID_INVITE` if the token doesn't resolve to a `PENDING` invitation, `400 EMAIL_TAKEN`/`400 PHONE_TAKEN` on a collision. Attaches the new user to the inviting business under the invitation's role; does **not** provision a new virtual account (the business already has one, shared across every user on it).

**Phone number validation:** `phoneNo` on both `SignupRequest` and `AcceptInviteRequest` is validated backend-side via Google's libphonenumber (`@PhoneNumber`, common-core), defaulting to Nigeria (`NG`) when no explicit `+<country code>` prefix is given, but correctly parsing an explicit `+234...`/`+233...`/etc. regardless. The frontend's `PhoneInput` component (doc F8) always sends the explicit `+`-prefixed form, so the two stay in agreement without either side special-casing the other.

### Users — `/users` (JWT, no specific permission — any authenticated caller reading their own record)
`GET /me` → `UserResponse { userId, businessId, firstName, middleName, lastName, email, phoneNo, userType, businessName, cacNumber, isVerified, createdAt }`. Added specifically to close the "no profile-read endpoint" gap doc F9 originally flagged — every screen that shows the signed-in user's name/email now reads this live instead of a cached signup snapshot.

### RBAC / Roles — `/roles` (`roles:manage`, JWT)
`POST /` and `GET /` (`term?, page, size`, business-scoped). `CreateRoleRequest { name, permissionNames[] }` → `RoleResponse { id, name, businessId, permissionNames[] }`.

Full permission catalog (no central constants class exists backend-side — literals only): `transactions:create/read`, `virtualaccounts:read`, `processors:configure/read`, `roles:manage`, `users:read`, `settlements:read/manage`, `apikeys:manage`, `paymentlinks:manage/read`, `collection-account:manage` (unassigned — SUPERADMIN-only), `temporaryaccounts:manage`, `business:kyc-manage`, `business:manage` (both new, seeded onto `BUSINESS_OWNER`), and `collect:create`/`withdraw:create` (synthesized only by the API-key filter, never in the DB).

### API Keys — `/api-keys` (`apikeys:manage`, JWT)
| Method & path | Notes |
|---|---|
| `POST /` | 201 `ApiKeyGeneratedResponse { id, publicKey, secretKey }` — secret shown once |
| `POST /regenerate` | same shape; old pair → INACTIVE |
| `GET /` | `page, size` → `PageResponse<ApiKeyResponse { id, publicKey, status, createdAt }>` |
| `POST /ip-whitelist` | `{ cidr }` → 201 |
| `GET /ip-whitelist` | `page, size` → `PageResponse<string>` |
| `DELETE /ip-whitelist?cidr=` | 204 |
| `PUT /webhook-config` | `WebhookConfigRequest { callbackUrl?, webhookUrl? }` (either may be blank to clear it) → `WebhookConfigResponse { callbackUrl, webhookUrl, updatedAt }` — closed the FR-9 "configure a webhook URL" gap; adds those two columns to `ApiKeyCredential`, not a separate entity |
| `GET /webhook-config` | → `WebhookConfigResponse` |

### Business KYC (KYB) — `/business/kyc/details` (`business:kyc-manage`, JWT)
`PUT /` — `BusinessKycDetailsRequest { registeredName, cacNumber, businessType, industry, countryId, stateId, addressLine }` → `BusinessKycDetailsResponse` (same fields + `updatedAt`). `businessType` enum: `LIMITED_LIABILITY | SOLE_PROPRIETORSHIP | PARTNERSHIP | NGO | OTHER`. `GET /` → same response, or `null` (200, empty body) if never submitted. Note: the response has **no `kycStatus` field** — see doc F9 for the small resulting gap.

### Owner Identity (BVN/NIN) — `/kyc/owner-identity` (`business:kyc-manage`, JWT)
`PUT /` — `OwnerIdentityRequest { bvn?, nin? }` (exactly one required, 11 digits each) → `OwnerIdentityResponse { bvn, nin, verified }`. Verified via `IdentityVerificationGateway`/`SandboxIdentityVerificationGateway` (always approves — same sandboxed-for-now posture as `PaymentProcessorGateway`, doc 2 §7 ADR-6). Numbers are encrypted at rest and masked in logs. `GET /` → same shape, or `null` if never submitted.

### KYC Documents & Submission — `/kyc/documents`, `/kyc/submit` (`business:kyc-manage`, JWT)
| Method & path | Notes |
|---|---|
| `POST /kyc/documents` | `multipart/form-data`: `type` (`CAC_CERTIFICATE \| MEMORANDUM_AND_ARTICLES \| PROOF_OF_ADDRESS \| DIRECTOR_VALID_ID`) + `file` (max 10MB) → 201 `KycDocumentResponse { id, type, fileName, sizeBytes, uploadedAt }` |
| `GET /kyc/documents` | → `KycDocumentResponse[]` (plain array, not paginated — only 4 document types ever exist) |
| `GET /kyc/documents/{id}/download` | → binary stream, `Content-Disposition: attachment`; ownership-checked, never a public URL. Stored via `FileStorageGateway`/`LocalFileStorageGateway` (local disk today, swappable to S3/MinIO behind the same interface) |
| `POST /kyc/submit` | no body → `KycSubmitResponse { status, submittedAt }`. `400`s if business details are incomplete or any of the 4 document types is missing |

### Team Invitations — `/team/invitations` (`roles:manage`, JWT)
| Method & path | Notes |
|---|---|
| `POST /` | `CreateInviteRequest { email, roleTemplate, message? }` → 201 `InviteResponse { id, email, roleId, status, inviteUrl, invitedAt }` |
| `GET /` | → `InviteResponse[]` (plain array, business-scoped) |
| `DELETE /{id}` | → `{ ok: true }` |

`roleTemplate` is `ADMIN \| DEVELOPER \| ACCOUNT_OFFICER` — the backend's own `RoleTemplate` enum now owns the permission-set mapping and creates/reuses a business-scoped role by name (`findOrCreateRole`) server-side; the frontend used to do this itself via `POST /api/v1/roles` before this endpoint existed (doc F9, resolved). **`InviteResponse` carries `roleId`, not `roleTemplate`** — it isn't echoed back, so resolve `roleId` against `GET /roles` for a display name (`apps/web`'s own Route Handler does this merge server-side). Invite emails send via `EmailGateway`/`SmtpEmailGateway` (SMTP config in `.env`) — best-effort, a send failure is logged but never fails the invite itself.

### Business Contact — `/business/contact` (`business:manage`, JWT)
`PUT /` — `BusinessContactRequest { disputeEmails[], refundEmails[], supportEmail?, generalEmail }` → `BusinessContactResponse` (same shape). `GET /` → same, defaulting to `{ disputeEmails: [], refundEmails: [], supportEmail: "", generalEmail: <caller's account email> }` if nothing's been saved yet — never `null`.

### Virtual Accounts — `/virtual-accounts` (`virtualaccounts:read`, JWT)
`GET /` only (`page, size`) → `PageResponse<VirtualAccountResponse { id, accountNumber, userId, businessId, currency, balance }>`. No create endpoint — provisioning is signup-triggered only (FR-1).

### Transactions — `/transactions`
| Method & path | Permission | Notes |
|---|---|---|
| `POST /` | `transactions:create` | `@Idempotent`; `CreateTransactionRequest { virtualAccountId, paymentProcessorId, transactionType: CREDIT\|DEBIT, amount }` → 201 |
| `GET /{id}` | `transactions:read` | ownership-checked |
| `GET /` | `transactions:read` | Paginated + filterable list — **implemented** (was a doc F9 gap, closed). `page, size` plus every filter below. |
| `GET /analytics` | `transactions:read` | Aggregates over the same filtered set as the list (shares one `Specification`, so the two can never disagree) — not paginated, returns one summary object. |

Shared filter query params (both `GET /` and `GET /analytics`): `term?` (matched against `sessionId`), `status?` (`TransactionStatus`), `type?` (`TransactionType`), `virtualAccountId?` (narrows further — omit it and scoping still defaults to the caller's own transactions), `fromDate?`/`toDate?` (ISO-8601 instant, `fromDate` ≤ `toDate` or `400 INVALID_DATE_RANGE`), `minAmount?`/`maxAmount?` (minor units, `minAmount` ≤ `maxAmount` or `400 INVALID_AMOUNT_RANGE`). **Row-level ownership scoping is automatic and cannot be widened by the client**: a non-SUPERADMIN caller only ever sees transactions on virtual accounts they or their business own, regardless of filters passed. No `sort` param exists — list order is DB-default (unspecified), not guaranteed by `createdAt`.

`TransactionResponse { id, amount, charge, transactionStatus, transactionType, sessionId, virtualAccountId, paymentProcessorId, createdAt }`. Enums: `TransactionStatus = PENDING\|PROCESSING\|PAID\|FAILED\|ON_HOLD`, `TransactionType = CREDIT\|DEBIT`.

`TransactionAnalyticsResponse { fromDate, toDate, totalCount, totalVolume, creditVolume, debitVolume, netVolume, averageAmount, highest: {transactionId, amount, createdAt} | null, lowest: {...} | null, byStatus: [{status, count, volume}], byType: [{type, count, volume}], dailyVolume: [{date, count, volume}] }`. Computed in application code over the full filtered set (not a DB `GROUP BY`) — fine at current volumes, per the backend's own commit note; revisit if per-business transaction counts grow large.

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
| Onboarding wizard — business details, KYC (owner identity + documents), submit for review | doc 4 §C.1, FR-8 | `/business/kyc/details`, `/kyc/owner-identity`, `/kyc/documents`, `/kyc/submit` — **built** |
| Dashboard home (balance, recent activity) | — | `GET /virtual-accounts`, `GET /users/me`, `GET /transactions` (recent 5) |
| Transactions — list, filters, analytics | doc 4 §C.2 | `GET /transactions`, `GET /transactions/analytics`, `GET /transactions/{id}` — **built** |
| Bank Accounts | doc 4 §C.6 | `POST/GET /bank-accounts`, `GET /banks/resolve-account` |
| Settlement Accounts & Splits | doc 4 §C.6 | `/settlement-accounts`, `PATCH .../auto-settle` |
| Settlements (manual trigger + history) | doc 4 §C.6 | `POST /settlements` |
| Collection Account *(SUPERADMIN only)* | doc 4 §C.6 | `/collection-account` |
| API Keys & Webhooks | doc 4 §C.7 | `/api-keys`, `/api-keys/ip-whitelist` |
| Payment Links | doc 4 §C.8 | `/payment-links` |
| Dynamic Accounts *(+ sandbox simulate-deposit in test mode)* | doc 4 §C.8 | `/temporary-accounts` |
| Team & Roles / Invite teammates | doc 4 §C.4, FR-5a | `/roles`, `/team/invitations` — **built** |
| Settings — Profile / Contact | — | `GET /users/me`, `/auth/change-password`, `/business/contact` — **built**; Accounts/Preferences tabs not built (no backend surface for them yet, not flagged as a gap since nothing in doc 1 calls for them specifically) |
| Payment Processors *(Supply Admin)* | doc 4 §C.4, FR-6 | `/payment-processors` |
| Reference-data pickers (bank/country/state selects) | — | `/banks`, `/countries`, `/countries/{id}/states` |
| Reports *(blocked on backend)* | doc 4 §C.3 | none yet — doc F9 |
| Audit Logs *(blocked on backend)* | doc 4 §C.5 | none yet — doc F9 |

### Consumer Wallet App (mobile)

| Screen | Backend flow | Key endpoints |
|---|---|---|
| Onboarding (signup, KYC tier 1) | doc 4 §C.1 | **Built** — sign in / sign up (individual + business) / forgot + reset password (`/auth/*`). KYC document upload stays on the Console for now |
| Home (balance, virtual account number) | — | **Built** — `GET /virtual-accounts`, `GET /transactions` |
| Transaction history | doc 4 §C.2 | **Built** — Activity tab (`GET /transactions`, `/transactions/analytics`) + receipt (`GET /transactions/{id}`) |
| Collect (share payment link / dynamic account) | doc 4 §C.8 | **Built** — `/payment-links` (outbox-queued offline), `/temporary-accounts` (online-only; polled for PAID) |
| Send to another Nawill user | doc 4 §C.2 (partial) | **Built** — `/transfers/resolve` + `/transfers` behind the transaction-PIN sheet; online-only |
| Withdraw to bank | — | **Built** — `POST /settlements` to the configured settlement account(s); outbox-queued offline. Backend takes no PIN here (doc F9) |
| Notifications | doc 1 FR-Notif-1 | invite emails now send for real (`EmailGateway`); no general in-app/push notification system yet — doc F9 |
| Security (2FA, change password, biometric app-lock) | doc 1 FR-8 | **Built:** change password, set/change transaction PIN. Not yet: 2FA (no endpoints, doc F9), biometric app-lock (`expo-local-authentication` not installed) |
| Profile / Settings | — | **Built** — `GET /users/me`, settlement-account count, offline queue, sign out |

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
    └── api-contracts/           Historical contracts - the backend has since implemented
                                  nearly all of them for real (doc F9)
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

Per direction not to limit the UI to what the backend documents today: these are gaps identified while building this handbook, ordered by how soon the frontend blocks on them. Each should become its own backend ticket, citing the relevant `FR-x` the way every existing backend module does.

**Update: the backend closed nearly the entire original table in one pass** (`feat(onboarding): implement backend for business onboarding/KYC`) — `GET /users/me`, business KYC/KYB, owner BVN/NIN identity (sandboxed verification), KYC document upload/download, KYC submit, team invitations, a real invite-acceptance signup path, API-key webhook config, and business contact settings all now exist (doc F6). `apps/web/src/server/dev-store.ts`, the JSON-file stand-in every one of those screens was built against, has been **deleted** — every Route Handler that used to read/write it now calls the real endpoint. `docs/api-contracts/` is kept as a historical record of the contracts this integration was built against, not a current gap list.

What's left, resolved-or-not:

| Gap | Blocks | Notes |
|---|---|---|
| ~~**CORS configuration**~~ Not actually a blocker | — | Still no CORS setup in `SecurityConfig`/`application.yml`, but the Console never calls the backend from the browser — every request routes through the BFF (doc F2 ADR-FE-2). Still worth fixing for any *other* future browser-based client. |
| ~~**`GET /users/me`**~~ **Resolved** | — | Closed — see doc F6 "Users." The Console's header and Settings → Profile now read it live; `dev-store`'s signup-time profile cache is gone. |
| ~~**Transaction list endpoint**~~ **Resolved** | — | `GET /transactions` + `GET /transactions/analytics` — see doc F6. Consumed by `/dashboard/transactions` and the dashboard home's recent-activity preview. Still unbuilt on the **Wallet App** specifically (scaffold only, doc F10) — that's a frontend gap now, not a backend one. |
| ~~**Business KYC/KYB, owner identity, document upload+download, KYC submit**~~ **Resolved** | — | All four — see doc F6 "Business KYC," "Owner Identity," "KYC Documents & Submission." The Console's KYC step (`kyc-form.tsx`) now calls all of them for real, plus a new "Download" link per document the dev-store version couldn't offer. |
| ~~**Team invitation endpoints**~~ **Resolved** | — | `POST/GET/DELETE /team/invitations` — see doc F6. Role assignment was already real before this (`POST /roles`); now the invitation envelope, expiry, and status are too. |
| **"Join an existing business" signup path** | ~~Team invite acceptance actually creating a staff account~~ **Resolved** | `POST /auth/signup/accept-invite` now exists (doc F6) — attaches the new user to the inviting business under the invite's role. The `/invite/[token]` page is a real signup form now, not a dev-store "mark accepted" stub. |
| **Public "resolve invite by token" endpoint** | Showing who invited you / which business / which role *before* the accept-invite form is submitted | New, smaller gap surfaced *by* closing the one above: `accept-invite`'s own request has no need for it (the backend derives the email from the token server-side), but the UI can't show any of that context up front without a public `GET`. The built accept-invite page just collects details and submits blind, with an in-UI note explaining why. |
| **`kycStatus` not in the `GET /business/kyc/details` response** | Showing an exact "Pending Review" vs "Verified" vs "Rejected" badge after reload | The `Business` entity has `kycStatus` (confirmed in source), but no response DTO exposes it outside the one-time `KycSubmitResponse`. The onboarding-status checklist approximates "submitted" as "all 4 documents present" instead (see `apps/web/src/server/onboarding-status.ts`) — accurate except for the narrow window between uploading the last document and actually clicking submit. |
| ~~**API key webhook/callback URL fields**~~ **Resolved** | — | `PUT/GET /api-keys/webhook-config` — see doc F6. |
| ~~**Business contact settings**~~ **Resolved** | — | `PUT/GET /business/contact` — see doc F6. |
| ~~**Refresh-token rotation**~~ **Resolved** | — | `POST /auth/refresh` + `POST /auth/logout` now exist (doc F6) — rotating, Redis-backed, reuse-detecting. Frontend half: `apps/web/src/middleware.ts` proactively refreshes the access token (within a 2-minute buffer of its 15-min expiry) before it ever reaches a Server Component, since only middleware/Route Handlers/Server Actions can write the rotated cookie — a Server Component render can't. Sessions now survive up to 30 days instead of forcing a re-login every 15 minutes. See `docs/subjects/authentication-and-sessions.md` for the full flow and why a reactive retry-on-401 design was rejected in favor of this proactive one. |
| **Peer-to-peer send** | The Wallet App's core "transfer money" flow (FR-Auth-1) | Still open. Today's transaction/collect endpoints only credit/debit the *caller's own* virtual account. |
| **2FA endpoints** | Security settings screen, FR-8 | Still open. Settings → Profile only exposes change-password, which is real. |
| **Transaction PIN on settlements** | A PIN-gated Withdraw in the Wallet App (mobile design 08) | `POST /settlements` takes no PIN, unlike `/transfers`. The app confirms explicitly instead of showing a PIN pad the backend wouldn't check. |
| **Phone-number login** | Mobile sign-in as designed (phone + password) | `LoginRequest` is email-only; the Wallet App signs in by email until this exists. |
| **Payer / counterparty name on transactions** | Naming rows and receipts by who paid (mobile designs 02, 06, 07) | `TransactionResponse` has no display name, so rows are titled by kind ("Payment received", "Transfer sent"). |
| **`GET /temporary-accounts/{id}`** | Cheap status polling on the one-time account screen | No read-by-id; the app polls the list every 5s while the account is ACTIVE and picks its row out. |
| ~~**Password-reset email delivery**~~ **Resolved** | — | `ForgotPasswordResponse` no longer carries a token; `AuthService#forgotPassword` emails a `/reset-password?email=...&token=...` link via `EmailGateway` instead. `ResetPasswordRequest`/`ChangePasswordRequest` both gained a `confirmNewPassword` field, checked server-side. |
| **Notification delivery beyond email** | In-app/push notification screen, FR-Notif-1 | Invite emails and password-reset emails now send for real via `EmailGateway`/`SmtpEmailGateway` (best-effort, logged on failure). No general in-app/push notification system yet. |
| **Reporting/statement export (FR-Report-1)** | Reports screen | No reporting module/endpoints exist yet. |
| **Audit log read endpoint** | Admin "Audit Logs" screen (doc 4 §C.5) | `UserChangeLog`/activity logging exists in the design (doc 2 §4.2) but there's no `GET` surface for the frontend to read it back. |
| **Consistent pagination** | Predictable `<DataTable>` behavior across every list screen | See doc F6 — several list endpoints (API Keys, Bank Accounts, Dynamic Accounts, Payment Links, Settlement Accounts, Virtual Accounts) are paginated but don't yet support `term` search. The new KYC Documents and Team Invitations endpoints add to the "no pagination at all" group instead (plain arrays) — reasonable given the bounded item counts (4 document types; a business's own team is small), but worth a conscious call, not an oversight, when someone next touches either. |
| **Admin/superadmin cross-business views** | SUPERADMIN portal screens (FR-3, doc 4 §C.4) | Every current list endpoint scopes to the caller's own business/virtual account; there's no "list all businesses" / "list all transactions platform-wide" surface for the analytics dashboard FR-3 describes. |
| ~~**Invited-teammate 403s crashing Server Components**~~ **Fixed frontend-side, not a backend gap** | Any page an invited teammate visits that calls an owner/role-gated endpoint | Found live: a team member who accepted an invite hit an unhandled `ApiError` crash on `/dashboard`, because none of the `ADMIN`/`DEVELOPER`/`ACCOUNT_OFFICER` role templates (doc F6) grant `business:kyc-manage`, and `DEVELOPER` grants neither `virtualaccounts:read` nor `transactions:read` — all correct backend-side (those *are* owner/role-scoped on purpose), but `computeOnboardingStatus()` and the dashboard home page called them unguarded in a Server Component, where an uncaught rejection crashes the whole render instead of failing one query in isolation the way a client-side hook would. Fixed by wrapping every such call in `apps/web/src/server/safe-call.ts`'s `safeCall()`, which degrades a `401`/`403` to `undefined` (re-throwing anything else) instead of crashing — `computeOnboardingStatus()` then treats an inaccessible check as "done, don't nag a teammate with a checklist they have no permission to act on," and the dashboard's transaction/balance cards render an explicit "your role doesn't include this" state instead of data. **Any new Server Component that calls an owner-or-role-gated endpoint needs the same wrapper** — this is a pattern to repeat, not a one-off fix. |

---

## Chapter F10 — Roadmap

Mirrors the backend's own release-tagged requirements table (doc 1 §6), so frontend and backend releases stay legible against each other.

| Release | Theme | Depends on | Status |
|---|---|---|---|
| **FE v0.1 — Console shell + full onboarding** | Auth (signup/login/forgot/reset/change-password), the full onboarding wizard (business details, KYC upload, team invites, API keys/webhooks, review), dashboard shell, Settings (Profile/Contact/Team/API Keys), Virtual Account balance display, filterable/paginated Transactions + analytics | Backend v0.1 — CORS wasn't actually a blocker, see doc F9's revised note | **Built** (`apps/web`) |
| **FE v0.1.x — Settlement, links & dynamic accounts** | Bank Accounts / Settlement Accounts / Settlements / Payment Links / Dynamic Accounts screens (beyond the API Keys work already shipped in v0.1 above) | Backend v0.1.x (already implemented backend-side) | Not started |
| **FE v0.2 — Team, processors, reconciliation views** | Payment Processor config (Supply Admin), reconciliation-mismatch review screen (Team & Roles UI already shipped in v0.1 above, against a real `POST /api/v1/roles`) | Backend v0.2 (FR-6, FR-7, FR-Recon-1/2, FR-5a) | Not started |
| **FE v0.3 — Wallet App launch, reporting, offline hardening** | Consumer Wallet App v1 — the backend's KYC/onboarding endpoints are already there to build against (doc F6); still needs peer-to-peer send (doc F9) for the core transfer flow. Also: Reports screen, full offline-outbox rollout (doc F5) | Backend v0.3 (FR-Notif-1, FR-Report-1, NFR-2, NFR-10) + doc F9's remaining send/2FA/reporting gaps | Mobile is scaffolded only (`apps/mobile`) |
| **FE v1.0 — Multi-currency** | Currency selector, FX-aware amount displays | Backend v1.0 | Not started |
