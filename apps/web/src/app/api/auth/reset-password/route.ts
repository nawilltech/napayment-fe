import { NextResponse } from "next/server";
import { resetPasswordSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, resetPasswordSchema);
    const result = await publicBackendClient().auth.resetPassword(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
