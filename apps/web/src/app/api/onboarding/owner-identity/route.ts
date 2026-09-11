import { NextResponse } from "next/server";
import { ownerIdentitySchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const result = await client.kyc.getOwnerIdentity();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await parseBody(request, ownerIdentitySchema);
    const client = await authedBackendClient();
    // Backend requires blank-string-or-absent, not "" for the unset one; the
    // schema's z.literal("") branch already lets the empty string through -
    // normalize it to undefined so the backend's own bvn-xor-nin check sees
    // a clean absence rather than an empty string.
    const result = await client.kyc.updateOwnerIdentity({
      bvn: body.bvn || undefined,
      nin: body.nin || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
