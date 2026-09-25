import { NextResponse } from "next/server";
import { setTransactionPinSchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, setTransactionPinSchema);
    const client = await authedBackendClient();
    const result = await client.auth.setTransactionPin({
      currentPassword: body.currentPassword,
      currentPin: body.currentPin || undefined,
      pin: body.pin,
      confirmPin: body.confirmPin,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
