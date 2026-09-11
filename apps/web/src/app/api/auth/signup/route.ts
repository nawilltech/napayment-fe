import { NextResponse } from "next/server";
import { businessSignupSchema, individualSignupSchema } from "@napayment/schemas";
import { publicBackendClient } from "@/server/backend-client";
import { setSession } from "@/server/session";
import { saveProfile } from "@/server/dev-store";
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
      userId: auth.userId,
      businessId: auth.businessId,
      expiresAt: Date.now() + auth.expiresInSeconds * 1000,
    });

    // TODO(FE-Gap, doc F9): there is no GET /users/me on the backend yet, so
    // we cache what the signup form itself submitted for display purposes.
    await saveProfile({
      userId: auth.userId,
      businessId: auth.businessId,
      firstName: parsed.data.firstName,
      middleName: parsed.data.middleName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phoneNo: parsed.data.phoneNo,
      businessName: isBusiness ? (json.businessName as string) : undefined,
      cacNumber: isBusiness ? (json.cacNumber as string) : undefined,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ userId: auth.userId, businessId: auth.businessId, isBusiness });
  } catch (error) {
    return handleRouteError(error);
  }
}
