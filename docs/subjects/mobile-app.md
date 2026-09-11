# Mobile App

## Current status: scaffold only

`apps/mobile` is intentionally **not** a built-out app yet — it's a trimmed
Expo starter template, deliberately left minimal so real screens get built
against the app's actual needs rather than a generic template's demo
content. See `apps/mobile/README.md` for the specifics of what was kept/
removed from the default template, and
`nawill-pay-frontend.md` doc F7/F10 for the intended screen list and when
each is scheduled.

## Why Expo (React Native), not Flutter or native

The short version — full ADR in `nawill-pay-frontend.md` doc F3, ADR-FE-5:
**code sharing.** `packages/api-client` and `packages/schemas` (see
[`monorepo-and-tooling.md`](./monorepo-and-tooling.md)) are plain
TypeScript with no React import — they're written to work unchanged from
React Native once the mobile app actually consumes them. Flutter would mean
a second, parallel implementation of the API client, the validation rules,
and eventually the offline-mutation-queue logic, in Dart — real ongoing
duplication cost for a small team, for a wallet app where correctness and
validation-parity with the backend matter more than bespoke animation.
Native (separate Swift + Kotlin codebases) was rejected for the same
small-team reasoning, at 2–3x the cost.

Expo specifically (over bare React Native): [EAS Update](https://docs.expo.dev/eas-update/introduction/)
ships JS-only bug fixes over the air, without an app-store review cycle —
meaningful for a financial app where a broken screen needs a same-day fix.

## What's actually in the scaffold today

```
apps/mobile/src/
├── app/                 expo-router file-based routes — currently one placeholder screen
├── components/          themed-text.tsx, themed-view.tsx (kept from the default template)
├── constants/            theme.ts — brand colors hand-synced with packages/ui-tokens
└── hooks/                use-color-scheme, use-theme
```

Run it: `npm run dev:mobile` from the repo root, then `i`/`a`/`w` in the
Expo CLI for iOS/Android/web, or scan the QR with Expo Go.

## What's explicitly not wired up yet

- **`@napayment/api-client` / `@napayment/schemas` as dependencies.**
  Metro (React Native's bundler) doesn't transpile TypeScript from workspace
  packages the way Next.js's `transpilePackages` does — `metro.config.js`
  needs `resolver.nodeModulesPaths`/`watchFolders` configuration first. Left
  as a documented follow-up rather than guessed at without being able to
  test a real Metro bundle.
- **[NativeWind](https://www.nativewind.dev/)** — Tailwind syntax for React
  Native, for token parity with the web app's Tailwind config. Not
  installed; `constants/theme.ts` currently hand-duplicates the hex values
  from `packages/ui-tokens` instead.
- **`expo-secure-store` / `expo-local-authentication`** — Keychain/Keystore-
  backed token storage and biometric app-lock, the mobile equivalent of the
  web app's httpOnly-cookie session pattern (see
  [`authentication-and-sessions.md`](./authentication-and-sessions.md)).
  Not installed yet.

## When mobile is actually built out

Unlike the web app's BFF pattern (Next.js Route Handlers proxying the
backend to work around missing CORS and keep the JWT out of browser JS —
see [`authentication-and-sessions.md`](./authentication-and-sessions.md)),
the mobile app is expected to call the backend **directly** — a native app
has no browser CORS restriction, and `expo-secure-store` (once wired up)
gives it a JS-inaccessible-equivalent token store without needing a proxy
server in between. `packages/api-client` was written with this in mind: it
has zero Next.js dependency specifically so it works unchanged from either
call site.

## Further reading

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [Expo Router](https://docs.expo.dev/router/introduction/) (the file-based routing convention `apps/mobile/src/app/` uses)
- [NativeWind](https://www.nativewind.dev/)
- `nawill-pay-frontend.md` doc F3 (mobile framework ADRs), doc F7 (intended screen inventory), doc F10 (roadmap)
