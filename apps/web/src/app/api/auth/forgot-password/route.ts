import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, forgotPasswordSchema);
    const result = await publicBackendClient().auth.forgotPassword(body);
    // NOTE (doc F9 gap): the backend returns resetToken directly today rather
    // than emailing/SMS'ing it - surfaced here only because there's nowhere
    // else for the user to get it from yet in this dev/demo build.
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
