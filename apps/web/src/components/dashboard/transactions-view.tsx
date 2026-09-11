"use client";

import { useState } from "react";
import type { TransactionFilter } from "@napayment/api-client";
import { TransactionFilters } from "./transaction-filters";
import { TransactionAnalytics } from "./transaction-analytics";
import { TransactionTable } from "./transaction-table";
import { useTransactionAnalytics, useTransactions } from "@/hooks/use-transactions";

export function TransactionsView() {
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [page, setPage] = useState(0);

  const transactions = useTransactions(filter, page);
  const analytics = useTransactionAnalytics(filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Transactions</h1>
        <p className="text-sm text-navy-500">
          Filters below scope both the analytics and the table — the numbers always agree.
        </p>
      </div>

      <TransactionFilters
        value={filter}
        onChange={(next) => {
          setFilter(next);
          setPage(0);
        }}
      />

      <TransactionAnalytics analytics={analytics.data} loading={analytics.isLoading} />

      <TransactionTable
        data={transactions.data}
        loading={transactions.isLoading}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
