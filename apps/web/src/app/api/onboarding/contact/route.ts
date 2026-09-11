import { NextResponse } from "next/server";
import { contactSettingsSchema } from "@napayment/schemas";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

export async function GET() {
  try {
    const client = await authedBackendClient();
    const result = await client.business.getContact();
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await parseBody(request, contactSettingsSchema);
    const client = await authedBackendClient();
    const result = await client.business.updateContact({
      disputeEmails: body.disputeEmails ?? [],
      refundEmails: body.refundEmails ?? [],
      supportEmail: body.supportEmail,
      generalEmail: body.generalEmail,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
