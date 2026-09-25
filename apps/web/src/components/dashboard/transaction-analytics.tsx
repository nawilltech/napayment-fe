"use client";

import type { TransactionAnalyticsResponse, TransactionStatus } from "@napayment/api-client";
import { formatNaira } from "@/lib/utils";

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface px-[18px] py-4">
      <p className="text-[12.5px] text-subtle">{label}</p>
      <p className="mt-1.5 truncate font-mono text-[22px] font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-subtle">{sub}</p>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function sumStatuses(analytics: TransactionAnalyticsResponse, statuses: TransactionStatus[]) {
  const rows = analytics.byStatus.filter((row) => statuses.includes(row.status));
  return {
    count: rows.reduce((n, row) => n + row.count, 0),
    volume: String(rows.reduce((n, row) => n + Number(row.volume), 0)),
  };
}

/** Headline tiles (Web 03 Transactions) - scoped by the same filter as the table. */
export function TransactionAnalytics({
  analytics,
  loading,
}: {
  analytics: TransactionAnalyticsResponse | undefined;
  loading: boolean;
}) {
  if (loading && !analytics) {
    return (
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[98px] animate-pulse rounded-xl bg-line-soft" />
        ))}
      </div>
    );
  }
  if (!analytics) return null;

  const pending = sumStatuses(analytics, ["PENDING", "PROCESSING", "ON_HOLD"]);
  const failed = sumStatuses(analytics, ["FAILED"]);

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <StatTile
        label="Total volume"
        value={formatNaira(analytics.totalVolume)}
        sub={plural(analytics.totalCount, "transaction")}
      />
      <StatTile label="Average payment" value={formatNaira(analytics.averageAmount)} sub="Across these filters" />
      <StatTile label="Pending" value={formatNaira(pending.volume)} sub={plural(pending.count, "transaction")} />
      <StatTile label="Failed" value={formatNaira(failed.volume)} sub={plural(failed.count, "transaction")} />
    </div>
  );
}
