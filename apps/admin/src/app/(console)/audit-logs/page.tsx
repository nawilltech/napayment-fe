import type { Metadata } from "next";
import { AUDIT_EVENT_TYPES, type AuditEventType, type AuditOutcome } from "@napayment/api-client";
import { buttonVariants } from "@napayment/ui/button";
import { Input } from "@napayment/ui/input";
import { Select } from "@napayment/ui/select";
import { TableCard, TablePager } from "@napayment/ui/table";
import { AuditLogTable } from "@/components/audit-log-table";
import { hrefWith, pageIndex } from "@/lib/search-params";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Audit logs — Napayment Admin" };

/** Read-only security trail, newest first. Filters are a plain GET form, so every view is a shareable URL. */
export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const logs = await (await authedBackendClient()).admin.listAuditLogs(
    {
      eventType: (params.eventType || undefined) as AuditEventType | undefined,
      outcome: (params.outcome || undefined) as AuditOutcome | undefined,
      email: params.email || undefined,
      businessId: params.businessId || undefined,
    },
    { page: pageIndex(params.page), size: 30 },
  );

  return (
    <div className="space-y-3.5">
      <form method="get" className="flex flex-wrap items-center gap-2.5">
        <Input name="email" defaultValue={params.email} placeholder="Search by email" aria-label="Email" className="h-10 min-w-[220px] flex-1" />
        <div className="w-full sm:w-[240px]">
          <Select name="eventType" defaultValue={params.eventType ?? ""} aria-label="Event" className="h-10">
            <option value="">All events</option>
            {AUDIT_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-[150px]">
          <Select name="outcome" defaultValue={params.outcome ?? ""} aria-label="Outcome" className="h-10">
            <option value="">Any outcome</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </Select>
        </div>
        {params.businessId && <input type="hidden" name="businessId" value={params.businessId} />}
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          Apply
        </button>
      </form>

      <TableCard>
        <AuditLogTable entries={logs.content} />
        <TablePager
          page={logs.page}
          totalPages={logs.totalPages}
          totalElements={logs.totalElements}
          noun="event"
          hrefFor={(p) => hrefWith("/audit-logs", params, { page: p + 1 })}
        />
      </TableCard>
    </div>
  );
}
