import { NextResponse } from "next/server";
import { publicBackendClient } from "@/server/backend-client";
import { clearSession, getSession } from "@/server/session";

export async function POST() {
  const session = await getSession();
  if (session) {
    // Best-effort: revoke server-side so the refresh token can't be replayed
    // even if this cookie is somehow retained/leaked after logout. A failure
    // here (backend down, token already invalid) must never block the local
    // sign-out the user actually asked for.
    try {
      await (await publicBackendClient()).auth.logout({ refreshToken: session.refreshToken });
    } catch {
      // ignore - local session is cleared regardless, below
    }
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}
