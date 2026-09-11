import { NextResponse } from "next/server";
import { getSession } from "@/server/session";
import { revokeInvite } from "@/server/dev-store";
import { handleRouteError } from "@/server/route-helpers";

/** TODO(FE-Gap, doc F9): suggested backend contract - `DELETE /api/v1/team/invitations/{id}`. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    const { id } = await params;
    await revokeInvite(session.businessId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
