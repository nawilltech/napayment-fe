import Link from "next/link";
import type { AuditLogEntry } from "@napayment/api-client";
import { formatDateTime } from "@napayment/format";
import { Badge } from "@napayment/ui/badge";
import { Table, TableMessage, Td, Th, THead, Tr } from "@napayment/ui/table";

/** Security audit rows - the audit-logs page and each business's activity section. */
export function AuditLogTable({ entries, showBusiness = true }: { entries: AuditLogEntry[]; showBusiness?: boolean }) {
  const columns = showBusiness ? 6 : 5;
  return (
    <Table minWidth={showBusiness ? 900 : 720}>
      <THead>
        <Th>When</Th>
        <Th>Event</Th>
        <Th>Outcome</Th>
        <Th>Actor</Th>
        {showBusiness && <Th>Business</Th>}
        <Th>Detail</Th>
      </THead>
      <tbody>
        {entries.length === 0 && <TableMessage colSpan={columns}>No events match.</TableMessage>}
        {entries.map((entry) => (
          <Tr key={entry.id}>
            <Td className="whitespace-nowrap font-mono text-xs text-subtle">{formatDateTime(entry.occurredAt)}</Td>
            <Td className="font-mono text-xs text-ink">{entry.eventType.replaceAll("_", " ")}</Td>
            <Td>
              <Badge variant={entry.outcome === "SUCCESS" ? "success" : "danger"}>{entry.outcome}</Badge>
            </Td>
            <Td className="text-muted">
              <span className="block truncate">{entry.email ?? "—"}</span>
              {entry.ipAddress && <span className="block font-mono text-[11px] text-subtle">{entry.ipAddress}</span>}
            </Td>
            {showBusiness && (
              <Td className="font-mono text-xs">
                {entry.businessId ? (
                  <Link href={`/businesses/${entry.businessId}`} className="text-link hover:text-ink">
                    ···{entry.businessId.slice(-8)}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
            )}
            <Td className="max-w-[320px] truncate text-muted" title={entry.detail ?? undefined}>
              {entry.detail ?? "—"}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
