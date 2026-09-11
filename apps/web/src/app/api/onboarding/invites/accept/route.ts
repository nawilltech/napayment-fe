import { NextResponse } from "next/server";
import { findInviteByToken, acceptInvite } from "@/server/dev-store";
import { handleRouteError } from "@/server/route-helpers";

/**
 * TODO(FE-Gap, doc F9): the real flow needs a backend "join an existing
 * business" signup path - today's `POST /api/v1/auth/signup` always creates
 * a brand-new business (or a plain individual) and can't attach a new user
 * to an *existing* business_id under an invited role. This route marks the
 * invite accepted in the dev-store only; it does not create a backend user.
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (typeof token !== "string") {
      return NextResponse.json({ message: "Missing token" }, { status: 400 });
    }
    const found = await findInviteByToken(token);
    if (!found || found.invite.status !== "PENDING") {
      return NextResponse.json({ message: "This invite is no longer valid" }, { status: 404 });
    }
    await acceptInvite(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
