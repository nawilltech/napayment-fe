import { cn } from "@/lib/utils";

/** Receipt-edged tile: rounded top, torn zig-zag bottom (Napayment Brand, 01 Logo). */
const TILE_PATH =
  "M18 0 H82 Q100 0 100 18 V88 L91.7 96 L83.3 88 L75 96 L66.7 88 L58.3 96 L50 88 L41.7 96 L33.3 88 L25 96 L16.7 88 L8.3 96 L0 88 V18 Q0 0 18 0 Z";

type Tone = "brand" | "cream" | "ink";

const TILE: Record<Tone, { fill: string; letter: string }> = {
  brand: { fill: "fill-brand", letter: "text-cream" },
  cream: { fill: "fill-cream", letter: "text-ink" },
  ink: { fill: "fill-ink", letter: "text-cream" },
};

/**
 * The product mark - lowercase typewriter "n" on a receipt tile. `letterTone`
 * overrides the letter colour, e.g. a cream tile sitting on the blue sign-in
 * panel takes a blue letter rather than ink.
 */
export function LogoMark({
  size = 32,
  tone = "brand",
  letterClassName,
  className,
}: {
  size?: number;
  tone?: Tone;
  letterClassName?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0">
        <path d={TILE_PATH} className={TILE[tone].fill} />
      </svg>
      <span
        className={cn(
          "absolute inset-x-0 top-0 flex items-center justify-center font-display leading-none",
          TILE[tone].letter,
          letterClassName,
        )}
        style={{ bottom: size * 0.1, fontSize: size * 0.65 }}
      >
        n
      </span>
    </span>
  );
}

/** Mark + "napayment" wordmark (Special Elite is reserved for the wordmark and campaign lines). */
export function Logo({
  size = 32,
  tone = "brand",
  letterClassName,
  className,
  wordmarkClassName,
}: {
  size?: number;
  tone?: Tone;
  letterClassName?: string;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} tone={tone} letterClassName={letterClassName} />
      <span
        aria-hidden
        className={cn("font-display leading-none", wordmarkClassName)}
        style={{ fontSize: size * 0.64 }}
      >
        napayment
      </span>
      <span className="sr-only">Napayment</span>
    </span>
  );
}
