import Link from "next/link";
import type { BusinessKycStatus } from "@napayment/api-client";
import { formatDate } from "@napayment/format";
import { Badge, StatusBadge } from "@napayment/ui/badge";
import { Input } from "@napayment/ui/input";
import { Table, TableCard, TableMessage, TablePager, Td, Th, THead, Tr } from "@napayment/ui/table";
import { cn } from "@napayment/ui/lib/cn";
import { authedBackendClient } from "@/server/backend-client";
import { ROUTES } from "@/lib/routes";
import { hrefWith, pageIndex } from "@/lib/search-params";

const STATUS_CHIPS: { value?: BusinessKycStatus; label: string }[] = [
  { label: "All" },
  { value: "PENDING_REVIEW", label: "Awaiting review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NOT_STARTED", label: "Not started" },
];

/**
 * Searchable, paginated business table driven by the URL. `/kyc` pins the
 * status to PENDING_REVIEW (the backend returns that queue oldest-first).
 */
export async function BusinessList({
  path,
  params,
  pinnedStatus,
}: {
  path: string;
  params: { term?: string; kycStatus?: string; status?: string; page?: string };
  pinnedStatus?: BusinessKycStatus;
}) {
  const kycStatus = pinnedStatus ?? (params.kycStatus as BusinessKycStatus | undefined);
  const deactivatedOnly = params.status === "INACTIVE";
  const page = pageIndex(params.page);
  const businesses = await (await authedBackendClient()).admin.listBusinesses(
    { term: params.term || undefined, kycStatus, status: deactivatedOnly ? "INACTIVE" : undefined },
    { page, size: 20 },
  );
  const queue = kycStatus === "PENDING_REVIEW";

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <form method="get" className="min-w-[240px] flex-1">
          {!pinnedStatus && kycStatus && <input type="hidden" name="kycStatus" value={kycStatus} />}
          {deactivatedOnly && <input type="hidden" name="status" value="INACTIVE" />}
          <Input name="term" defaultValue={params.term} placeholder="Search by name or CAC number" aria-label="Search businesses" className="h-10" />
        </form>
        {!pinnedStatus && (
          <nav className="flex flex-wrap gap-2" aria-label="Filter by KYC status">
            {STATUS_CHIPS.map((chip) => {
              const on = (chip.value ?? "") === (kycStatus ?? "");
              return (
                <Link
                  key={chip.label}
                  href={hrefWith(path, { term: params.term, status: params.status }, { kycStatus: chip.value })}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    on ? "border-brand bg-brand text-cream" : "border-line bg-surface text-muted hover:border-tan hover:text-ink",
                  )}
                >
                  {chip.label}
                </Link>
              );
            })}
            <Link
              href={hrefWith(path, { term: params.term, kycStatus }, { status: deactivatedOnly ? undefined : "INACTIVE" })}
              aria-current={deactivatedOnly ? "page" : undefined}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                deactivatedOnly ? "border-danger bg-danger text-white" : "border-line bg-surface text-muted hover:border-tan hover:text-ink",
              )}
            >
              Deactivated
            </Link>
          </nav>
        )}
      </div>

      <TableCard>
        <Table minWidth={760}>
          <THead>
            <Th>Business</Th>
            <Th>Owner</Th>
            <Th>CAC</Th>
            <Th>KYC</Th>
            <Th>Account</Th>
            <Th align="right">{queue ? "Submitted" : "Joined"}</Th>
          </THead>
          <tbody>
            {businesses.content.length === 0 && (
              <TableMessage colSpan={6}>{queue ? "Nothing awaiting review." : "No businesses match."}</TableMessage>
            )}
            {businesses.content.map((b) => (
              <Tr key={b.id} className="hover:bg-paper">
                <Td>
                  <Link href={ROUTES.business(b.id)} className="font-semibold text-ink hover:text-link">
                    {b.name}
                  </Link>
                </Td>
                <Td className="text-muted">
                  <span className="block">{b.ownerName ?? "—"}</span>
                  <span className="block text-xs text-subtle">{b.ownerEmail}</span>
                </Td>
                <Td className="font-mono text-xs text-muted">
                  {b.cacNumber ?? "—"}
                  {b.cacVerified && <span className="ml-1.5 text-success" title="Matched in the CAC registry">✓</span>}
                </Td>
                <Td>
                  <StatusBadge status={b.kycStatus} />
                </Td>
                <Td>
                  <Badge variant={b.status === "ACTIVE" ? "success" : "danger"}>
                    {b.status === "ACTIVE" ? "Active" : "Deactivated"}
                  </Badge>
                </Td>
                <Td align="right" className="whitespace-nowrap font-mono text-xs text-subtle">
                  {formatDate(queue ? (b.kycSubmittedAt ?? b.createdAt) : b.createdAt)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <TablePager
          page={businesses.page}
          totalPages={businesses.totalPages}
          totalElements={businesses.totalElements}
          noun="business"
          hrefFor={(p) => hrefWith(path, params, { page: p + 1 })}
        />
      </TableCard>
    </div>
  );
}
