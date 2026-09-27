"use client";

import { useState } from "react";
import type { TransactionFilter } from "@napayment/api-client";
import { TransactionsPanel } from "@napayment/ui/transactions-panel";
import { useTransactionAnalytics, useTransactions } from "@/hooks/use-transactions";

/** The console's transactions, fetched client-side through the BFF. */
export function TransactionsView() {
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [page, setPage] = useState(0);
  const transactions = useTransactions(filter, page);
  const analytics = useTransactionAnalytics(filter);

  return (
    <TransactionsPanel
      filter={filter}
      onFilterChange={(next) => {
        setFilter(next);
        setPage(0);
      }}
      page={page}
      onPageChange={setPage}
      transactions={transactions.data}
      analytics={analytics.data}
      loading={transactions.isLoading || analytics.isLoading}
    />
  );
}
