import { NextResponse } from "next/server";
import { getSession } from "@/server/session";
import { getKyc, submitKycForReview } from "@/server/dev-store";
import { handleRouteError } from "@/server/route-helpers";
import { KYC_DOCUMENT_TYPES } from "@napayment/schemas";

/**
 * TODO(FE-Gap, doc F9): suggested backend contract - `POST /api/v1/kyc/submit`.
 * Moves the business's KYC record from being assembled to PENDING_REVIEW, at
 * which point a real backend would notify an admin queue (FR-3's admin
 * portal) for manual/automated review. Response: { "status": "PENDING_REVIEW", "submittedAt": "..." }
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const kyc = await getKyc(session.businessId);
    const missing = KYC_DOCUMENT_TYPES.filter(
      (type) => !kyc.documents.some((doc) => doc.type === type),
    );
    if (!kyc.businessDetails) {
      return NextResponse.json({ message: "Complete business details first" }, { status: 400 });
    }
    if (missing.length > 0) {
      return NextResponse.json(
        { message: `Missing documents: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    await submitKycForReview(session.businessId);
    return NextResponse.json({ status: "PENDING_REVIEW", submittedAt: new Date().toISOString() });
  } catch (error) {
    return handleRouteError(error);
  }
}
