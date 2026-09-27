"use client";

import type {
  PageResponse,
  TransactionAnalyticsResponse,
  TransactionFilter,
  TransactionResponse,
} from "@napayment/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { DailyVolumeChart } from "./daily-volume-chart";
import { TransactionAnalytics } from "./transaction-analytics";
import { TransactionFilters } from "./transaction-filters";
import { TransactionTable } from "./transaction-table";

/**
 * Tiles, filters, table and daily chart for a transaction list. Presentation
 * only - the Business Console feeds it from client-side queries, the admin
 * console from the URL. One filter scopes tiles and table, so they agree.
 */
export function TransactionsPanel({
  filter,
  onFilterChange,
  page,
  onPageChange,
  transactions,
  analytics,
  loading = false,
}: {
  filter: TransactionFilter;
  onFilterChange: (next: TransactionFilter) => void;
  page: number;
  onPageChange: (page: number) => void;
  transactions: PageResponse<TransactionResponse> | undefined;
  analytics: TransactionAnalyticsResponse | undefined;
  loading?: boolean;
}) {
  return (
    <div className="space-y-[18px]">
      <TransactionAnalytics analytics={analytics} loading={loading} />
      <TransactionFilters value={filter} onChange={onFilterChange} />
      <TransactionTable data={transactions} loading={loading} page={page} onPageChange={onPageChange} />
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Daily volume</CardTitle>
            <CardDescription>Sum of transaction amounts per day, for the filtered range.</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyVolumeChart data={analytics.dailyVolume} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
