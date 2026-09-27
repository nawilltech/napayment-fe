"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginSchema } from "@napayment/schemas";
import { accountKind } from "@napayment/bff/account";
import { toActionState, type ActionState } from "@napayment/bff/actions";
import { signIn, SignInNotAllowedError, signOut } from "@napayment/bff/auth";
import { authedBackendClient, publicBackendClient } from "@/server/backend-client";
import { sessionStore } from "@/server/session";

const STAFF_ONLY = "This console is for Napayment staff. Business accounts sign in to the Business Console.";

/** Staff only - a business or individual login is refused before any session is created. */
export async function signInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  try {
    const state = await toActionState(async () => {
      await signIn(sessionStore, await publicBackendClient(), parsed.data, (me) => accountKind(me) === "platform");
    });
    if (state.error) return state;
  } catch (error) {
    if (error instanceof SignInNotAllowedError) return { error: STAFF_ONLY };
    throw error;
  }

  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/overview");
}

export async function signOutAction() {
  await signOut(sessionStore, await publicBackendClient());
  redirect("/login");
}

export async function approveKycAction(businessId: string): Promise<ActionState> {
  const state = await toActionState(async () => {
    await (await authedBackendClient()).admin.approveKyc(businessId);
  });
  revalidatePath(`/businesses/${businessId}`);
  return state;
}

const rejectSchema = z.object({ reason: z.string().trim().min(1, "Give a reason - the business sees it").max(512) });

export async function rejectKycAction(businessId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = rejectSchema.safeParse({ reason: form.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    await (await authedBackendClient()).admin.rejectKyc(businessId, parsed.data);
  });
  revalidatePath(`/businesses/${businessId}`);
  return state;
}

const processorSchema = z.object({ name: z.string().trim().min(2, "Name the processor").max(64) });

export async function createProcessorAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = processorSchema.safeParse({ name: form.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    await (await authedBackendClient()).paymentProcessors.create(parsed.data);
  });
  revalidatePath("/processors");
  return state;
}

const collectionAccountSchema = z.object({
  bankId: z.string().min(1, "Choose the bank"),
  accountNumber: z.string().regex(/^\d{10}$/, "Account number is 10 digits"),
});

export async function createCollectionAccountAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = collectionAccountSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    await (await authedBackendClient()).collectionAccount.create(parsed.data);
  });
  revalidatePath("/collection-account");
  return state;
}
