import { NextResponse } from "next/server";
import { contactSettingsSchema } from "@napayment/schemas";
import { getSession } from "@/server/session";
import { getContactSettings, getProfile, saveContactSettings } from "@/server/dev-store";
import { handleRouteError, parseBody } from "@/server/route-helpers";

/**
 * TODO(FE-Gap, doc F9): suggested backend contract - `PUT /api/v1/business/contact`.
 * No equivalent entity/field exists on `Business` today. Served from the
 * dev-store, defaulting `generalEmail` to the signed-up account email.
 *
 * Request/Response: {
 *   "disputeEmails": ["disputes@business.com"],
 *   "refundEmails": [],
 *   "supportEmail": "support@business.com",
 *   "generalEmail": "owner@business.com"
 * }
 * See docs/api-contracts/contact-settings.json.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const settings = await getContactSettings(session.businessId);
  if (settings) return NextResponse.json(settings);
  const profile = await getProfile(session.userId);
  return NextResponse.json({
    disputeEmails: [],
    refundEmails: [],
    supportEmail: "",
    generalEmail: profile?.email ?? "",
  });
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    const body = await parseBody(request, contactSettingsSchema);
    const settings = {
      disputeEmails: body.disputeEmails ?? [],
      refundEmails: body.refundEmails ?? [],
      supportEmail: body.supportEmail,
      generalEmail: body.generalEmail,
    };
    await saveContactSettings(session.businessId, settings);
    return NextResponse.json(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}
