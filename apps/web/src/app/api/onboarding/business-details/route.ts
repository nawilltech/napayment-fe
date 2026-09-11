import { NextResponse } from "next/server";
import { businessDetailsSchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const result = await client.business.getKycDetails();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await parseBody(request, businessDetailsSchema);
    const client = await authedBackendClient();
    const result = await client.business.updateKycDetails(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
