# State Management & Data Fetching

There's no single "state management library" in this app (no Redux, no
global store) — state is split by *kind*, and each kind has exactly one
tool. This is deliberate: collapsing them into one library tends to blur the
question "does the backend have an opinion about this value?", which is the
question that actually determines how a piece of state should behave.

## The three kinds of state

| Kind | Tool | Example |
|---|---|---|
| **Server state** — anything the backend owns | [TanStack Query v5](https://tanstack.com/query/latest) | Transaction list, KYC documents, API keys |
| **Form state** — a draft the user is editing | [React Hook Form](https://react-hook-form.com/) | Every form in `components/` |
| **Client-only UI state** — never persisted, never the backend's business | plain `useState` | Dialog open/closed, active tab, hovered chart bar |

There's no dedicated client-state library (Zustand, Jotai, etc.) in use yet.
`useState`/`useReducer` have been sufficient so far because UI-only state in
this app tends to be local to one component tree — if a genuinely global,
cross-tree client state need shows up, that's the point to add one, not
before.

## Why TanStack Query for server state

Every hook in `apps/web/src/hooks/use-*.ts` wraps a `useQuery` or
`useMutation` call. The reasons this — rather than a Redux slice, or plain
`useEffect` + `useState` — is the standard here:

1. **Caching and refetching are solved problems.** A query is keyed
   (`["transactions", filter, page]`) and TanStack Query handles
   deduplication, background refetch, and cache invalidation
   (`queryClient.invalidateQueries`) after a mutation succeeds. Hand-rolling
   this with `useEffect` is a well-known source of race conditions (stale
   closures, out-of-order responses).
2. **Retry semantics line up with the backend's idempotency design.** The
   backend requires an `Idempotency-Key` header on every mutating financial
   endpoint specifically so that a retried request is safe (doc 3 §1.1 of
   the backend spec). TanStack Query's built-in retry/backoff on a mutation
   is exactly the client-side half of that contract — a retried request
   replays with the same key, so it's a no-op server-side rather than a
   duplicate action.
3. **`placeholderData: keepPreviousData`** (used in
   `hooks/use-transactions.ts`) keeps the previous page's data on screen
   while a new filter/page loads, instead of flashing to a loading state —
   important on the slow-connection conditions this whole platform is
   designed around.

Every `use-*.ts` hook follows the same shape: a `useQuery` for reads, a
`useMutation` for writes, and the mutation's `onSuccess` calls
`queryClient.invalidateQueries` on whatever query keys it just made stale,
plus a `sonner` toast for user feedback. Look at `hooks/use-onboarding.ts`
for the clearest example of the pattern repeated across ~15 hooks.

## The Provider

`apps/web/src/app/providers.tsx` creates one `QueryClient` per browser tab
(via `useState(() => new QueryClient(...))`, not a module-level singleton —
important in a framework with server rendering, where a singleton would leak
data between requests) and wraps the app in `QueryClientProvider`. It also
renders `<Toaster />` (sonner) here, so any hook anywhere can call
`toast.success(...)`/`toast.error(...)`.

## Server-side data fetching is different — and simpler

Server Components (see [`nextjs-and-app-router.md`](./nextjs-and-app-router.md))
don't use TanStack Query at all. `app/dashboard/page.tsx` just calls
`await authedBackendClient()` and awaits the result directly in the
component function — there's no client-side cache to manage because the
component only ever runs once per request, on the server. TanStack Query is
specifically for state that needs to survive across client-side
re-renders/navigations without refetching every time.

## Further reading

- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TanStack Query: Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) (worth reading before changing any `staleTime`/`retry` config)
- [TkDodo's TanStack Query blog series](https://tkdodo.eu/blog/practical-react-query) — the maintainer's own deep-dives, widely considered the best supplementary reading
- `nawill-pay-frontend.md` doc F4 ("State Management & Data Layer") for the original architectural decision and doc 3 §1.1 of the backend spec for the idempotency contract this mirrors
