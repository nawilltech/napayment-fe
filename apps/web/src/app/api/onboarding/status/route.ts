import { NextResponse } from "next/server";
import { getSession } from "@/server/session";
import { computeOnboardingStatus } from "@/server/onboarding-status";
import { handleRouteError } from "@/server/route-helpers";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    const status = await computeOnboardingStatus(session);
    return NextResponse.json(status);
  } catch (error) {
    return handleRouteError(error);
  }
}
