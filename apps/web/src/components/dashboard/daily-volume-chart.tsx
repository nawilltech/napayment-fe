"use client";

import { useState } from "react";
import type { TransactionDailyVolume } from "@napayment/api-client";
import { cn, formatNaira } from "@/lib/utils";

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
      <div className="flex h-48 items-center justify-center text-sm text-navy-400">
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

  return (
    <div>
      <div className="relative">
        {/* Recessive gridlines + axis labels */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-6">
          {[1, 0.5, 0].map((fraction) => (
            <div key={fraction} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-right text-[10px] text-navy-400">
                {fraction === 0 ? "₦0" : formatNaira(String(Math.round(maxVolume * fraction)))}
              </span>
              <div className="h-px flex-1 bg-navy-100" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative ml-16 flex h-48 items-end gap-0.5 overflow-x-auto pb-6">
          {data.map((day, index) => {
            const heightPct = Math.max((Number(day.volume) / maxVolume) * 100, Number(day.volume) > 0 ? 2 : 0);
            const isHighest = index === highestIndex;
            return (
              <div key={day.date} className="relative flex w-7 shrink-0 flex-col items-center">
                {isHighest && (
                  <span className="mb-1 whitespace-nowrap text-[10px] font-medium text-navy-600">
                    {formatNaira(day.volume)}
                  </span>
                )}
                <button
                  type="button"
                  className={cn(
                    "w-6 rounded-t-[4px] bg-navy-700 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500",
                    activeIndex === index ? "opacity-100" : "opacity-80 hover:opacity-100",
                  )}
                  style={{ height: `${heightPct}%`, minHeight: Number(day.volume) > 0 ? 2 : 0 }}
                  onPointerEnter={() => setActiveIndex(index)}
                  onPointerLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  aria-label={`${day.date}: ${day.count} transaction${day.count === 1 ? "" : "s"}, ${formatNaira(day.volume)}`}
                />
                <span className="absolute -bottom-5 text-[9px] text-navy-400">
                  {new Date(day.date).toLocaleDateString("en-NG", { day: "2-digit", month: "short" }).slice(0, 6)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip - reflects the currently hovered/focused bar */}
      <div className="mt-2 h-10 rounded-md border border-border bg-navy-50 px-3 py-2 text-xs">
        {active ? (
          <div className="flex items-center justify-between">
            <span className="text-navy-500">
              {new Date(active.date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <span className="font-semibold text-navy-900">
              {formatNaira(active.volume)} · {active.count} txn{active.count === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <span className="text-navy-400">Hover or focus a bar for details</span>
        )}
      </div>

      {/* sr-only table view - same data, no hover required */}
      <table className="sr-only">
        <caption>Daily transaction volume</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Transaction count</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.count}</td>
              <td>{formatNaira(day.volume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
