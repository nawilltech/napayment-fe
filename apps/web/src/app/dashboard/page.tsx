import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { getSession } from "@/server/session";
import { authedBackendClient } from "@/server/backend-client";
import { safeCall } from "@/server/safe-call";
import { activationSteps, computeOnboardingStatus, isActivationDone } from "@/server/onboarding-status";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { CollectionsChart, type CollectionsDay } from "@/components/dashboard/collections-chart";
import { CopyButton } from "@/components/dashboard/copy-button";
import { cn, formatDate, formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Home — Napayment" };

const CHART_DAYS = 14;

// Backend buckets daily volume by Lagos calendar day.
const lagosDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" });

/** Every day in the window, zero-filled - the analytics endpoint omits empty days. */
function lastNDays(n: number, data: CollectionsDay[]): CollectionsDay[] {
  const byDate = new Map(data.map((d) => [d.date, d]));
  return Array.from({ length: n }, (_, i) => {
    const date = lagosDay.format(new Date(Date.now() - (n - 1 - i) * 86_400_000));
    return byDate.get(date) ?? { date, count: 0, volume: "0" };
  });
}

/** NUBAN reads in 4-3-3 groups, the way it's said aloud. */
function groupAccountNumber(value: string) {
  return value.length === 10 ? `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}` : value;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const since = new Date(Date.now() - (CHART_DAYS - 1) * 86_400_000);
  since.setHours(0, 0, 0, 0);

  const client = await authedBackendClient();
  // virtualaccounts:read and transactions:read aren't in every role
  // template's fixed permission set (doc F6 - DEVELOPER has neither) - an
  // invited teammate under that role legitimately 403s on both. safeCall
  // degrades that to an empty state instead of crashing the page.
  const [me, virtualAccounts, recentTransactions, collected, status] = await Promise.all([
    client.users.me(),
    safeCall(client.virtualAccounts.listMine({ size: 5 })),
    safeCall(client.transactions.list({}, { page: 0, size: 5 })),
    safeCall(client.transactions.analytics({ type: "CREDIT", fromDate: since.toISOString() })),
    computeOnboardingStatus(),
  ]);
  const account = virtualAccounts?.content[0];
  const steps = activationSteps(status);
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);
  const activationComplete = isActivationDone(status);

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
                className="inline-flex h-9 items-center rounded-lg bg-cream px-3.5 text-[13.5px] font-semibold text-ink transition-colors hover:bg-sand"
              >
                Send money
              </Link>
              <Link
                href="/dashboard/transactions"
                className="inline-flex h-9 items-center rounded-lg border border-brand-line px-3.5 text-[13.5px] font-semibold text-cream transition-colors hover:bg-brand-hover"
              >
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
                {me.businessName ?? `${me.firstName} ${me.lastName}`} · {account?.currency ?? "NGN"}
              </p>
            </div>
            {account && (
              <CopyButton
                label="Copy account details"
                value={`${account.accountNumber} · ${me.businessName ?? `${me.firstName} ${me.lastName}`}`}
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
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-ink"
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
                <p className="font-mono text-[11px] text-subtle">{formatDate(txn.createdAt)}</p>
              </div>
              <p className="hidden text-[12.5px] text-subtle sm:block">
                {txn.transferGroupId ? "Transfer" : txn.transactionType === "CREDIT" ? "Credit" : "Debit"}
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
        {!activationComplete ? (
          <Card className="p-[22px]">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-bold text-ink">Finish activation</h2>
              <p className="font-mono text-xs text-subtle">
                {doneCount} of {steps.length}
              </p>
            </div>
            <div
              className="mb-3.5 mt-3 h-1.5 overflow-hidden rounded-full bg-line-soft"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-valuenow={doneCount}
              aria-label="Activation progress"
            >
              <div className="h-full bg-brand" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
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
            {[
              { href: "/dashboard/send", label: "Send money", hint: "Pay another Napayment account" },
              { href: "/dashboard/transactions", label: "Transactions", hint: "Search, filter and inspect payments" },
              { href: "/dashboard/settings/api-keys", label: "API keys & webhooks", hint: "Connect your own server" },
              { href: "/dashboard/settings/team", label: "Team", hint: "Invite people and manage roles" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="group flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink group-hover:text-brand">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-subtle">{item.hint}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
