import { NextResponse } from "next/server";
import { inviteTeamMemberSchema } from "@napayment/schemas";
import type { InviteResponse, RoleResponse } from "@napayment/api-client";
import { authedBackendClient } from "@/server/backend-client";
import { handleRouteError, parseBody } from "@/server/route-helpers";

/**
 * The backend's InviteResponse carries `roleId`, not the `roleTemplate` that
 * created it (it doesn't echo the template back - doc F6). We resolve
 * `roleId` against the caller's own roles here so the UI can show "Admin" /
 * "Developer" / "Account Officer" without a second round trip per row.
 */
function withRoleName(invite: InviteResponse, roles: RoleResponse[]) {
  return { ...invite, roleName: roles.find((r) => r.id === invite.roleId)?.name ?? "Unknown role" };
}

export async function GET() {
  try {
    const client = await authedBackendClient();
    const [invites, roles] = await Promise.all([
      client.team.listInvites(),
      client.roles.list({ size: 100 }),
    ]);
    return NextResponse.json(invites.map((invite) => withRoleName(invite, roles.content)));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, inviteTeamMemberSchema);
    const client = await authedBackendClient();
    const [invite, roles] = await Promise.all([
      client.team.createInvite(body),
      client.roles.list({ size: 100 }),
    ]);
    return NextResponse.json(withRoleName(invite, roles.content), { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
