"use client";

import type { TransactionAnalyticsResponse, TransactionStatus } from "@napayment/api-client";
import { formatNaira, plural } from "@napayment/format";
import { StatTile } from "./stat-tile";

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
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
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
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
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
