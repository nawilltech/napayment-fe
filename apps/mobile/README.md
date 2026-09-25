# Napayment — Wallet App

Expo (React Native) + TypeScript, built from the Napayment mobile design
(`docs/Nawill Technology branding/Napayment Mobile.dc.html`). Calls the backend
directly (doc F4) through `@napayment/api-client`, validates with the same
`@napayment/schemas` as the web console.

## Running

```bash
cp .env.example .env.local   # point EXPO_PUBLIC_API_BASE_URL at the backend
npm start                    # from apps/mobile
```

Press `i` / `a` for a simulator, or scan the QR code with Expo Go.

The scripts set `NODE_PATH=./node_modules`: web pins React 19.1 and mobile
19.2, so npm can't hoist mobile's React Native stack, and Expo CLI (hoisted to
the root) otherwise can't `require('expo-router')` for typed-route generation
and crashes on start.

## Screens

| Route | Design | Backend |
|---|---|---|
| `(auth)/sign-in`, `sign-up`, `forgot-password` | 01 | `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password` |
| `(tabs)/index` Home | 02 | `/users/me`, `/virtual-accounts`, `/transactions` |
| `collect/new` | 03 | `/temporary-accounts`, `/payment-links` |
| `collect/account/[id]` | 04 | `/temporary-accounts` (polled every 5s while active) |
| `(tabs)/collect` Payment links | 05 | `/payment-links` |
| `(tabs)/activity` | 06 | `/transactions`, `/transactions/analytics` |
| `transaction/[id]` Receipt | 07 | `/transactions/{id}` |
| `withdraw` | 08 | `/settlements`, `/settlement-accounts`, `/bank-accounts`, `/banks` |
| `send` (+ PIN sheet) | 08 | `/transfers/resolve`, `/transfers` |
| `queue` | 09 | local outbox |
| `(tabs)/profile`, `security/pin`, `security/password` | 10 | `/users/me`, `/auth/transaction-pin`, `/auth/change-password` |

Deviations from the design, and why:

- **Sign in takes email**, not phone — `LoginRequest` is email + password.
- **Withdraw has a confirm step, not a PIN pad** — `POST /settlements` takes no
  PIN, so a pad here would check nothing. The PIN sheet is used where the
  backend verifies it: Send.
- **Home's second action is Send**, not Pay link — Pay link is one tap away
  on the Collect tab, and transfers had no other entry point.
- **Rows are titled by what happened** ("Payment received", "Transfer sent") —
  `TransactionResponse` has no payer name.
- **Profile shows verified / pending**, not a KYC tier and daily limit — no
  endpoint returns those.

## Architecture

```
src/app/          expo-router routes; Stack.Protected switches (auth) / (app) on session
src/components/   UI kit - AppText (Plex Sans / Plex Mono / Special Elite), Button, Field,
                  Card/Row, StatusTag, LogoMark, ReceiptEdge, PinSheet, TabBar, ...
src/hooks/        queries.ts (TanStack Query per endpoint), use-session, use-online, use-outbox
src/lib/          api.ts (tokens + 401 refresh), query.ts (persisted cache), outbox.ts, format.ts
src/theme/        brand tokens - mirror packages/ui-tokens
```

- **Styling** is React Native `StyleSheet` over `src/theme`, not NativeWind
  (a deliberate departure from ADR-FE-6 — see doc F3 addendum).
- **Tokens** (ADR-FE-7): access + refresh token in `expo-secure-store`. Refresh
  tokens are single-use, so concurrent 401s share one refresh call; a rejected
  refresh signs the user out. On web (dev preview only) the session is kept in
  memory, never in browser storage.
- **Offline** (doc F5): queries persist to AsyncStorage (24h) so the last
  balance and history show immediately, flagged by the amber banner with the
  time they were fetched. Creating a payment link and withdrawing go through
  the outbox: an `Idempotency-Key` is minted at tap time, the mutation pauses
  while offline, survives an app restart, and replays on reconnect. Transfers
  (need the PIN, never written to disk) and one-time accounts (no idempotency
  key, a replay could mint a duplicate) are online-only.
