import { NextResponse } from "next/server";
import { acceptInviteSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { sessionFromAuth } from "@napayment/bff/session-cookie";
import { setSession } from "@/server/session";
import { handleRouteError, parseBody } from "@napayment/bff/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, acceptInviteSchema);
    const auth = await (await publicBackendClient()).auth.signupViaInvite(body);

    await setSession(sessionFromAuth(auth));

    return NextResponse.json({ userId: auth.userId, businessId: auth.businessId });
  } catch (error) {
    return handleRouteError(error);
  }
}
