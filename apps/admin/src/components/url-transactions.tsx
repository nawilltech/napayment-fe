"use client";

import { usePathname, useRouter } from "next/navigation";
import type { PageResponse, TransactionAnalyticsResponse, TransactionFilter, TransactionResponse } from "@napayment/api-client";
import { TransactionsPanel } from "@napayment/ui/transactions-panel";
import { hrefWith } from "@/lib/search-params";

/** The shared TransactionsPanel with its filter and page kept in the URL (so views are shareable links). */
export function UrlTransactions({
  filter,
  page,
  transactions,
  analytics,
}: {
  filter: TransactionFilter;
  page: number;
  transactions: PageResponse<TransactionResponse>;
  analytics: TransactionAnalyticsResponse;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const go = (next: TransactionFilter, nextPage: number) =>
    router.push(hrefWith(pathname, {}, { ...next, page: nextPage > 0 ? nextPage + 1 : undefined }));

  return (
    <TransactionsPanel
      filter={filter}
      onFilterChange={(next) => go({ ...next, businessId: filter.businessId }, 0)}
      page={page}
      onPageChange={(p) => go(filter, p)}
      transactions={transactions}
      analytics={analytics}
    />
  );
}
