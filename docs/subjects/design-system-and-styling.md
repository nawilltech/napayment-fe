# Design System & Styling

## The stack

[Tailwind CSS v4](https://tailwindcss.com/docs) for styling +
[Radix UI](https://www.radix-ui.com/primitives) primitives for
accessible, unstyled interactive behavior (dialogs, tabs, dropdown menus) +
[`class-variance-authority`](https://cva.style/docs) (`cva`) for
component variants + [`tailwind-merge`](https://github.com/dcastil/tailwind-merge)
to resolve conflicting classes when a caller overrides a component's
default styling.

## Why this combination

- **Tailwind, not a component library (MUI, Chakra, Ant).** The brand
  identity (navy `#262B49` / cream `#ECE6D9`, sampled directly from the
  provided logo — see `packages/ui-tokens/src/index.ts`) needs to fully
  replace whatever look a pre-themed component library ships with by
  default. Tailwind has no opinion to fight; you're styling from nothing,
  not un-styling something else.
- **Radix, not fully custom interactive components.** A dialog needs focus
  trapping, `Escape`-to-close, correct ARIA attributes, and click-outside
  handling to be genuinely accessible — getting all of that right by hand,
  for every dialog/tabs/dropdown in the app, is real, easy-to-get-subtly-wrong
  work. Radix's primitives (`@radix-ui/react-dialog`, `-tabs`,
  `-dropdown-menu`) handle the behavior; this repo supplies only the
  Tailwind classes on top (see `components/ui/dialog.tsx`,
  `components/ui/tabs.tsx`, `components/ui/dropdown-menu.tsx` — each is a
  thin wrapper, not a from-scratch implementation).
- **No component library dependency to re-theme.** Because `components/ui/`
  is hand-built (Radix behavior + Tailwind classes), there's no upstream
  component library whose default spacing/radius/color choices need
  fighting or wrapping.

## Where the primitives live: `apps/web/src/components/ui/`

`Button`, `Input`, `PasswordInput`, `Label`, `Select`, `Textarea`, `Card`
(+ `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`),
`Badge`/`StatusBadge`, `Dialog`, `Tabs`, `DropdownMenu`, `Alert`/`DevGapNotice`,
`CopyField`, `FileDropzone`. These are generic — no business logic, no
knowledge of "a transaction" or "a KYC document." Everything else in
`components/` composes these.

They currently live directly in `apps/web` rather than a shared
`packages/ui-web` package, since only one app consumes them so far — split
them out if/when a second web surface needs them (noted in
`nawill-pay-frontend.md` doc F8).

## Design tokens: `packages/ui-tokens`

The single source of truth for brand colors, referenced in two places that
must be kept in sync by hand today:

1. `apps/web/src/app/globals.css` — Tailwind v4's `@theme` block, which
   turns each CSS custom property into a utility class (`bg-navy-700`,
   `text-cream-200`, etc.).
2. `apps/mobile/src/constants/theme.ts` — the same hex values, since
   NativeWind isn't wired up on mobile yet (see
   [`mobile-app.md`](./mobile-app.md)).

`packages/ui-tokens/src/index.ts` also exports these as a plain JS object,
for anywhere that needs the value in JS rather than CSS (e.g. inline SVG
fills in `daily-volume-chart.tsx`).

## The `cn()` helper

`apps/web/src/lib/utils.ts`'s `cn(...)` combines `clsx` (conditional class
joining) with `tailwind-merge` (resolves conflicts — e.g. if a caller passes
`className="p-6"` to a component whose default is `"p-4"`, `twMerge`
correctly keeps only `p-6` rather than emitting both and leaving the
cascade to decide). Every component in `components/ui/` accepts a
`className` prop and merges it via `cn()` — this is what lets a call site
override one utility without fighting the component's defaults.

## Component variants: `cva`

`components/ui/button.tsx`'s `buttonVariants` is the clearest example:
`cva()` defines named variant groups (`variant: primary | secondary |
outline | ghost | destructive`, `size: sm | md | lg`) that expand to the
right Tailwind classes, with type-safe props (`VariantProps<typeof
buttonVariants>`). `components/ui/badge.tsx` and `components/ui/alert.tsx`
follow the same pattern.

## Charts: the `dataviz` skill

`components/dashboard/daily-volume-chart.tsx` (the Transactions screen's bar
chart) was built following a dedicated internal design methodology for data
visualization — mark specs (bar thickness caps, rounded data-ends), a
hover+keyboard-accessible tooltip layer, and an `sr-only` table fallback so
the same data is reachable without a mouse. If you're adding another chart,
read that component's own comments first rather than free-handing a new
one — the spec it follows is deliberately consistent across every chart in
the app.

## Further reading

- [Tailwind CSS v4 docs](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [class-variance-authority](https://cva.style/docs)
- [tailwind-merge](https://github.com/dcastil/tailwind-merge)
- `nawill-pay-frontend.md` doc F2 ADR-FE-3 (the ADR behind Tailwind+Radix over a component library) and doc F8 ("Design tokens")
