import { NextResponse } from "next/server";
import { loginSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { setSession } from "@/server/session";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, loginSchema);
    const auth = await publicBackendClient().auth.login(body);

    await setSession({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      userId: auth.userId,
      businessId: auth.businessId,
      accessTokenExpiresAt: Date.now() + auth.expiresInSeconds * 1000,
    });

    return NextResponse.json({ userId: auth.userId, businessId: auth.businessId });
  } catch (error) {
    return handleRouteError(error);
  }
}
