import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, ErrorCode } from "@napayment/api-client";
import { formatDate, formatDateTime } from "@napayment/format";
import { KYC_DOCUMENT_LABELS } from "@napayment/schemas";
import { Alert } from "@napayment/ui/alert";
import { StatusBadge } from "@napayment/ui/badge";
import { buttonVariants } from "@napayment/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@napayment/ui/card";
import { DetailList } from "@napayment/ui/detail-list";
import { TableCard } from "@napayment/ui/table";
import { AuditLogTable } from "@/components/audit-log-table";
import { KycReview } from "@/components/kyc-review";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Business — Napayment Admin" };

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await authedBackendClient();
  const [business, activity] = await Promise.all([
    client.admin.getBusiness(id).catch((error) => {
      if (error instanceof ApiError && error.is(ErrorCode.BUSINESS_NOT_FOUND)) notFound();
      throw error;
    }),
    client.admin.listAuditLogs({ businessId: id }, { size: 15 }),
  ]);
  const { summary } = business;
  const awaiting = summary.kycStatus === "PENDING_REVIEW";

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="text-xl">{summary.name}</CardTitle>
                <CardDescription>
                  {summary.ownerName} · {summary.ownerEmail} · joined {formatDate(summary.createdAt)}
                </CardDescription>
              </div>
              <StatusBadge status={summary.kycStatus} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {awaiting && (
              <>
                <p className="text-[13.5px] text-muted">
                  Submitted for review {summary.kycSubmittedAt ? formatDateTime(summary.kycSubmittedAt) : ""}. Check the
                  details, identity and documents, then decide.
                </p>
                <KycReview businessId={summary.id} />
              </>
            )}
            {summary.kycStatus === "REJECTED" && business.kycReviewNote && (
              <Alert variant="warning">
                Rejected {business.kycReviewedAt && formatDateTime(business.kycReviewedAt)}: {business.kycReviewNote}
              </Alert>
            )}
            {summary.kycStatus === "VERIFIED" && business.kycReviewedAt && (
              <Alert variant="success">Verified {formatDateTime(business.kycReviewedAt)}.</Alert>
            )}
            <Link
              href={`/transactions?businessId=${summary.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View this business&apos;s transactions
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                ["Registered name", summary.name],
                ["CAC number", summary.cacNumber],
                [
                  "CAC registry",
                  summary.cacVerified
                    ? `Matched: ${business.cacVerifiedName ?? "—"}`
                    : business.cacVerificationSource
                      ? "No match"
                      : "Not checked",
                ],
                ["Business type", business.businessType?.replaceAll("_", " ")],
                ["Industry", business.industry],
                ["Address", business.addressLine],
                ["Owner phone", business.ownerPhoneNo],
                ["Details updated", business.kycDetailsUpdatedAt && formatDateTime(business.kycDetailsUpdatedAt)],
              ]}
            />
          </CardContent>
        </Card>

        <div className="space-y-2.5">
          <h2 className="text-[15px] font-bold text-ink">Activity</h2>
          <TableCard>
            <AuditLogTable entries={activity.content} showBusiness={false} />
          </TableCard>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Owner identity</CardTitle>
            <CardDescription>Numbers are masked - reviewers need the check result, not the number.</CardDescription>
          </CardHeader>
          <CardContent>
            {business.ownerIdentity ? (
              <DetailList
                items={[
                  ["BVN", business.ownerIdentity.bvn],
                  ["NIN", business.ownerIdentity.nin],
                  ["Verified", business.ownerIdentity.verified ? "Yes" : "No"],
                ]}
              />
            ) : (
              <p className="text-[13.5px] text-subtle">Not submitted yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>{business.documents.length} of 4 uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-line-soft">
              {business.documents.length === 0 && <li className="py-2 text-[13.5px] text-subtle">None yet.</li>}
              {business.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink">{KYC_DOCUMENT_LABELS[doc.type]}</span>
                    <span className="block truncate font-mono text-[11.5px] text-subtle">
                      {doc.fileName} · {(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </span>
                  <a href={`/api/kyc-documents/${doc.id}`} className="shrink-0 text-[13px] font-semibold text-link hover:text-ink">
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
