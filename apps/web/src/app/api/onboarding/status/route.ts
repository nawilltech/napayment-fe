import { NextResponse } from "next/server";
import { getSession } from "@/server/session";
import { computeOnboardingStatus } from "@/server/onboarding-status";
import { handleRouteError, notAuthenticatedResponse } from "@napayment/bff/route-helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return notAuthenticatedResponse();
    const status = await computeOnboardingStatus();
    return NextResponse.json(status);
  } catch (error) {
    return handleRouteError(error);
  }
}
