# Treasury, Settlements & Transaction Security — UI Design

**Status update (2026-09-13):** the transaction PIN (§4.6) and its first
consumer are now live — see Settings → Security and the new **Send Money**
screen (`/dashboard/send`). The PIN's first real gated action turned out to
be peer-to-peer wallet transfer (a new feature this doc didn't originally
scope, since the backend built it first), not settlement/payout gating —
the PIN mechanism itself (`POST /api/v1/auth/transaction-pin`, `docs/api-
contracts/transaction-pin.json`) is unchanged and will gate §4.1/§4.2's
sensitive actions the same way once those land. Everything else below
(§4.1–§4.5, §4.7, §4.8) is still design-only, not yet built.

**Status: draft, pre-implementation** (for everything except the transaction
PIN and Send Money, noted above). **Scope: frontend/UI only.** The backend for this phase (real NIP
disbursement, the collection account's real-bank link, transaction PIN
endpoints) is being built by a separate agent in parallel — this doc does not
specify backend architecture, gateways, or schema. Where a backend contract
is required and doesn't exist yet, it's marked **PROPOSED — needs backend
confirmation** rather than designed in detail.

This is the next development phase after onboarding (doc
`nawill-pay-frontend.md`, chapters F1–F10): the Business Console's money-
movement surface — bank accounts, payout splits ("subaccounts"), settlements,
payment links, temporary accounts — plus a new **transaction PIN** security
layer gating the sensitive actions among them.

---

## 1. Audit — what already exists

Before designing anything, here's what the backend already has, verified by
reading the source directly (not assumed from docs). This matters because
most of the money-movement domain model is **already built and stable** —
this phase is much more "expose existing capability in the UI" than "wait
for new backend work," except where called out.

| Concept | Backend state today | Where |
|---|---|---|
| **Collection Account** | A single pooled ledger row (bank id, account number/name, `balance`) that every virtual-account credit/settlement-debit mirrors against. Enforced as a DB-level singleton (`status = ACTIVE` partial unique index). Admin-only (`collection-account:manage`). **Not connected to a real bank today** — it's a bookkeeping mirror, not a live account balance. | `payments/collectionaccount/*` |
| **Sandbox settlement gateway** | `SandboxSettlementGateway` always "succeeds" synchronously with a fake reference. **No real NIBSS NIP call happens anywhere in this codebase yet.** The disbursement is modeled behind a `SettlementGateway` interface, so a real implementation can be dropped in later without touching `SettlementService`. | `payments/settlement/SandboxSettlementGateway.java`, `SettlementGateway.java` |
| **Settlement Accounts ("subaccounts")** | This *is* the subaccount/split feature. A `VirtualAccount` can have several `SettlementAccount` rows, each pointing at a `BankAccount` with a `splitPercentage` (0.01–100.00). Sum of active splits for one virtual account is capped at 100% (row-locked to prevent a race). Settling disburses proportionally across all configured splits; the last split absorbs the rounding remainder. `autoSettle` is a per-virtual-account boolean toggle. | `payments/settlement/SettlementAccount.java`, `SettlementAccountService.java`, `SettlementService.java` |
| **Bank Accounts** | A business's registered external accounts (the settlement destinations). Name-resolved against a real bank via Paystack's account-resolve API before being trusted (`bankverification/PaystackBankVerificationGateway`) — not a rubber stamp. | `payments/bankaccount/*`, `payments/bankverification/*` |
| **Settlements (disbursement runs)** | A settlement run produces one `Settlement` row per settlement account, each with its own status (`PENDING → PROCESSING → COMPLETED/FAILED`) and reference. Triggerable manually (`POST /settlements`) or automatically on credit if `autoSettle` is on. | `payments/settlement/Settlement.java`, `SettlementService.java` |
| **Payment Links** | Shareable pay links, fixed or payer-entered amount, single-use or reusable, optional expiry. Short code doubles as the URL. | `payments/paymentlink/*` |
| **Temporary/Dynamic Accounts** | Per-transaction, expiring account numbers minted against a business's real virtual account — solves bank-transfer reconciliation (no more trusting free-text narration). Statuses: `ACTIVE / PAID / EXPIRED / REVOKED`. A `simulate-deposit` endpoint stands in for the real inbound NIP webhook. | `payments/dynamicaccount/*` |
| **Payment Processors** | Admin-configured processor integrations (`processors:configure`/`:read`). `SandboxPaymentProcessorGateway` is the only implementation today — same "interface + sandbox now, real later" pattern as settlement. This is a platform-ops concern, not something a business self-serves. | `payments/processor/*` |
| **Transaction PIN** | **Does not exist anywhere in the backend** — confirmed by grep across the whole codebase, not just an oversight in one file. This is new ground for both frontend and backend. | — |
| **RBAC visibility on the frontend** | `GET /api/v1/users/me` returns no `permissions`/`roles` field today — the frontend has no way to know which of the above a given user can actually do without trying and catching a 403. This blocks clean nav-item/button gating for everything below. **Dependency on the backend agent** — see §7. | `packages/api-client/src/types.ts` `UserResponse` |
| **Test/Live mode toggle** | Already built as a UI-only, `localStorage`-persisted switch (`components/dashboard/mode-toggle.tsx`) — its own code comment already flags that there's no backend endpoint yet to actually switch which environment (test vs. live processor/collection-account config) requests hit. This phase is what will eventually give that toggle a real backend meaning. | `apps/web/src/components/dashboard/mode-toggle.tsx` |

**Direct answer to "do we have a sandbox mirroring the central collection
account tied to a real bank account, with NIP debit"**: not yet. Today's
`CollectionAccount` is a pooled ledger balance with no live bank connection,
and `SandboxSettlementGateway` never makes a real NIBSS call — disbursement
"succeeds" unconditionally. Wiring an actual bank account + real NIP debit is
backend work in progress elsewhere; this doc's job is to make sure the UI is
built in a way that doesn't need to change shape once that lands (see the
`provider`/environment fields flagged as proposed in §7).

The `api-client` package (`packages/api-client/src/client.ts`) already has
fully-typed methods for **every** endpoint above — `bankAccounts`,
`settlementAccounts`, `settlements`, `collectionAccount`, `paymentLinks`,
`dynamicAccounts`, `paymentProcessors`. **Zero of them are wired to a Route
Handler or a screen yet.** This phase is closing that gap, not building the
client layer from scratch.

---

## 2. Design goals

1. **Paystack's Balances/Subaccounts/Settlements UX stays the reference**
   (as it has been for onboarding) — a business owner already fluent in that
   mental model should feel at home here.
2. **Splits are visual, not just numeric.** A business configuring payout
   splits needs to *see* "83% allocated, 17% unallocated" at a glance, not
   compute it from a list.
3. **Every money-moving action is PIN-gated**, consistently, through one
   reusable component — not five different ad-hoc confirmation dialogs.
4. **Sandbox is never silently indistinguishable from live.** Every screen
   that touches settlement/disbursement carries a visible environment
   indicator, because a real bank debit and a fake one look identical in the
   API response shape (`successful: true` either way) — the UI is the only
   place a user can tell them apart until the backend adds a real field.
5. **RBAC-aware, but degrade gracefully.** Until the backend exposes
   permissions, hide nothing by default (every seeded business role already
   gets these via existing permission strings on relevant screens per
   role) — but *do* catch 403s cleanly with the existing `safeCall`/route
   pattern rather than crashing.

---

## 3. Information architecture

New top-level sidebar section, **"Payouts"** (keeps "Transactions" reserved
for the ledger view it already owns):

```
Dashboard
├── Home
├── Transactions            (existing)
├── Payouts                 (new)
│   ├── Settlement Accounts    /dashboard/payouts/settlement-accounts
│   ├── Settlements            /dashboard/payouts/settlements
│   ├── Bank Accounts          /dashboard/payouts/bank-accounts
│   ├── Payment Links          /dashboard/payouts/payment-links
│   └── Temporary Accounts     /dashboard/payouts/temporary-accounts
├── Activation (onboarding)  (existing)
└── Settings                 (existing)
    ├── Profile / Contact / Team / API Keys   (existing)
    └── Security                (new — transaction PIN lives here)
```

A platform-admin-only surface (**not** in the Business Console nav — visible
only to `SUPERADMIN`/`ADMIN` user types, mirroring how `collection-
account:manage` is unassigned to any seeded business role):

```
/admin/treasury          — Collection Account status (see §4.7)
/admin/payment-processors — Payment Processor list/config (see §4.8)
```

Rationale for a separate `/admin` area rather than folding it into
`/dashboard`: `CollectionAccount` and `PaymentProcessor` are platform-wide,
singleton/few-row concepts, not scoped to the caller's business the way
everything else in `/dashboard` is — mixing them into the Business Console
nav would misrepresent them as something a normal business user should ever
see reference to.

---

## 4. Screens

### 4.1 Settlement Accounts ("Payout Splits")

**Route:** `/dashboard/payouts/settlement-accounts`
**Backend:** `settlementAccounts.list/create`, `toggleAutoSettle`; reads
`bankAccounts.list` to populate the destination picker.

- Header stat bar: total allocated (`Σ splitPercentage`) as a horizontal
  stacked bar, one segment per settlement account, colored per the app's
  categorical palette, with a visibly distinct "Unallocated" trailing
  segment when the sum is under 100%. This is the single most important
  visual on the page — it's the answer to "where does my money go."
- Below it, a list (card or compact table, matching `TransactionTable`
  density) of each settlement account: destination bank + masked account
  number + account name, split %, and a remove action.
- "Add split" opens a form: pick from the business's existing Bank Accounts
  (link out to §4.3 if none exist yet — don't dead-end), enter a percentage.
  Disable the percentage input's ability to exceed the remaining
  unallocated amount client-side (mirrors the backend's own 100% cap, but
  the backend call is still the source of truth — surface its
  `SPLIT_PERCENTAGE_EXCEEDED` error verbatim if a race loses).
- **Auto-settle toggle**, prominent, top-right, same visual language as the
  existing test/live mode pill (`mode-toggle.tsx`) — colored, iconed,
  single click. Copy: "Auto-settle: on every collection, your configured
  splits are paid out automatically. Off: payouts only happen when you
  trigger one." Toggling this with zero settlement accounts configured
  should be disabled with an inline explanation, not a silent no-op.
- **PIN-gated:** adding/removing a split, and toggling auto-settle. These
  change where a business's money goes — irreversible-in-spirit enough to
  warrant PIN confirmation per design goal 3.

### 4.2 Settlements (disbursement history + manual trigger)

**Route:** `/dashboard/payouts/settlements`
**Backend:** `settlements.trigger`; a list endpoint doesn't exist in
`client.ts` yet (only `trigger` is modeled) — **this screen needs a
`GET /api/v1/settlements` list endpoint that isn't in the current
`api-client`, flagged for the backend agent in §7.** Don't block the rest of
this phase on it; build the trigger flow first, the history table once the
list endpoint exists.

- "Withdraw now" primary action: amount field (optional — defaults to full
  available balance, mirroring `SettlementService.settle`'s own
  `requestedAmount == null` behavior), PIN-gated, then shows the resulting
  per-split breakdown returned by `POST /settlements` (one row per
  `SettlementResponse`, with its own status/reference) as an immediate
  receipt — don't just toast "success" and discard the response, the
  per-split detail is exactly what a business wants to see happened.
- History table (once the list endpoint exists): date, total amount,
  per-split status badges (`PENDING`/`PROCESSING` = neutral, `COMPLETED` =
  success, `FAILED` = danger — reuse the badge component from
  `TransactionTable`), reference. A `FAILED` row needs a visible reason if/
  when the backend starts surfacing one (today `SandboxSettlementGateway`
  never fails, so there's nothing to show yet — leave a `reason` column
  ready but tolerant of `null`).
- Empty state when no settlement accounts are configured: don't show an
  empty "Withdraw now" that will just 400 with `NO_SETTLEMENT_ACCOUNTS` —
  redirect the empty state itself to "You need a settlement account before
  you can withdraw" with a link to §4.1.

### 4.3 Bank Accounts

**Route:** `/dashboard/payouts/bank-accounts`
**Backend:** `bankAccounts.create/list/resolve`; `referenceData.listBanks`
for the bank picker.

- List: bank name + logo (reference-data likely has bank codes — reuse
  whatever `BankResponse` already exposes; fall back to initials if no
  logo asset exists), masked account number, verified account name.
- Add flow, matching the **exact** resolve-then-confirm pattern KYC already
  uses for BVN/CAC (doc F6): bank picker → account number → call
  `bankAccounts.resolve` → show the resolved name back to the user *before*
  they submit, so a typo'd account number is caught before it's saved, not
  after a payout silently goes to the wrong name. This is the same UX
  Paystack uses for exactly this reason.
- **Not PIN-gated on its own** — adding a bank account doesn't move money;
  it only becomes sensitive once it's attached to a split (§4.1 gates that).

### 4.4 Payment Links

**Route:** `/dashboard/payouts/payment-links`
**Backend:** `paymentLinks.create/list/revoke`; the public
`resolve`/`pay` pair belongs to the **payer-facing** page, not the
dashboard (see §4.4a).

- List/create, mirroring API Keys' existing card layout: short code shown
  as a full copyable URL (`{origin}/pay/{shortCode}`), amount (or "Payer
  sets amount"), type/expiry/single-use badges, status (`ACTIVE` /
  `REDEEMED` / `EXPIRED` / `REVOKED`).
- Create form: fixed-amount vs. open-amount toggle, optional expiry date
  picker, single-use checkbox.
- Revoke is a destructive action on a business asset (breaks a link that
  may be posted publicly) — confirm with a plain dialog; **not** PIN-gated
  (it stops money moving, it doesn't move any) but should still ask "are
  you sure," since a live link may be shared externally.

**4.4a — Public pay page** (`/pay/[shortCode]`, no auth, new route group):
out of scope for this doc's Business Console focus, but flagged so it's not
forgotten — needs its own lightweight design pass before payment links are
usable end-to-end. Not PIN-gated (the payer isn't a Nawill Pay user).

### 4.5 Temporary Accounts

**Route:** `/dashboard/payouts/temporary-accounts`
**Backend:** `dynamicAccounts.create/list/simulateDeposit`.

- List: minted account number, expected amount (or "any amount"), expiry
  countdown, status badge (`ACTIVE`/`PAID`/`EXPIRED`/`REVOKED`).
- "Mint account" form: expected amount (optional), expiry duration picker
  (sensible presets: 15 min / 1 hr / 24 hr, plus custom).
- **"Simulate deposit" is a test-mode-only affordance** — this is exactly
  what the existing `mode-toggle.tsx` test/live switch should gate: render
  the simulate button only when the mode toggle reads "Test Mode," and
  replace it with nothing (not a disabled button — just absent) in "Live
  Mode," since the backend comment on `simulate-deposit` is explicit that
  it's a stand-in for a real inbound NIP webhook, not something a live
  business should ever trigger themselves. This is the first place in the
  app where that toggle gates real UI behavior instead of being purely
  cosmetic.
- Not PIN-gated — minting doesn't move money, and simulate-deposit only
  exists in test mode.

### 4.6 Settings → Security (Transaction PIN)

**Route:** `/dashboard/settings/security` (new tab in the existing
`SettingsTabs`).

- **First-time set-up state:** no PIN configured yet. Card explaining what
  a transaction PIN is for ("An extra 4-digit code required before you
  withdraw funds, change your payout split, or trigger other sensitive
  actions — even if someone is signed into your account.") with a "Set
  PIN" CTA.
- **Set/Change PIN flow:** a `PinInput` component (see §5) — 4 boxed
  digits, numeric keypad on mobile (`inputMode="numeric"`), auto-advance
  between boxes, matching the visual weight of the existing password-
  requirements checklist work. Require re-entry to confirm (same pattern
  as signup's `confirmPassword`), plus the account password (or, once set,
  the current PIN) to authorize the change — exact requirement is the
  backend agent's call (§7 proposes both).
- Once set: show "PIN last changed {date}" (no way to view the PIN itself,
  obviously) with a "Change PIN" action that re-runs the same flow.
- **Do not water down mobile.** This screen's flow is exactly what
  `apps/mobile`'s scaffold should reuse verbatim once that app is built out
  — a boxed-digit PIN entry is *the* standard mobile fintech pattern, so
  design it mobile-first even though it ships on web first.

### 4.7 Admin: Collection Account (`/admin/treasury`)

Visible only to `ADMIN`/`SUPERADMIN` user types (client-side gate today via
`userType` from `/users/me`, which already exists — no new backend
dependency for *visibility*, only for the environment badge described next).

- Single-record view (there's only ever one active `CollectionAccount`):
  bank, account number/name, running `balance` (formatted as currency, not
  raw kobo/naira integer).
- **Environment badge** — "Sandbox" vs. "Live," styled like the existing
  test/live mode pill. This is the concrete answer to design goal 4: once
  the backend agent's real-bank/NIP work lands, this is the one place an
  admin can confirm collection is actually hitting a real account and not
  the sandbox gateway. **Needs a backend field to bind to — proposed in
  §7, not yet available.** Until it exists, render the badge as "Sandbox"
  unconditionally with a tooltip explaining why (no real bank wired up
  yet) rather than fabricating a live/test distinction the API can't back.
- No create/edit form here in this phase — `CollectionAccountController`'s
  create is a one-time bootstrap operation (enforced singleton), not a
  recurring admin task; a raw "create" form would invite someone to
  accidentally trip the "already active" conflict. If a re-point-to-a-
  different-bank flow is needed later, that's a deliberate follow-up, not
  part of this pass.

### 4.8 Admin: Payment Processors (`/admin/payment-processors`)

Same `ADMIN`/`SUPERADMIN`-only visibility as §4.7.

- Simple list (name, status) + activate/deactivate. Given
  `SandboxPaymentProcessorGateway` is the only implementation today and
  processor selection has no other configurable fields yet
  (`PaymentProcessor` is just a name + status), this can be the smallest
  screen in the whole phase — a table and a status toggle, nothing more.
  Resist the urge to build out a bigger configuration UI for fields that
  don't exist on the backend yet.

---

## 5. New shared components

| Component | Purpose | Notes |
|---|---|---|
| `PinInput` | 4-digit boxed entry, used for both *setting* a PIN (Settings → Security) and *confirming* one (the modal below). | Mirrors `PasswordInput`'s existing show/hide affordance conceptually, but digits-only, auto-advancing focus, `inputMode="numeric"` for mobile keypads. |
| `PinConfirmDialog` | The one reusable "confirm with your PIN" modal every sensitive action in §4.1/§4.2 opens before submitting. | Takes a `onConfirm(pin)` callback; caller owns the actual mutation. Shows the same lockout-after-N-attempts messaging pattern the login flow already established for failed passwords, once the backend defines the failure behavior (§7). |
| `SplitAllocationBar` | The stacked-segment "83% allocated / 17% unallocated" visual for §4.1. | Follow the dataviz skill's categorical-color rules (fixed hue order, never cycled) if this repo's design tokens are wired up for it by then; otherwise a plain two-tone bar (allocated vs. unallocated) is a fine v1. |
| `EnvironmentBadge` | The Sandbox/Live pill reused across §4.2's settlement rows and §4.7. | Thin wrapper sharing styling with the existing `mode-toggle.tsx` pill rather than a divergent one-off. |
| `MaskedAccountNumber` | Shows a bank account number as `••••1234`, click-to-reveal. | Used in §4.1, §4.3. Small, but worth one shared component rather than five inline slice-and-mask implementations. |

Hooks to add (TanStack Query, mirroring `use-transactions.ts`/
`use-onboarding.ts` conventions exactly — one file per resource):
`use-bank-accounts.ts`, `use-settlement-accounts.ts`, `use-settlements.ts`,
`use-payment-links.ts`, `use-dynamic-accounts.ts`, `use-transaction-pin.ts`,
and admin-only `use-collection-account.ts`, `use-payment-processors.ts`.

Route Handlers needed (BFF proxy, one per `api-client` method, same
`parseBody`/`handleRouteError` pattern every existing route already
follows): under `apps/web/src/app/api/bank-accounts/`,
`settlement-accounts/`, `settlements/`, `payment-links/`,
`temporary-accounts/`, `transaction-pin/`, and admin-scoped
`collection-account/`, `payment-processors/`. Not enumerated endpoint-by-
endpoint here since they're a 1:1 mechanical mapping of what `client.ts`
already exposes — the interesting design work is in the screens above, not
the proxy layer.

---

## 6. Cross-cutting UX rules for this phase

- **PIN-gated action list** (so it's explicit, not left to per-screen
  judgment calls later): trigger a manual settlement (§4.2), add/remove a
  settlement account or toggle auto-settle (§4.1), change the transaction
  PIN itself. **Not** PIN-gated: adding a bank account, creating a payment
  link or temporary account, revoking a payment link — none of these move
  money by themselves.
- **Every currency amount** renders through the same formatter already
  used in `TransactionTable`/`TransactionAnalytics` — don't introduce a
  second currency-formatting convention in this phase's new screens.
- **Empty states link forward, not just explain.** A business with no bank
  accounts hitting the Settlement Accounts screen should be routed toward
  adding one, not just told "you have none" (see §4.1, §4.2).
- **403s degrade to an inline "you don't have access" card**, not a crash
  — same `safeCall`-style handling as onboarding's status checks, applied
  to every new BFF route, since permission gating on the frontend is
  currently reactive-only (§7).

---

## 7. Open questions / dependencies for the backend agent

These are things this UI design assumes or needs, called out explicitly so
they can be confirmed or corrected without this doc guessing at backend
internals:

1. **`GET /users/me` (or a new endpoint) should expose the caller's
   resolved permissions** (e.g. `permissions: string[]`, matching the
   existing `@auth.can('...')` strings like `settlements:manage`,
   `paymentlinks:read`). Without this, every nav item and button in this
   phase can only be gated reactively (try the call, hide on 403) rather
   than proactively — workable, but a materially worse UX (a business
   sees a "Settlements" nav item, clicks it, then gets bounced).
2. **`GET /api/v1/settlements` (list) doesn't exist yet** — only the
   trigger (`POST`) is modeled in `api-client`. §4.2's history table needs
   it (business-scoped, paginated, matching the convention every other
   list endpoint in this codebase already follows).
3. **Transaction PIN contract** — proposed in
   `docs/api-contracts/transaction-pin.json` alongside this doc, using the
   same "sketch a contract for review" convention established during
   onboarding (see `docs/api-contracts/README.md`). Two shapes proposed
   there for the backend agent to pick between: (a) each sensitive
   endpoint takes the raw PIN inline, or (b) a short-lived
   `pinVerificationToken` obtained once from a `POST .../transaction-pin/
   verify` call and attached to the sensitive request after. **(b) is the
   recommended shape** — it means `SettlementService`, settlement-account
   mutations, etc. don't each need their own PIN-checking logic
   duplicated; one verification endpoint issues a token, everything else
   just checks for its presence. But this is the backend agent's call to
   make, not this doc's.
4. **An environment/provider field on `CollectionAccountResponse`**
   (e.g. `provider: "SANDBOX" | "NIBSS_LIVE"`, or similar) so §4.7's badge
   has something real to bind to once the real-bank integration lands,
   rather than the UI having to infer it from indirect signals.
5. **Settlement failure reasons** — `SettlementStatus.FAILED` exists today
   but nothing ever produces it (`SandboxSettlementGateway` always
   succeeds). Once a real NIP integration can fail (insufficient
   collection-account funds, invalid destination, NIBSS timeout, etc.),
   surfacing *why* on the `Settlement`/`SettlementResponse` would let
   §4.2's history table show something actionable instead of a bare
   "Failed" badge.

---

## 8. Suggested build order

1. Bank Accounts (§4.3) — nothing else in this phase functions without at
   least one existing; also the lowest-risk screen (no PIN gating, no
   money movement).
2. Settlement Accounts (§4.1) — depends on §1.
3. Transaction PIN setup (§4.6) + the shared `PinInput`/`PinConfirmDialog`
   components (§5) — needed before §4 below can be PIN-gated for real.
4. Settlements trigger + history (§4.2), gated by the PIN component from
   step 3.
5. Payment Links (§4.4) and Temporary Accounts (§4.5) — independent of
   each other and of 1–4, can be built in either order or in parallel.
6. Admin screens (§4.7, §4.8) — lowest priority; small surface area, and
   §4.7's most useful element (the environment badge) can't be finished
   until the backend agent's real-bank work lands anyway.
