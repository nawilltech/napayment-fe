import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { IconName } from "@napayment/ui-tokens";
import { Icon } from "@napayment/ui/icon";
import { authedBackendClient } from "@/server/backend-client";
import { safeCall } from "@napayment/bff/safe-call";
import { loadConsole } from "@/server/console";
import { Card } from "@napayment/ui/card";
import { buttonVariants } from "@napayment/ui/button";
import { StatusBadge } from "@napayment/ui/badge";
import { CollectionsChart } from "@napayment/ui/collections-chart";
import { lastNDays, windowStart } from "@napayment/ui/lib/daily-series";
import { CopyButton } from "@napayment/ui/copy-button";
import { describeTransaction, displayName, formatDateTime, formatNaira, groupAccountNumber } from "@napayment/format";
import { cn } from "@napayment/ui/lib/cn";

/** Dashboard shortcut list; businessOnly entries need a business account. */
const SHORTCUTS: { href: string; label: string; icon: IconName; hint: string; businessOnly?: boolean }[] = [
  { href: "/dashboard/send", label: "Send money", icon: "send", hint: "Pay another Napayment account" },
  { href: "/dashboard/transactions", label: "Transactions", icon: "transactions", hint: "Search, filter and inspect payments" },
  { href: "/dashboard/settings/api-keys", label: "API keys & webhooks", icon: "apiKeys", hint: "Connect your own server", businessOnly: true },
  { href: "/dashboard/settings/team", label: "Team", icon: "team", hint: "Invite people and manage roles", businessOnly: true },
];


export const metadata: Metadata = { title: "Home — Napayment" };

const CHART_DAYS = 14;

export default async function DashboardPage() {
  const { me, kind, steps, activation } = await loadConsole();

  const since = windowStart(CHART_DAYS);

  const client = await authedBackendClient();
  // virtualaccounts:read and transactions:read aren't in every role
  // template's fixed permission set (doc F6 - DEVELOPER has neither) - an
  // invited teammate under that role legitimately 403s on both. safeCall
  // degrades that to an empty state instead of crashing the page.
  const [virtualAccounts, recentTransactions, collected] = await Promise.all([
    safeCall(client.virtualAccounts.listMine({ size: 5 })),
    safeCall(client.transactions.list({}, { page: 0, size: 5 })),
    safeCall(client.transactions.analytics({ type: "CREDIT", fromDate: since.toISOString() })),
  ]);
  const account = virtualAccounts?.content[0];
  const name = displayName(me);
  const nextStep = steps?.find((s) => !s.done);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.3fr_1fr]">
          {/* Balance - the one blue surface on the page */}
          <div className="rounded-[14px] bg-brand p-[22px] text-cream">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand-soft">Available balance</p>
            <p className="mt-2 break-all font-mono text-[28px] font-semibold leading-tight sm:text-[34px]">
              {account ? formatNaira(account.balance) : "—"}
            </p>
            <div className="mt-[18px] flex flex-wrap gap-2.5">
              <Link
                href="/dashboard/send"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cream px-3.5 text-[13.5px] font-semibold text-chrome transition-opacity hover:opacity-90"
              >
                <Icon name="send" className="size-4" />
                Send money
              </Link>
              <Link
                href="/dashboard/transactions"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand-line px-3.5 text-[13.5px] font-semibold text-cream transition-colors hover:bg-brand-hover"
              >
                <Icon name="transactions" className="size-4" />
                Transactions
              </Link>
            </div>
          </div>

          <Card className="flex flex-col justify-between gap-4 p-[22px]">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-subtle">Virtual account</p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-[0.04em] text-ink">
                {account ? groupAccountNumber(account.accountNumber) : "—"}
              </p>
              <p className="mt-1 truncate text-[13px] text-muted">
                {name} · {account?.currency ?? "NGN"}
              </p>
            </div>
            {account && (
              <CopyButton
                label="Copy account details"
                value={`${account.accountNumber} · ${name}`}
              />
            )}
          </Card>
        </div>

        {collected && (
          <Card className="p-[22px]">
            <div className="mb-[18px] flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-bold text-ink">Collected, last {CHART_DAYS} days</h2>
              <p className="font-mono text-lg font-semibold text-ink">{formatNaira(collected.creditVolume)}</p>
            </div>
            <CollectionsChart days={lastNDays(CHART_DAYS, collected.dailyVolume)} />
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
            <h2 className="text-[15px] font-bold text-ink">Recent activity</h2>
            {recentTransactions && (
              <Link
                href="/dashboard/transactions"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:text-ink"
              >
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
          {!recentTransactions && (
            <p className="px-5 py-8 text-center text-sm text-subtle">
              Your role doesn&apos;t include transaction access.
            </p>
          )}
          {recentTransactions?.content.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-subtle">
              No payments yet. They&apos;ll appear here as soon as one lands.
            </p>
          )}
          {recentTransactions?.content.map((txn) => (
            <div
              key={txn.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-line-soft px-5 py-[11px] text-[13.5px] last:border-0 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_110px_120px]"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-ink">{txn.sessionId}</p>
                <p className="font-mono text-[11px] text-subtle">{formatDateTime(txn.createdAt)}</p>
              </div>
              <p className="hidden text-[12.5px] text-subtle sm:block">
                {describeTransaction(txn).kind}
              </p>
              <div className="order-last sm:order-none">
                <StatusBadge status={txn.transactionStatus} />
              </div>
              <p className="text-right font-mono text-ink">
                {txn.transactionType === "DEBIT" ? "−" : "+"}
                {formatNaira(txn.amount)}
              </p>
            </div>
          ))}
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        {steps && activation && !activation.complete ? (
          <Card className="p-[22px]">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-bold text-ink">Finish activation</h2>
              <p className="font-mono text-xs text-subtle">
                {activation.done} of {activation.total}
              </p>
            </div>
            <div
              className="mb-3.5 mt-3 h-1.5 overflow-hidden rounded-full bg-line-soft"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={activation.total}
              aria-valuenow={activation.done}
              aria-label="Activation progress"
            >
              <div className="h-full bg-brand" style={{ width: `${(activation.done / activation.total) * 100}%` }} />
            </div>
            <ul className="space-y-2.5">
              {steps.map((step) => (
                <li key={step.key} className="flex items-center gap-2.5 text-[13.5px]">
                  <span
                    className={cn(
                      "flex size-[18px] shrink-0 items-center justify-center rounded-full",
                      step.done ? "bg-success text-white" : "border-2 border-line",
                    )}
                  >
                    {step.done && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={step.done ? "text-ink" : "text-muted"}>{step.label}</span>
                </li>
              ))}
            </ul>
            {nextStep && (
              <Link
                href={nextStep.href}
                className={cn(buttonVariants({ variant: "dark" }), "mt-4 w-full")}
              >
                Continue: {nextStep.label.toLowerCase()}
              </Link>
            )}
          </Card>
        ) : null}

        <Card className="p-[22px]">
          <h2 className="mb-3 text-[15px] font-bold text-ink">Shortcuts</h2>
          <ul className="divide-y divide-line-soft">
            {SHORTCUTS
              .filter((item) => kind === "business" || !item.businessOnly)
              .map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="group flex items-center gap-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-surface text-link">
                    <Icon name={item.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-ink group-hover:text-link">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-subtle">{item.hint}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-link" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
