import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDate, formatNaira, plural } from "@napayment/format";
import { Card } from "@napayment/ui/card";
import { CollectionsChart } from "@napayment/ui/collections-chart";
import { lastNDays, windowStart } from "@napayment/ui/lib/daily-series";
import { StatTile } from "@napayment/ui/stat-tile";
import { TableCard } from "@napayment/ui/table";
import { AuditLogTable } from "@/components/audit-log-table";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Overview — Napayment Admin" };

const CHART_DAYS = 14;

export default async function OverviewPage() {
  const client = await authedBackendClient();
  const [stats, queue, collected, recentEvents] = await Promise.all([
    client.admin.businessStats(),
    client.admin.listBusinesses({ kycStatus: "PENDING_REVIEW" }, { size: 5 }),
    client.transactions.analytics({ type: "CREDIT", fromDate: windowStart(CHART_DAYS).toISOString() }),
    client.admin.listAuditLogs({}, { size: 8 }),
  ]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        <StatTile label="Businesses" value={String(stats.total)} sub="On the platform" />
        <StatTile label="Awaiting KYC review" value={String(stats.byKycStatus.PENDING_REVIEW)} sub="Oldest first in the queue" />
        <StatTile label="Verified" value={String(stats.byKycStatus.VERIFIED)} sub={`${stats.byKycStatus.REJECTED} rejected`} />
        <StatTile label="Collected, 14 days" value={formatNaira(collected.creditVolume, { decimals: false })} sub={plural(collected.totalCount, "payment")} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="p-[22px]">
          <h2 className="mb-[18px] text-[15px] font-bold text-ink">Collected across the platform, last {CHART_DAYS} days</h2>
          <CollectionsChart days={lastNDays(CHART_DAYS, collected.dailyVolume)} />
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
            <h2 className="text-[15px] font-bold text-ink">Next up for review</h2>
            <Link href="/kyc" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:text-ink">
              Queue <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="divide-y divide-line-soft">
            {queue.content.length === 0 && <li className="px-5 py-8 text-center text-sm text-subtle">Nothing awaiting review.</li>}
            {queue.content.map((b) => (
              <li key={b.id}>
                <Link href={`/businesses/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-paper">
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{b.name}</span>
                    <span className="block truncate text-xs text-subtle">{b.ownerEmail}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-subtle">{b.kycSubmittedAt && formatDate(b.kycSubmittedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">Recent security events</h2>
          <Link href="/audit-logs" className="inline-flex items-center gap-1 text-[13px] font-semibold text-link hover:text-ink">
            All events <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <TableCard>
          <AuditLogTable entries={recentEvents.content} />
        </TableCard>
      </div>
    </div>
  );
}
