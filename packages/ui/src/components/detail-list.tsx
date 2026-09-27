import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Receipt-style label/value rows with dashed rules - transaction detail, business KYC detail. */
export function DetailList({ items, className }: { items: [label: string, value: ReactNode][]; className?: string }) {
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 border-b border-dashed border-line pb-2">
          <dt className="shrink-0 text-subtle">{label}</dt>
          <dd className="min-w-0 truncate text-right font-mono text-[13px] text-ink">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
