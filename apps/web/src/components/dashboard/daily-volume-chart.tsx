"use client";

import { useState } from "react";
import type { TransactionDailyVolume } from "@napayment/api-client";
import { formatDate, formatDayMonth, formatNaira, plural } from "@napayment/format";
import { cn } from "@/lib/utils";
import { ChartDataTable } from "./chart-data-table";

/**
 * Single-series bar chart (volume by day) per the dataviz skill's mark specs:
 * bars capped at 24px, 4px rounded top / square baseline, 2px surface gap,
 * hairline recessive gridlines, per-bar hover+focus tooltip, and an sr-only
 * table so the same data is reachable without hovering. One series -> no
 * legend needed (the card title already says what's plotted).
 */
export function DailyVolumeChart({ data }: { data: TransactionDailyVolume[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-subtle">
        No transactions in this range yet.
      </div>
    );
  }

  const maxVolume = Math.max(...data.map((d) => Number(d.volume)), 1);
  const highestIndex = data.reduce(
    (best, d, i) => (Number(d.volume) > Number(data[best].volume) ? i : best),
    0,
  );
  const active = activeIndex !== null ? data[activeIndex] : null;
  // At most ~8 date labels, so they never collide on a phone.
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <div>
      <div className="relative">
        {/* Recessive gridlines + axis labels */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-6">
          {[1, 0.5, 0].map((fraction) => (
            <div key={fraction} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-right font-mono text-[10px] text-subtle">
                {fraction === 0 ? "₦0" : formatNaira(String(Math.round(maxVolume * fraction)))}
              </span>
              <div className="h-px flex-1 bg-line-soft" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative ml-16 flex h-48 items-end gap-0.5 overflow-x-auto pb-6">
          {data.map((day, index) => {
            const heightPct = Math.max((Number(day.volume) / maxVolume) * 100, Number(day.volume) > 0 ? 2 : 0);
            const isHighest = index === highestIndex;
            return (
              <div key={day.date} className="relative flex h-full w-7 shrink-0 flex-col items-center justify-end">
                {isHighest && (
                  <span className="mb-1 whitespace-nowrap font-mono text-[10px] font-medium text-muted">
                    {formatNaira(day.volume)}
                  </span>
                )}
                <button
                  type="button"
                  className={cn(
                    "w-6 rounded-t-[4px] bg-brand transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                    activeIndex === null || activeIndex === index ? "opacity-100" : "opacity-45",
                  )}
                  style={{ height: `${heightPct}%`, minHeight: Number(day.volume) > 0 ? 2 : 0 }}
                  onPointerEnter={() => setActiveIndex(index)}
                  onPointerLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  aria-label={`${formatDate(day.date)}: ${plural(day.count, "transaction")}, ${formatNaira(day.volume)}`}
                />
                <span
                  className={cn(
                    "absolute -bottom-5 whitespace-nowrap font-mono text-[9px] text-subtle",
                    index % labelEvery !== 0 && index !== data.length - 1 && "invisible",
                  )}
                >
                  {formatDayMonth(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip - reflects the currently hovered/focused bar */}
      <div className="mt-2 h-10 rounded-lg border border-line bg-paper px-3 py-2 text-xs">
        {active ? (
          <div className="flex items-center justify-between">
            <span className="text-muted">
              {formatDate(active.date)}
            </span>
            <span className="font-mono font-semibold text-ink">
              {formatNaira(active.volume)} · {plural(active.count, "transaction")}
            </span>
          </div>
        ) : (
          <span className="text-subtle">Hover or focus a bar for details</span>
        )}
      </div>
      <ChartDataTable caption="Daily transaction volume" data={data} />
    </div>
  );
}
