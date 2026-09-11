import { NextResponse } from "next/server";
import { getSession } from "@/server/session";
import { getProfile } from "@/server/dev-store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const profile = await getProfile(session.userId);
  return NextResponse.json({
    userId: session.userId,
    businessId: session.businessId,
    profile,
  });
}
