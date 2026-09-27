import { NextResponse, type NextRequest } from "next/server";
import { signOut } from "@napayment/bff/auth";
import { publicBackendClient } from "@/server/backend-client";
import { sessionStore } from "@/server/session";

/** Clears a session that isn't staff (see getStaff), then back to sign-in with the reason. */
export async function GET(request: NextRequest) {
  await signOut(sessionStore, await publicBackendClient());
  const url = new URL("/login", request.url);
  const reason = request.nextUrl.searchParams.get("reason");
  if (reason) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}
