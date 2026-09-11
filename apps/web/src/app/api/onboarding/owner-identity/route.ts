import { NextResponse } from "next/server";
import { ownerIdentitySchema } from "@napayment/schemas";
import { getSession } from "@/server/session";
import { getKyc, saveOwnerIdentity } from "@/server/dev-store";
import { handleRouteError, parseBody } from "@/server/route-helpers";

/**
 * TODO(FE-Gap, doc F9): suggested backend contract - `PUT /api/v1/kyc/owner-identity`.
 * Realizes FR-8's "BVN/NIN verification for individuals" for the business
 * owner specifically. In production this should trigger a real BVN/NIN
 * verification call (third-party provider, per doc 1 §5 assumptions) rather
 * than just storing the number - flagged here so that's not lost when this
 * is implemented for real.
 *
 * Request: { "bvn": "12345678901" }  — or  { "nin": "12345678901" }
 * Response (200): { "bvn": "12345678901", "nin": null, "verified": false }
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const kyc = await getKyc(session.businessId);
  return NextResponse.json(kyc.ownerIdentity ?? null);
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    const body = await parseBody(request, ownerIdentitySchema);
    await saveOwnerIdentity(session.businessId, body);
    return NextResponse.json({ ...body, verified: false });
  } catch (error) {
    return handleRouteError(error);
  }
}
