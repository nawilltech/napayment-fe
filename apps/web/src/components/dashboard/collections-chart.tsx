"use client";

import { useState } from "react";
import type { TransactionDailyVolume } from "@napayment/api-client";
import { formatDayMonth, formatNaira, plural } from "@napayment/format";
import { cn } from "@/lib/utils";
import { ChartDataTable } from "./chart-data-table";

/**
 * Compact single-series bar chart for Home ("Collected, last N days"). One
 * series, so no legend - the card title names it. Bars fill the width with a
 * 2px gap, 4px rounded tops on a square baseline; hover/focus drives a
 * readout line, and an sr-only table carries the same data.
 */
export function CollectionsChart({ days }: { days: TransactionDailyVolume[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => Number(d.volume)), 1);
  const current = active !== null ? days[active] : null;
  const mid = Math.floor((days.length - 1) / 2);

  return (
    <div>
      <div className="flex h-[150px] items-end gap-0.5 border-b border-line sm:gap-2" onPointerLeave={() => setActive(null)}>
        {days.map((day, i) => {
          const value = Number(day.volume);
          return (
            <button
              key={day.date}
              type="button"
              className="group flex h-full flex-1 items-end focus:outline-none"
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${formatDayMonth(day.date)}: ${formatNaira(day.volume)} from ${plural(day.count, "payment")}`}
            >
              <span
                className={cn(
                  "block w-full rounded-t-[4px] bg-brand transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-brand group-focus-visible:ring-offset-2",
                  active !== null && active !== i && "opacity-45",
                )}
                style={{ height: value > 0 ? `${Math.max((value / max) * 100, 2)}%` : 0 }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex h-4 justify-between font-mono text-[10.5px] text-subtle">
        {current ? (
          <>
            <span>{formatDayMonth(current.date)}</span>
            <span className="text-ink">
              {formatNaira(current.volume)} · {plural(current.count, "payment")}
            </span>
          </>
        ) : (
          <>
            <span>{formatDayMonth(days[0].date)}</span>
            <span>{formatDayMonth(days[mid].date)}</span>
            <span>{formatDayMonth(days[days.length - 1].date)}</span>
          </>
        )}
      </div>
      <ChartDataTable caption="Collected per day" data={days} />
    </div>
  );
}
