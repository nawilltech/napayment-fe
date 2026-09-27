import type { Metadata } from "next";
import Link from "next/link";
import type { TransactionFilter, TransactionStatus, TransactionType } from "@napayment/api-client";
import { Alert } from "@napayment/ui/alert";
import { UrlTransactions } from "@/components/url-transactions";
import { pageIndex } from "@/lib/search-params";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Transactions — Napayment Admin" };

/** Every transaction on the platform (SUPERADMIN sees across businesses); `?businessId=` narrows to one. */
export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const filter: TransactionFilter = {
    fromDate: params.fromDate,
    toDate: params.toDate,
    status: params.status as TransactionStatus | undefined,
    type: params.type as TransactionType | undefined,
    term: params.term,
    minAmount: params.minAmount,
    maxAmount: params.maxAmount,
    businessId: params.businessId,
  };
  const page = pageIndex(params.page);
  const client = await authedBackendClient();
  const [transactions, analytics, business] = await Promise.all([
    client.transactions.list(filter, { page, size: 20 }),
    client.transactions.analytics(filter),
    filter.businessId ? client.admin.getBusiness(filter.businessId) : null,
  ]);

  return (
    <div className="space-y-4">
      {business && (
        <Alert>
          Showing {business.summary.name} only.{" "}
          <Link href="/transactions" className="font-semibold underline">
            Show all businesses
          </Link>
        </Alert>
      )}
      <UrlTransactions filter={filter} page={page} transactions={transactions} analytics={analytics} />
    </div>
  );
}
