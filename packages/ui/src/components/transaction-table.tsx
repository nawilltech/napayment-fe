"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { PageResponse, TransactionResponse } from "@napayment/api-client";
import { StatusBadge } from "./badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { describeTransaction, formatDateTime, formatNaira } from "@napayment/format";
import { DetailList } from "./detail-list";
import { Table, TableCard, TableMessage, TablePager, Td, Th, THead, Tr } from "./table";

/** Direction arrow + kind ("Transfer" / "Credit" / "Debit"), shared by the table and the phone list. */
function TransactionKindLabel({ txn, className }: { txn: TransactionResponse; className?: string }) {
  const { credit, kind } = describeTransaction(txn);
  const Icon = credit ? ArrowDownLeft : ArrowUpRight;
  return (
    <span className={className}>
      <Icon className={credit ? "size-3.5 shrink-0 text-success" : "size-3.5 shrink-0 text-danger"} />
      {kind}
    </span>
  );
}

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
    <TableCard>
      <Table minWidth={720} className="hidden sm:block">
        <THead>
          <Th>Session ID</Th>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th align="right">Charge</Th>
          <Th align="right">Amount</Th>
          <Th align="right">Date</Th>
        </THead>
        <tbody>
          {loading && !data && <TableMessage colSpan={6} loading />}
          {!loading && data?.content.length === 0 && (
            <TableMessage colSpan={6}>No transactions match these filters.</TableMessage>
          )}
          {data?.content.map((txn) => (
            <Tr key={txn.id} onActivate={() => setSelected(txn)}>
              <Td className="font-mono text-xs text-muted">{txn.sessionId}</Td>
              <Td>
                <TransactionKindLabel txn={txn} className="flex items-center gap-1.5 text-[13px] text-muted" />
              </Td>
              <Td>
                <StatusBadge status={txn.transactionStatus} />
              </Td>
              <Td align="right" className="font-mono text-xs text-subtle">
                {formatNaira(txn.charge)}
              </Td>
              <Td align="right" className="font-mono text-ink">
                {formatNaira(txn.amount)}
              </Td>
              <Td align="right" className="whitespace-nowrap font-mono text-xs text-subtle">
                {formatDateTime(txn.createdAt)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      {/* Phones: a stacked list keeps amount and status on screen instead of a sideways-scrolling table. */}
      <ul className="divide-y divide-line-soft sm:hidden">
        {loading &&
          !data &&
          Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="px-4 py-3.5">
              <div className="h-9 animate-pulse rounded bg-line-soft" />
            </li>
          ))}
        {!loading && data?.content.length === 0 && (
          <li className="px-4 py-12 text-center text-[13.5px] text-subtle">No transactions match these filters.</li>
        )}
        {data?.content.map((txn) => (
          <li key={txn.id}>
            <button
              type="button"
              onClick={() => setSelected(txn)}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left active:bg-paper"
            >
              <span className="min-w-0">
                <TransactionKindLabel
                  txn={txn}
                  className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink"
                />
                <span className="mt-0.5 block truncate font-mono text-[11px] text-subtle">
                  {formatDateTime(txn.createdAt)} · ···{txn.sessionId.slice(-6)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-[13.5px] text-ink">{formatNaira(txn.amount)}</span>
                <StatusBadge status={txn.transactionStatus} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {data && (
        <TablePager
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          noun="transaction"
          onPageChange={onPageChange}
        />
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction detail</DialogTitle>
            <DialogDescription>{selected?.id}</DialogDescription>
          </DialogHeader>
          {selected && (
            <DetailList
              items={[
                ["Session ID", selected.sessionId],
                ["Type", selected.transactionType],
                ["Status", selected.transactionStatus],
                ["Amount", formatNaira(selected.amount)],
                ["Charge", formatNaira(selected.charge)],
                ["Virtual account", selected.virtualAccountId],
                ["Payment processor", selected.paymentProcessorId ?? "— (peer-to-peer transfer)"],
                ["Created", formatDateTime(selected.createdAt)],
              ]}
            />
          )}
        </DialogContent>
      </Dialog>
    </TableCard>
  );
}
