import { NextResponse } from "next/server";
import { changePasswordSchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, changePasswordSchema);
    const client = await authedBackendClient();
    const result = await client.auth.changePassword({
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      confirmNewPassword: body.confirmPassword,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
