import { NextResponse } from "next/server";
import { inviteTeamMemberSchema, ROLE_TEMPLATE_META } from "@napayment/schemas";
import { getSession } from "@/server/session";
import { authedBackendClient } from "@/server/backend-client";
import { createInvite, listInvites } from "@/server/dev-store";
import { handleRouteError, parseBody } from "@/server/route-helpers";

/**
 * TODO(FE-Gap, doc F9): suggested backend contract -
 * `POST /api/v1/team/invitations` (permission `roles:manage`, JWT) and
 * `GET /api/v1/team/invitations`, plus an email-dispatch side effect
 * (FR-Notif-1) instead of the dev-store's bare `token`/accept-link. The role
 * itself IS created for real, though (`POST /api/v1/roles` - see below) -
 * only the invitation/email envelope around it is stubbed.
 *
 * Create request:  { "email": "jane@business.com", "roleTemplate": "ADMIN", "message": "Join us on Nawill Pay" }
 * Create response: {
 *   "id": "inv_...", "email": "jane@business.com", "roleTemplate": "ADMIN",
 *   "roleId": "<real backend role id>", "status": "PENDING",
 *   "inviteUrl": "/invite/<token>", "invitedAt": "2026-09-11T10:00:00Z"
 * }
 * See docs/api-contracts/team-invites.json.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const invites = await listInvites(session.businessId);
  return NextResponse.json(
    invites.map((invite) => ({ ...invite, inviteUrl: `/invite/${invite.token}` })),
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

    const body = await parseBody(request, inviteTeamMemberSchema);
    const template = ROLE_TEMPLATE_META[body.roleTemplate];

    // Ensure a real backend role exists for this template, reusing one if
    // this business already created it for a previous invite.
    const client = await authedBackendClient();
    const existingRoles = await client.roles.list({ size: 100 });
    let role = existingRoles.content.find((r) => r.name === template.label);
    if (!role) {
      role = await client.roles.create({
        name: template.label,
        permissionNames: template.permissionNames,
      });
    }

    const invite = await createInvite(session.businessId, {
      email: body.email,
      roleTemplate: body.roleTemplate,
      roleId: role.id,
      message: body.message,
    });

    return NextResponse.json({ ...invite, inviteUrl: `/invite/${invite.token}` }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
