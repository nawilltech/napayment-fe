import { NextResponse } from "next/server";
import { loginSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { signIn } from "@napayment/bff/auth";
import { sessionStore } from "@/server/session";
import { handleRouteError, parseBody } from "@napayment/bff/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, loginSchema);
    const auth = await signIn(sessionStore, await publicBackendClient(), body);

    return NextResponse.json({ userId: auth.userId, businessId: auth.businessId });
  } catch (error) {
    return handleRouteError(error);
  }
}
