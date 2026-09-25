"use client";

import { useState } from "react";
import { cn, formatNaira } from "@/lib/utils";

export interface CollectionsDay {
  date: string; // YYYY-MM-DD
  count: number;
  volume: string; // kobo
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

/**
 * Compact single-series bar chart for Home ("Collected, last N days"). One
 * series, so no legend - the card title names it. Bars fill the width with a
 * 2px gap, 4px rounded tops on a square baseline; hover/focus drives a
 * readout line, and an sr-only table carries the same data.
 */
export function CollectionsChart({ days }: { days: CollectionsDay[] }) {
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
              aria-label={`${shortDate(day.date)}: ${formatNaira(day.volume)} from ${day.count} payment${day.count === 1 ? "" : "s"}`}
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
            <span>{shortDate(current.date)}</span>
            <span className="text-ink">
              {formatNaira(current.volume)} · {current.count} payment{current.count === 1 ? "" : "s"}
            </span>
          </>
        ) : (
          <>
            <span>{shortDate(days[0].date)}</span>
            <span>{shortDate(days[mid].date)}</span>
            <span>{shortDate(days[days.length - 1].date)}</span>
          </>
        )}
      </div>

      <table className="sr-only">
        <caption>Collected per day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Payments</th>
            <th>Collected</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
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
