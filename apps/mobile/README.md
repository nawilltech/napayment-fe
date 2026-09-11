# Nawill Pay — Consumer Wallet App (scaffold)

Expo (React Native) + TypeScript. Scaffold only, per
[`docs/nawill-pay-frontend.md`](../../docs/nawill-pay-frontend.md) doc F10 —
real screens land in FE v0.3. See that document's doc F3 for why Expo/React
Native was chosen over Flutter, and doc F7 for the intended screen list.

## Running

From the repo root:

```bash
npm run dev:mobile   # or: cd apps/mobile && npm start
```

Then press `i` (iOS simulator), `a` (Android emulator), or `w` (web) in the
Expo CLI, or scan the QR code with Expo Go.

## Structure

```
src/app/            expo-router file-based routes (currently just a placeholder home screen)
src/components/     themed-text / themed-view - the only two components kept from the default template
src/constants/      Colors (hand-synced with packages/ui-tokens - see the note in theme.ts)
src/hooks/          use-color-scheme, use-theme
```

## Next steps (not done yet)

- Wire `@napayment/api-client` and `@napayment/schemas` as dependencies once
  real screens are built — Metro's default config does not transpile
  TypeScript from workspace packages the way Next.js's `transpilePackages`
  does, so `metro.config.js` will need `resolver.nodeModulesPaths`/`watchFolders`
  adjustments first. Left as a follow-up rather than guessed at untested here.
- NativeWind, for Tailwind-syntax parity with the web app's tokens (doc F3
  ADR-FE-6) — not installed yet.
- `expo-secure-store` / `expo-local-authentication` for token storage and
  app-lock (doc F3 ADR-FE-7) — not installed yet.
