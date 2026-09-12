import { NextResponse } from "next/server";
import { businessSignupSchema, individualSignupSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { setSession } from "@/server/session";
import { handleRouteError, ValidationError } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const isBusiness = Boolean(json.businessName);
    const schema = isBusiness ? businessSignupSchema : individualSignupSchema;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((issue) => issue.message));
    }

    const auth = await publicBackendClient().auth.signup(parsed.data);

    await setSession({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      userId: auth.userId,
      businessId: auth.businessId,
      accessTokenExpiresAt: Date.now() + auth.expiresInSeconds * 1000,
    });

    return NextResponse.json({ userId: auth.userId, businessId: auth.businessId, isBusiness });
  } catch (error) {
    return handleRouteError(error);
  }
}
