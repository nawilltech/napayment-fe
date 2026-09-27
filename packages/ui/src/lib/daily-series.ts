import type { TransactionDailyVolume } from "@napayment/api-client";

// The backend buckets daily volume by Lagos calendar day.
const lagosDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" });
const DAY_MS = 86_400_000;

/** Midnight (local) at the start of an n-day window ending today - the analytics `fromDate`. */
export function windowStart(days: number) {
  const start = new Date(Date.now() - (days - 1) * DAY_MS);
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Every day in the window, zero-filled - the analytics endpoint omits empty days. */
export function lastNDays(days: number, data: TransactionDailyVolume[]): TransactionDailyVolume[] {
  const byDate = new Map(data.map((d) => [d.date, d]));
  return Array.from({ length: days }, (_, i) => {
    const date = lagosDay.format(new Date(Date.now() - (days - 1 - i) * DAY_MS));
    return byDate.get(date) ?? { date, count: 0, volume: "0" };
  });
}
