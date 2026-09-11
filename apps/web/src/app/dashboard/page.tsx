import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { getSession } from "@/server/session";
import { authedBackendClient } from "@/server/backend-client";
import { safeCall } from "@/server/safe-call";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate, formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — Nawill Pay" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const client = await authedBackendClient();
  // virtualaccounts:read and transactions:read aren't in every role
  // template's fixed permission set (doc F6 - DEVELOPER has neither) - an
  // invited teammate under that role legitimately 403s on both. safeCall
  // degrades that to an empty state instead of crashing the page.
  const [me, virtualAccounts, recentTransactions] = await Promise.all([
    client.users.me(),
    safeCall(client.virtualAccounts.listMine({ size: 5 })),
    safeCall(client.transactions.list({}, { page: 0, size: 5 })),
  ]);
  const account = virtualAccounts?.content[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">
          Welcome{me ? `, ${me.firstName}` : ""}
        </h1>
        <p className="text-sm text-navy-500">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Available balance</CardDescription>
            <CardTitle className="text-2xl">{account ? formatNaira(account.balance) : "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Virtual account number</CardDescription>
            <CardTitle className="font-mono text-lg">{account?.accountNumber ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Currency</CardDescription>
            <CardTitle className="text-2xl">{account?.currency ?? "NGN"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Your 5 most recent transactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {!recentTransactions && (
            <p className="py-6 text-center text-sm text-navy-400">
              Your role doesn&apos;t include transaction access.
            </p>
          )}
          {recentTransactions?.content.length === 0 && (
            <p className="py-6 text-center text-sm text-navy-400">No transactions yet.</p>
          )}
          {recentTransactions?.content.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2.5 hover:bg-navy-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={
                    txn.transactionType === "CREDIT"
                      ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-success-surface text-success"
                      : "flex size-8 shrink-0 items-center justify-center rounded-full bg-danger-surface text-danger"
                  }
                >
                  {txn.transactionType === "CREDIT" ? (
                    <ArrowDownLeft className="size-4" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-800">{txn.sessionId}</p>
                  <p className="text-xs text-navy-400">{formatDate(txn.createdAt)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={txn.transactionStatus} />
                <span className="text-sm font-semibold text-navy-900">{formatNaira(txn.amount)}</span>
              </div>
            </div>
          ))}
        </CardContent>
        {recentTransactions && (
          <CardFooter className="justify-start">
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-1 text-sm font-medium text-navy-700 hover:underline"
            >
              View all transactions
              <ArrowRight className="size-3.5" />
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
