# Nawill Pay Frontend — Developer Handbook

Start here if you're new to this repo. This is the onboarding path: what each
technology is, **why it was chosen for this project specifically** (not just
"it's popular"), where it's used in the actual code, and where to read more.

This complements, rather than replaces, [`docs/nawill-pay-frontend.md`](../nawill-pay-frontend.md)
— that document is the full architecture handbook (formal ADRs, the complete
API reference, the roadmap). This one is the faster on-ramp: read this first,
then go deep on `nawill-pay-frontend.md` for any topic once you need the
full picture. Every subject below links to the relevant chapter there.

## Reading order

If you're completely new, read in this order:

1. **[Directory map](#directory-map)** (below) — get your bearings
2. [`nextjs-and-app-router.md`](./nextjs-and-app-router.md) — the web framework
3. [`authentication-and-sessions.md`](./authentication-and-sessions.md) — how login/sessions work
4. [`api-integration-and-backend-proxy.md`](./api-integration-and-backend-proxy.md) — how the frontend talks to the Java backend
5. [`state-management-and-data-fetching.md`](./state-management-and-data-fetching.md) — server vs. client state
6. [`forms-and-validation.md`](./forms-and-validation.md)
7. [`design-system-and-styling.md`](./design-system-and-styling.md)
8. [`security.md`](./security.md)
9. [`monorepo-and-tooling.md`](./monorepo-and-tooling.md)
10. [`mobile-app.md`](./mobile-app.md) — what exists so far (scaffold only)

## Quick tech-stack reference

| Concern | Technology | Why (one line) | Details |
|---|---|---|---|
| Web framework | Next.js 15 (App Router) | SSR + Server Components matter on the poor network conditions this platform targets; a Route Handler doubles as our auth proxy | [→](./nextjs-and-app-router.md) |
| Language | TypeScript | Shared, typed contracts between the API client, forms, and UI — the backend's own DTOs are mirrored, not guessed at | everywhere |
| Auth/session | httpOnly session cookie + a Next.js BFF | The backend's JWT never touches browser JS; server-to-server calls sidestep the backend's missing CORS config | [→](./authentication-and-sessions.md) |
| Server-state cache | TanStack Query v5 | Retry/cache semantics map directly onto the backend's idempotency-key design | [→](./state-management-and-data-fetching.md) |
| Forms & validation | React Hook Form + Zod | Client-side validation mirrors the backend's own Bean Validation constraints, field for field | [→](./forms-and-validation.md) |
| Styling | Tailwind CSS v4 + Radix UI primitives | Full control over the brand look; Radix gives accessible unstyled behavior (dialogs, tabs, dropdowns) for free | [→](./design-system-and-styling.md) |
| Icons | lucide-react | Consistent, tree-shakeable icon set already used throughout | — |
| Toasts | sonner | Small, unopinionated toast library for mutation feedback | — |
| Monorepo | Turborepo + npm workspaces | One repo for the web app, the (scaffolded) mobile app, and shared packages | [→](./monorepo-and-tooling.md) |
| Mobile | Expo (React Native) | Scaffolded only — see doc for why Expo was chosen ahead of building real screens | [→](./mobile-app.md) |

## Directory map

```
napayment-fe/
├── apps/
│   ├── web/                         Next.js 15 App Router — the Business Console (fully built)
│   │   ├── public/                  Static assets (logo.png)
│   │   └── src/
│   │       ├── app/                 Routes — see "App Router layout" below
│   │       ├── components/          React components, grouped by feature (see below)
│   │       ├── hooks/                TanStack Query hooks — one file per resource group
│   │       ├── lib/                  Browser-side helpers: api.ts (fetch wrapper), utils.ts (cn, formatters)
│   │       ├── server/                Server-only code: session.ts, backend-client.ts, safe-call.ts,
│   │       │                          onboarding-status.ts, route-helpers.ts
│   │       └── middleware.ts          Route protection (redirects unauthenticated users)
│   └── mobile/                       Expo (React Native) — scaffold only, see mobile-app.md
│
├── packages/
│   ├── api-client/                   Typed fetch wrapper over the napayment Java backend
│   │   └── src/
│   │       ├── types.ts              Every request/response DTO + enum, hand-mirrored from the backend
│   │       ├── http.ts               Low-level fetch (JSON, FormData, and binary-stream support)
│   │       └── client.ts             One function per backend endpoint, grouped by resource
│   ├── schemas/                      Zod validation schemas (forms), mirroring backend Bean Validation
│   └── ui-tokens/                    Shared design tokens (brand colors, spacing) — source of truth
│                                      for both apps' themes
│
├── docs/
│   ├── nawill-pay-frontend.md         The full architecture handbook (ADRs, API reference, roadmap)
│   ├── subjects/                      ← you are here — the developer onboarding path
│   └── api-contracts/                 Historical: contracts sketched before the backend implemented
│                                       them for real (see that folder's own README)
│
├── package.json / turbo.json          Workspace root — scripts, Turborepo pipeline
└── README.md                          Setup, running, git workflow
```

### `apps/web/src/app` — route layout (Next.js App Router)

```
app/
├── (auth)/                  Route group (no URL segment) — shared centered-card layout
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── reset-password/
├── onboarding/              The activation wizard (business details → KYC → team → API keys → review)
├── dashboard/               The signed-in app shell
│   ├── settings/            Profile / Contact / Team / API Keys tabs
│   └── transactions/        Filterable/paginated list + analytics
├── invite/[token]/          Public — accept a team invite (no session needed)
└── api/                     Route Handlers — see authentication-and-sessions.md and
                              api-integration-and-backend-proxy.md for what these do
```

### `apps/web/src/components` — grouped by feature, not by type

```
components/
├── ui/            Design-system primitives: Button, Input, Card, Dialog, Tabs, Badge, ...
├── auth/           Login/signup/forgot/reset forms
├── onboarding/     The activation wizard's step components + the shared stepper
├── dashboard/      Sidebar, header, and the transactions screen's pieces
└── settings/        Profile/Contact forms + the settings tab bar
```

`ui/` holds only generic, reusable primitives with no business logic. Everything
else is named after the feature it belongs to, and typically pairs one
component with one `hooks/use-*.ts` file that does its data fetching.
