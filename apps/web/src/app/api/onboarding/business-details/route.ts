import { NextResponse } from "next/server";
import { businessDetailsSchema } from "@napayment/schemas";
import { getSession } from "@/server/session";
import { getKyc, saveBusinessDetails } from "@/server/dev-store";
import { handleRouteError, parseBody } from "@/server/route-helpers";

/**
 * TODO(FE-Gap, doc F9): suggested backend contract - `PUT /api/v1/business/kyc/details`
 * (permission `business:kyc-manage`, JWT). Served from the dev-store today.
 *
 * Request body:
 * {
 *   "registeredName": "Nawill Technology Ltd",
 *   "cacNumber": "RC1234567",
 *   "businessType": "LIMITED_LIABILITY",
 *   "industry": "Financial Services",
 *   "countryId": "b7f2b5b0-...-uuid",
 *   "stateId": "9a1c1e40-...-uuid",
 *   "addressLine": "12 Admiralty Way, Lekki Phase 1"
 * }
 *
 * Response (200): the same body, persisted, plus `{ "updatedAt": "2026-09-11T10:00:00Z" }`.
 * See docs/api-contracts/business-details.json for a copy-pasteable example.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const kyc = await getKyc(session.businessId);
  return NextResponse.json(kyc.businessDetails ?? null);
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    const body = await parseBody(request, businessDetailsSchema);
    await saveBusinessDetails(session.businessId, body);
    return NextResponse.json({ ...body, updatedAt: new Date().toISOString() });
  } catch (error) {
    return handleRouteError(error);
  }
}
