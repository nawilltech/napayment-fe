"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { PageResponse, TransactionResponse } from "@napayment/api-client";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDate, formatNaira } from "@/lib/utils";

export function TransactionTable({
  data,
  loading,
  page,
  onPageChange,
}: {
  data: PageResponse<TransactionResponse> | undefined;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const [selected, setSelected] = useState<TransactionResponse | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-paper text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.1em] text-subtle">
              <th className="px-5 py-3 font-normal">Session ID</th>
              <th className="px-4 py-3 font-normal">Type</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 text-right font-normal">Charge</th>
              <th className="px-4 py-3 text-right font-normal">Amount</th>
              <th className="px-5 py-3 text-right font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              !data &&
              Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  <td colSpan={6} className="px-5 py-[11px]">
                    <div className="h-4 animate-pulse rounded bg-line-soft" />
                  </td>
                </tr>
              ))}
            {!loading && data?.content.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-subtle">
                  No transactions match these filters.
                </td>
              </tr>
            )}
            {data?.content.map((txn) => (
              <tr
                key={txn.id}
                onClick={() => setSelected(txn)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(txn))}
                className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-paper focus-visible:bg-paper focus-visible:outline-none"
              >
                <td className="px-5 py-[11px] font-mono text-xs text-muted">{txn.sessionId}</td>
                <td className="px-4 py-[11px]">
                  <span className="flex items-center gap-1.5 text-[13px] text-muted">
                    {txn.transactionType === "CREDIT" ? (
                      <ArrowDownLeft className="size-3.5 text-success" />
                    ) : (
                      <ArrowUpRight className="size-3.5 text-danger" />
                    )}
                    {txn.transferGroupId ? "TRANSFER" : txn.transactionType}
                  </span>
                </td>
                <td className="px-4 py-[11px]">
                  <StatusBadge status={txn.transactionStatus} />
                </td>
                <td className="px-4 py-[11px] text-right font-mono text-xs text-subtle">{formatNaira(txn.charge)}</td>
                <td className="px-4 py-[11px] text-right font-mono text-ink">{formatNaira(txn.amount)}</td>
                <td className="whitespace-nowrap px-5 py-[11px] text-right font-mono text-xs text-subtle">
                  {formatDate(txn.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalElements > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-5 py-3 text-[13px] text-subtle">
          <span>
            {data.totalElements} transaction{data.totalElements === 1 ? "" : "s"} · page {data.page + 1} of{" "}
            {Math.max(data.totalPages, 1)}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= data.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction detail</DialogTitle>
            <DialogDescription>{selected?.id}</DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="space-y-2 text-sm">
              {[
                ["Session ID", selected.sessionId],
                ["Type", selected.transactionType],
                ["Status", selected.transactionStatus],
                ["Amount", formatNaira(selected.amount)],
                ["Charge", formatNaira(selected.charge)],
                ["Virtual account", selected.virtualAccountId],
                ["Payment processor", selected.paymentProcessorId ?? "— (peer-to-peer transfer)"],
                ["Created", formatDate(selected.createdAt)],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-dashed border-line pb-2">
                  <dt className="text-subtle">{label}</dt>
                  <dd className="truncate font-mono text-[13px] text-ink">{val}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
