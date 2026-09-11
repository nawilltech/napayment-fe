# Next.js & the App Router

## What it is

[Next.js](https://nextjs.org/docs) is a React framework that adds routing,
server-side rendering, and a server runtime on top of React. Version 15 uses
the **App Router** (the `src/app/` directory), which is built on [React
Server Components](https://react.dev/reference/rsc/server-components) — by
default, a component renders on the server and ships zero JavaScript to the
browser, unless it's explicitly marked `"use client"`.

## Why it's used here

Two reasons specific to this project, not just "it's the popular choice":

1. **Network conditions.** The backend's own spec (`docs/nawill-pay-frontend.md`
   doc F1) is designed around Nigeria's uneven connectivity. A traditional
   client-rendered SPA ships a blank page until its JS bundle downloads,
   parses, and fetches data — three round trips before anything useful
   appears. Server Components render the initial HTML on the server, so a
   read-only screen (a transaction table, a settlement list) can appear with
   near-zero client JS. This isn't a cosmetic choice here; it's a real UX
   difference on a slow connection.
2. **The BFF pattern needs a server runtime.** The backend has no CORS
   configuration, so the browser can never call it directly. Next.js's
   **Route Handlers** (`app/api/**/route.ts`) give us a server-side proxy for
   free, in the same framework and deploy target as the UI — see
   [`authentication-and-sessions.md`](./authentication-and-sessions.md) and
   [`api-integration-and-backend-proxy.md`](./api-integration-and-backend-proxy.md).

Full rationale, including the alternatives considered (a plain Vite SPA,
Remix) and why they were rejected: `nawill-pay-frontend.md` doc F2, ADR-FE-1.

## How it's used in this repo

- **Server Components by default.** Any page or layout in `apps/web/src/app/`
  without a `"use client"` directive at the top runs on the server. Look at
  `app/dashboard/page.tsx` — it calls the backend directly (via
  `authedBackendClient()`) inside the component function, no `useEffect`, no
  loading spinner for the initial render.
- **Client Components where interactivity is needed.** Anything with
  `useState`, event handlers, or a TanStack Query hook is marked
  `"use client"` at the top of the file — e.g. every file in
  `components/onboarding/` and `components/dashboard/transactions-view.tsx`.
  The pattern in this repo: a `page.tsx` is a thin server wrapper (sets
  `metadata`, does an auth check) that renders one client component doing the
  actual work — e.g. `app/onboarding/kyc/page.tsx` → `components/onboarding/kyc-form.tsx`.
- **Layouts for shared shells.** `app/dashboard/layout.tsx` renders the
  sidebar/header once and fetches the onboarding-activation status server-side
  (shown as a banner) — every page under `dashboard/` gets this without
  repeating the fetch.
- **Route Handlers as the BFF.** Every file under `app/api/**/route.ts`
  exports `GET`/`POST`/etc. functions that either proxy to the real backend
  (`authedBackendClient()`) or, historically, read/wrote a local dev-store
  stand-in (now removed — see `nawill-pay-frontend.md` doc F9).
- **Middleware for route protection.** `src/middleware.ts` reads the session
  cookie and redirects unauthenticated visitors away from `/dashboard` and
  `/onboarding`, and authenticated visitors away from `/login`/`/signup`.
- **File-based favicon.** `app/icon.png` is picked up automatically by
  Next.js's [metadata file conventions](https://nextjs.org/docs/app/api-reference/file-conventions/metadata) — no manual `<link>` tag.

## Trade-offs

- Server Components can't use hooks or browser APIs — every interactive
  piece needs an explicit `"use client"` boundary, which means thinking
  about *where* that boundary sits (the pattern above — thin server page,
  client component underneath — keeps this consistent).
- Turbopack (Next's newer bundler, used here via `next dev --turbopack` /
  `next build --turbopack`) is still younger than Webpack; if you hit a
  bundler-specific issue, it's worth checking whether it reproduces without
  `--turbopack`.

## Further reading

- [Next.js documentation](https://nextjs.org/docs)
- [App Router fundamentals](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
