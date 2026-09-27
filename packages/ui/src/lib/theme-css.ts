import { palettes, type Palette } from "@napayment/ui-tokens";

const toVar = (key: string) => `--color-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

function declarations(palette: Palette): string {
  return Object.entries(palette)
    .map(([key, value]) => `${toVar(key)}:${value};`)
    .join("");
}

/**
 * The CSS variables for both palettes, generated from @napayment/ui-tokens so
 * hex values are never repeated in CSS. `foreground`/`border` are aliases of
 * `ink`/`line`. Light is the default; `data-theme="dark"` on <html> switches.
 */
export function themeCss(): string {
  const aliases = "--color-foreground:var(--color-ink);--color-border:var(--color-line);";
  return (
    `:root{color-scheme:light;${declarations(palettes.light)}${aliases}}` +
    `:root[data-theme="dark"]{color-scheme:dark;${declarations(palettes.dark)}}`
  );
}
