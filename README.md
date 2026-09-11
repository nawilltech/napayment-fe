# Nawill Pay — Frontend

Monorepo for Nawill Pay's two client surfaces, built against the
[`napayment`](../napayment) Java/Spring Boot backend:

- **`apps/web`** — the Business Console (Next.js). **Built out**: auth, the
  full business onboarding flow (business details, KYC upload, team invites,
  API keys/webhooks), dashboard shell, and Settings.
- **`apps/mobile`** — the Consumer Wallet App (Expo/React Native).
  **Scaffolded only** — see [`apps/mobile/README.md`](apps/mobile/README.md).

See [`docs/nawill-pay-frontend.md`](docs/nawill-pay-frontend.md) for the full
architecture handbook (framework decisions + rationale, state management,
API integration, screen inventory, roadmap) and
[`docs/api-contracts/`](docs/api-contracts/) for the suggested backend
contracts behind every screen that isn't backed by a real endpoint yet.

## Prerequisites

- Node.js 20.19+ (Expo's Metro bundler in `apps/mobile` warns below this —
  see [Known issues](#known-issues))
- npm 10+ (this repo uses npm workspaces, not pnpm/yarn)
- The `napayment` backend running locally — every screen calls a real
  endpoint now (see doc F9 for the small remaining set that doesn't exist
  yet) — see its own README for `docker compose up -d` + `./mvnw spring-boot:run`

## Getting started

```bash
# from the repo root
npm install                      # installs every workspace (apps/* and packages/*) in one pass
cp .env.example apps/web/.env.local   # point the web app at your local backend
```

## Running

```bash
npm run dev:web       # Next.js dev server at http://localhost:3000
npm run dev:mobile     # Expo CLI — press i/a/w for iOS/Android/web, or scan the QR code
npm run dev            # both, via Turborepo (turbo run dev)
```

Installing a package into just one workspace (don't run `npm install <pkg>`
from the root for an app-specific dependency):

```bash
npm install <package> --workspace=web       # or --workspace=mobile
npm install <package> --workspace=@napayment/schemas   # a shared package
```

## Building & checking

```bash
npm run build        # turbo run build — currently just apps/web (apps/mobile has no build script yet)
npm run typecheck     # turbo run typecheck
npm run lint          # turbo run lint
```

## Repository layout

```
apps/
  web/          Next.js 15 App Router — Business Console
  mobile/        Expo (React Native) — Consumer Wallet App (scaffold)
packages/
  api-client/    Typed fetch wrapper over the napayment backend (doc F6)
  schemas/       Zod validation schemas shared by both apps' forms
  ui-tokens/     Brand colors/spacing - single source of truth for both apps' themes
docs/
  nawill-pay-frontend.md   Architecture handbook
  api-contracts/            JSON contracts for backend endpoints that don't exist yet
assets/
  reference-screenshots/    Paystack UX reference captures — gitignored, local only
```

## Git workflow & branching

Mirrors the backend repository's own workflow
([`napayment/README.md`](../napayment/README.md#git-workflow--branch-protection)),
so contributors moving between the two repos don't context-switch conventions:

- **`dev`** is the default branch. All work targets it.
- **`main`** tracks production releases; `dev` merges into `main` at release time.
- Branch naming: `feature/<slug>`, `fix/<slug>`, `refactor/<slug>` (also
  `docs/<slug>`, `chore/<slug>` as needed) → PR into `dev`.
- Both `dev` and `main` should be branch-protected on GitHub once pushed: no
  direct pushes (PR required), required passing CI status check, no
  force-pushes/branch deletion. Configure via the GitHub UI or, matching the
  backend's own approach:
  ```bash
  gh api -X PUT repos/nawilltech/napayment-fe/branches/<branch>/protection \
    -f required_status_checks.strict=true \
    -f enforce_admins=true \
    -f required_pull_request_reviews.required_approving_review_count=0
  ```
- Commit messages: Conventional Commits (`feat:`, `fix:`, `refactor:`,
  `docs:`, `chore:`, `test:`), same convention as the backend.

Remote:

```bash
git remote add origin https://github.com/nawilltech/napayment-fe.git
```

## Known issues

- `apps/mobile`'s Metro/toolchain packages (`metro-core`, etc.) request Node
  `^20.19.4` — this environment ships `20.19.0`, one patch version behind.
  `npm install` succeeds with an `EBADENGINE` warning; hasn't been verified
  against an actual Metro bundle/run here. Upgrade Node before relying on
  `npm run dev:mobile` if you hit bundler issues.
- `npm audit` reports a moderate/high PostCSS advisory via `next`'s bundled
  copy (build-time only, not a runtime/production exposure) — fixable by
  upgrading to Next.js 16, which was deliberately not done yet (see doc F2 —
  Next 15 was chosen for a settled, well-documented API surface over the
  newest major).
