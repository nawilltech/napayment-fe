"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PAYMENT_METHODS, type BackendClient, type PaymentMethod } from "@napayment/api-client";
import { plural } from "@napayment/format";
import { loginSchema, VALIDATION_MESSAGES } from "@napayment/schemas";
import { accountKind } from "@napayment/bff/account";
import { toActionState, type ActionState } from "@napayment/bff/actions";
import { signIn, SignInNotAllowedError, signOut } from "@napayment/bff/auth";
import { ROUTES } from "@/lib/routes";
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
  revalidatePath(ROUTES.business(businessId));
  return state;
}

const rejectSchema = z.object({ reason: z.string().trim().min(1, VALIDATION_MESSAGES.kycRejectReasonRequired).max(512) });

export async function rejectKycAction(businessId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = rejectSchema.safeParse({ reason: form.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    await (await authedBackendClient()).admin.rejectKyc(businessId, parsed.data);
  });
  revalidatePath(ROUTES.business(businessId));
  return state;
}

const optionalPriority = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(1000)], { message: VALIDATION_MESSAGES.priorityInvalid })
  .transform((value) => (value === "" ? undefined : value));

const processorSchema = z.object({
  name: z.string().trim().min(2, VALIDATION_MESSAGES.processorNameRequired).max(64),
  code: z.string().trim().regex(/^[A-Za-z][A-Za-z0-9_]{1,31}$/, VALIDATION_MESSAGES.processorCodeInvalid),
  priority: optionalPriority,
  defaultEnabled: z.boolean(),
  methods: z.array(z.enum(PAYMENT_METHODS)).min(1, VALIDATION_MESSAGES.processorMethodsRequired),
});

export async function createProcessorAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = processorSchema.safeParse({
    name: form.get("name"),
    code: form.get("code"),
    priority: form.get("priority") ?? "",
    defaultEnabled: form.get("defaultEnabled") === "on",
    methods: form.getAll("methods"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    await (await authedBackendClient()).admin.paymentProcessors.create(parsed.data);
  });
  revalidatePath(ROUTES.paymentProcessors);
  return state;
}

const processorUpdateSchema = z.object({
  name: z.string().trim().min(2, VALIDATION_MESSAGES.processorNameRequired).max(64),
  priority: optionalPriority,
});

export async function updateProcessorAction(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = processorUpdateSchema.safeParse({ name: form.get("name"), priority: form.get("priority") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  return processorChange(id, (client) => client.admin.paymentProcessors.update(id, parsed.data));
}

export async function setProcessorMethodAction(id: string, method: PaymentMethod, enabled: boolean): Promise<ActionState> {
  return processorChange(id, (client) =>
    enabled
      ? client.admin.paymentProcessors.enableMethod(id, method)
      : client.admin.paymentProcessors.disableMethod(id, method),
  );
}

const passwordSchema = z.object({ password: z.string().min(1, VALIDATION_MESSAGES.passwordRequired) });

/** Platform switch - the staff member re-enters their password (FR-Admin-5). */
export async function setProcessorActiveAction(id: string, active: boolean, password: string): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({ password });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  return processorChange(id, (client) => client.admin.paymentProcessors.setActive(id, active, parsed.data));
}

/** "For all businesses" - sets the default and clears every business's own setting (FR-Admin-5). */
export async function setProcessorForAllAction(id: string, enabled: boolean, password: string): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({ password });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    const result = await (await authedBackendClient()).admin.paymentProcessors.setForAllBusinesses(id, enabled, parsed.data);
    const cleared = result.clearedBusinessSettings;
    return `${enabled ? "On" : "Off"} for all businesses. ${plural(cleared, "business setting")} cleared.`;
  });
  revalidateProcessor(id);
  return state;
}

export type BusinessProcessorSetting = "on" | "off" | "default";

export async function setBusinessProcessorAction(
  businessId: string,
  processorId: string,
  setting: BusinessProcessorSetting,
): Promise<ActionState> {
  const state = await toActionState(async () => {
    const processors = (await authedBackendClient()).admin.businessPaymentProcessors;
    if (setting === "default") await processors.reset(businessId, processorId);
    else await processors.set(businessId, processorId, setting === "on");
  });
  revalidatePath(ROUTES.business(businessId));
  revalidateProcessor(processorId);
  return state;
}

const deactivateSchema = z.object({
  reason: z.string().trim().min(1, VALIDATION_MESSAGES.deactivationReasonRequired).max(512),
});

export async function deactivateBusinessAction(businessId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = deactivateSchema.safeParse({ reason: form.get("reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    await (await authedBackendClient()).admin.deactivateBusiness(businessId, parsed.data);
  });
  revalidatePath(ROUTES.business(businessId));
  return state;
}

export async function activateBusinessAction(businessId: string): Promise<ActionState> {
  const state = await toActionState(async () => {
    await (await authedBackendClient()).admin.activateBusiness(businessId);
  });
  revalidatePath(ROUTES.business(businessId));
  return state;
}

async function processorChange(id: string, change: (client: BackendClient) => Promise<unknown>): Promise<ActionState> {
  const state = await toActionState(async () => {
    await change(await authedBackendClient());
  });
  revalidateProcessor(id);
  return state;
}

function revalidateProcessor(id: string) {
  revalidatePath(ROUTES.paymentProcessors);
  revalidatePath(ROUTES.paymentProcessor(id));
}

const collectionAccountSchema = z.object({
  bankId: z.string().min(1, VALIDATION_MESSAGES.bankRequired),
  accountNumber: z.string().regex(/^\d{10}$/, VALIDATION_MESSAGES.accountNumberInvalid),
});

export async function createCollectionAccountAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = collectionAccountSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const state = await toActionState(async () => {
    await (await authedBackendClient()).collectionAccount.create(parsed.data);
  });
  revalidatePath(ROUTES.collectionAccount);
  return state;
}
