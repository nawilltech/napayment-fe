# Forms & Validation

## The stack

[React Hook Form](https://react-hook-form.com/) (form state, field
registration, submit handling) + [Zod](https://zod.dev/) (schema validation)
via [`@hookform/resolvers`](https://github.com/react-hookform/resolvers)'s
`zodResolver`. Every form in `components/auth/`, `components/onboarding/`,
and `components/settings/` follows the same shape.

## Why this pairing

- **React Hook Form** keeps field values in refs rather than re-rendering on
  every keystroke (unlike controlled-input-per-`useState` forms), which
  matters for a form with 8+ fields (e.g. `business-details-form.tsx`) —
  every other field's input doesn't re-render when one changes.
- **Zod** schemas are the single source of truth for a field's rules, and
  they're **shared** — the same schema validates the form client-side *and*
  a Next.js Route Handler validates the request body server-side before
  proxying to the backend (see below). Two validation layers, one
  definition.

## Where schemas live: `packages/schemas`

Not inside `apps/web` — in the shared workspace package, on purpose. Two
reasons:

1. **The shape of "a valid business KYC submission" is a product decision,
   not a web-specific one.** A future mobile screen doing the same form
   wants the identical rules.
2. **The schemas mirror the backend's own Bean Validation constraints,
   field for field.** `packages/schemas/src/auth.ts`'s `strongPasswordSchema`
   mirrors `common-core`'s `@StrongPassword` annotation exactly (≥8 chars,
   upper+lower+digit+special char) — see the comment at the top of that
   file. `packages/schemas/src/onboarding.ts`'s `businessDetailsSchema`
   mirrors the backend's `BusinessKycDetailsRequest` record's own
   `@Pattern`/`@Size` constraints. When the backend's validation rule
   changes, the frontend schema should change with it — they're meant to be
   read side by side, not independently invented.

Validating client-side before a request leaves the device is also a real UX
win given the poor-connectivity conditions this platform is designed around
(`nawill-pay-frontend.md` doc F1) — failing fast locally beats waiting on a
round trip just to learn a field was invalid.

## The pattern in a component

```tsx
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

<form onSubmit={handleSubmit((values) => login.mutate(values))}>
  <Input {...register("email")} />
  {errors.email && <p>{errors.email.message}</p>}
  ...
</form>
```

`login.mutate` is a TanStack Query mutation (see
[`state-management-and-data-fetching.md`](./state-management-and-data-fetching.md))
— once `handleSubmit` confirms the Zod schema passes, the values go straight
to the mutation, which POSTs to this app's own `/api/*` route.

### The one deliberate exception: `signup-form.tsx`

Signup toggles between an individual and a business schema based on a
`accountType` state value. React Hook Form's `resolver` is fixed at
`useForm()`-call time, so it can't swap schemas reactively without a
remount. Rather than force a remount on every toggle, `signup-form.tsx`
skips `zodResolver` entirely: it registers fields with no resolver, and
`onSubmit` runs `schema.safeParse(values)` manually, mapping any Zod issues
onto fields via `setError()`. This is the one form in the app that doesn't
follow the standard pattern above — read the comment in that file before
copying its shape elsewhere; the standard `zodResolver` pattern is right for
every form whose schema doesn't change at runtime.

## Server-side validation: `parseBody`

Every Route Handler that accepts a body calls
`apps/web/src/server/route-helpers.ts`'s `parseBody(request, schema)` —
same Zod schema as the form, run again server-side. This isn't redundant:
a Route Handler can be hit directly (not just through the form UI), and
server-side validation is the actual trust boundary. A failed parse throws
`ValidationError`, which `handleRouteError` turns into a `400` with the
Zod issue messages.

## Further reading

- [React Hook Form docs](https://react-hook-form.com/get-started)
- [Zod docs](https://zod.dev/)
- [`@hookform/resolvers`](https://github.com/react-hookform/resolvers) (the Zod/RHF bridge)
- `nawill-pay-frontend.md` doc F4's "API client & type generation" section, and doc F6 for the backend's own DTO validation constraints each schema mirrors
