"use client";

import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import type { TransactionAnalyticsResponse } from "@napayment/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { DailyVolumeChart } from "./daily-volume-chart";
import { formatNaira } from "@/lib/utils";

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: typeof ArrowDownLeft;
  tone?: "success" | "danger";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          {Icon && (
            <Icon
              className={cnTone(tone)}
            />
          )}
          {label}
        </CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function cnTone(tone?: "success" | "danger") {
  return tone === "success" ? "size-3.5 text-success" : tone === "danger" ? "size-3.5 text-danger" : "size-3.5";
}

export function TransactionAnalytics({
  analytics,
  loading,
}: {
  analytics: TransactionAnalyticsResponse | undefined;
  loading: boolean;
}) {
  if (loading && !analytics) {
    return <div className="h-40 animate-pulse rounded-lg bg-navy-50" />;
  }
  if (!analytics) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Transactions" value={String(analytics.totalCount)} icon={TrendingUp} />
        <StatTile label="Total volume" value={formatNaira(analytics.totalVolume)} />
        <StatTile
          label="Credit volume"
          value={formatNaira(analytics.creditVolume)}
          icon={ArrowDownLeft}
          tone="success"
        />
        <StatTile
          label="Debit volume"
          value={formatNaira(analytics.debitVolume)}
          icon={ArrowUpRight}
          tone="danger"
        />
        <StatTile label="Net volume" value={formatNaira(analytics.netVolume)} />
        <StatTile label="Average amount" value={formatNaira(analytics.averageAmount)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily volume</CardTitle>
          <CardDescription>Sum of transaction amounts per day, for the filtered range.</CardDescription>
        </CardHeader>
        <CardContent>
          <DailyVolumeChart data={analytics.dailyVolume} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.byStatus.length === 0 && <p className="text-sm text-navy-400">No data</p>}
            {analytics.byStatus.map((row) => (
              <div key={row.status} className="flex items-center justify-between text-sm">
                <StatusBadge status={row.status} />
                <span className="text-navy-600">
                  {row.count} · {formatNaira(row.volume)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.byType.length === 0 && <p className="text-sm text-navy-400">No data</p>}
            {analytics.byType.map((row) => (
              <div key={row.type} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium text-navy-800">
                  {row.type === "CREDIT" ? (
                    <ArrowDownLeft className="size-3.5 text-success" />
                  ) : (
                    <ArrowUpRight className="size-3.5 text-danger" />
                  )}
                  {row.type}
                </span>
                <span className="text-navy-600">
                  {row.count} · {formatNaira(row.volume)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
