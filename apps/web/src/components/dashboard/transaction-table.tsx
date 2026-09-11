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
    <div className="rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-navy-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Session ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Charge</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {!loading && data?.content.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-navy-400">
                  No transactions match these filters.
                </td>
              </tr>
            )}
            {data?.content.map((txn) => (
              <tr
                key={txn.id}
                onClick={() => setSelected(txn)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-navy-50"
              >
                <td className="whitespace-nowrap px-4 py-3 text-navy-600">{formatDate(txn.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs text-navy-500">{txn.sessionId}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 font-medium text-navy-800">
                    {txn.transactionType === "CREDIT" ? (
                      <ArrowDownLeft className="size-3.5 text-success" />
                    ) : (
                      <ArrowUpRight className="size-3.5 text-danger" />
                    )}
                    {txn.transactionType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={txn.transactionStatus} />
                </td>
                <td className="px-4 py-3 text-right text-navy-500">{formatNaira(txn.charge)}</td>
                <td className="px-4 py-3 text-right font-semibold text-navy-900">{formatNaira(txn.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalElements > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-navy-500">
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
                ["Payment processor", selected.paymentProcessorId],
                ["Created", formatDate(selected.createdAt)],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-border pb-2">
                  <dt className="text-navy-400">{label}</dt>
                  <dd className="truncate font-medium text-navy-800">{val}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
