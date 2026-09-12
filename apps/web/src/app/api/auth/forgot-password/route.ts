import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, forgotPasswordSchema);
    const result = await (await publicBackendClient()).auth.forgotPassword(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
