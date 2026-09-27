import { NextResponse } from "next/server";
import { businessSignupSchema, individualSignupSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { sessionFromAuth } from "@napayment/bff/session-cookie";
import { setSession } from "@/server/session";
import { handleRouteError, ValidationError } from "@napayment/bff/route-helpers";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const isBusiness = Boolean(json.businessName);
    const schema = isBusiness ? businessSignupSchema : individualSignupSchema;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map((issue) => issue.message));
    }

    const auth = await (await publicBackendClient()).auth.signup(parsed.data);

    await setSession(sessionFromAuth(auth));

    return NextResponse.json({ userId: auth.userId, businessId: auth.businessId, isBusiness });
  } catch (error) {
    return handleRouteError(error);
  }
}
