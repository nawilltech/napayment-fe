"use client";

import { useState } from "react";
import type { TransactionFilter } from "@napayment/api-client";
import { TransactionFilters } from "./transaction-filters";
import { TransactionAnalytics } from "./transaction-analytics";
import { TransactionTable } from "./transaction-table";
import { DailyVolumeChart } from "./daily-volume-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactionAnalytics, useTransactions } from "@/hooks/use-transactions";

// Filters scope both the tiles and the table - the numbers always agree.
export function TransactionsView() {
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [page, setPage] = useState(0);

  const transactions = useTransactions(filter, page);
  const analytics = useTransactionAnalytics(filter);

  return (
    <div className="space-y-[18px]">
      <TransactionAnalytics analytics={analytics.data} loading={analytics.isLoading} />

      <TransactionFilters
        value={filter}
        onChange={(next) => {
          setFilter(next);
          setPage(0);
        }}
      />

      <TransactionTable
        data={transactions.data}
        loading={transactions.isLoading}
        page={page}
        onPageChange={setPage}
      />

      {analytics.data && (
        <Card>
          <CardHeader>
            <CardTitle>Daily volume</CardTitle>
            <CardDescription>Sum of transaction amounts per day, for the filtered range.</CardDescription>
          </CardHeader>
          <CardContent>
            <DailyVolumeChart data={analytics.data.dailyVolume} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
