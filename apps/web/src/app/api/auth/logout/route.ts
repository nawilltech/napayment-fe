import { NextResponse } from "next/server";
import { signOut } from "@napayment/bff/auth";
import { publicBackendClient } from "@/server/backend-client";
import { sessionStore } from "@/server/session";

export async function POST() {
  await signOut(sessionStore, await publicBackendClient());
  return NextResponse.json({ ok: true });
}
