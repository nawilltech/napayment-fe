import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { KycDocumentType, KycStatus, InviteStatus, RoleTemplate } from "@napayment/schemas";

/**
 * TODO(FE-Gap, docs/nawill-pay-frontend.md doc F9): stands in for backend
 * endpoints that don't exist yet - KYC upload/status, team invites, webhook
 * URL config, contact settings, and a cached profile (there's no
 * `GET /users/me` on the backend, so we cache what the signup form itself
 * submitted). Every read/write here is a JSON file under `.data/` at the repo
 * root, keyed by businessId/userId, so the onboarding flow is fully usable
 * end to end in dev without those backend endpoints existing.
 *
 * This is explicitly NOT how any of this should work in production - it's a
 * single JSON file with no auth boundary beyond "you can reach this Next.js
 * process," meant purely to make the UI buildable and demoable today. Each
 * function below is written so that replacing its body with a call into
 * `@napayment/api-client` once the real endpoint ships is a one-file change -
 * callers (the Route Handlers under src/app/api/onboarding/**) never touch
 * the JSON file directly.
 */

interface Profile {
  userId: string;
  businessId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNo: string;
  businessName?: string;
  cacNumber?: string;
  createdAt: string;
}

interface KycDocument {
  id: string;
  type: KycDocumentType;
  fileName: string;
  sizeBytes: number;
  storagePath: string;
  uploadedAt: string;
}

interface KycRecord {
  status: KycStatus;
  businessDetails?: Record<string, unknown>;
  ownerIdentity?: Record<string, unknown>;
  documents: KycDocument[];
  submittedAt?: string;
}

interface Invite {
  id: string;
  email: string;
  roleTemplate: RoleTemplate;
  roleId: string | null;
  status: InviteStatus;
  message?: string;
  token: string;
  invitedAt: string;
  respondedAt?: string;
}

interface WebhookConfig {
  callbackUrl?: string;
  webhookUrl?: string;
  updatedAt: string;
}

interface ContactSettings {
  disputeEmails: string[];
  refundEmails: string[];
  supportEmail?: string;
  generalEmail: string;
}

interface DevStoreData {
  profiles: Record<string, Profile>;
  kyc: Record<string, KycRecord>;
  invites: Record<string, Invite[]>;
  webhookConfig: Record<string, WebhookConfig>;
  contactSettings: Record<string, ContactSettings>;
}

const DATA_DIR = path.join(process.cwd(), "..", "..", ".data");
const STORE_PATH = path.join(DATA_DIR, "dev-store.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

const EMPTY_STORE: DevStoreData = {
  profiles: {},
  kyc: {},
  invites: {},
  webhookConfig: {},
  contactSettings: {},
};

// Serializes writes within this process so two near-simultaneous requests
// don't clobber each other's read-modify-write of the same JSON file.
let writeQueue: Promise<unknown> = Promise.resolve();

async function readStore(): Promise<DevStoreData> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return { ...EMPTY_STORE, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_STORE };
  }
}

async function mutate<T>(fn: (data: DevStoreData) => T): Promise<T> {
  const run = writeQueue.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const data = await readStore();
    const result = fn(data);
    await writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

// ---- Profile cache ---------------------------------------------------------

export async function saveProfile(profile: Profile) {
  await mutate((data) => {
    data.profiles[profile.userId] = profile;
  });
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const data = await readStore();
  return data.profiles[userId] ?? null;
}

export async function getProfileByBusinessId(businessId: string): Promise<Profile | null> {
  const data = await readStore();
  return Object.values(data.profiles).find((p) => p.businessId === businessId) ?? null;
}

// ---- KYC --------------------------------------------------------------------

export async function getKyc(businessId: string): Promise<KycRecord> {
  const data = await readStore();
  return data.kyc[businessId] ?? { status: "NOT_STARTED", documents: [] };
}

export async function saveBusinessDetails(businessId: string, details: Record<string, unknown>) {
  await mutate((data) => {
    const existing = data.kyc[businessId] ?? { status: "NOT_STARTED", documents: [] };
    existing.businessDetails = details;
    data.kyc[businessId] = existing;
  });
}

export async function saveOwnerIdentity(businessId: string, identity: Record<string, unknown>) {
  await mutate((data) => {
    const existing = data.kyc[businessId] ?? { status: "NOT_STARTED", documents: [] };
    existing.ownerIdentity = identity;
    data.kyc[businessId] = existing;
  });
}

export async function addKycDocument(
  businessId: string,
  doc: Omit<KycDocument, "id" | "uploadedAt">,
): Promise<KycDocument> {
  return mutate((data) => {
    const existing = data.kyc[businessId] ?? { status: "NOT_STARTED", documents: [] };
    const record: KycDocument = {
      ...doc,
      id: crypto.randomUUID(),
      uploadedAt: new Date().toISOString(),
    };
    existing.documents = existing.documents.filter((d) => d.type !== doc.type);
    existing.documents.push(record);
    data.kyc[businessId] = existing;
    return record;
  });
}

export async function submitKycForReview(businessId: string) {
  await mutate((data) => {
    const existing = data.kyc[businessId] ?? { status: "NOT_STARTED", documents: [] };
    existing.status = "PENDING_REVIEW";
    existing.submittedAt = new Date().toISOString();
    data.kyc[businessId] = existing;
  });
}

export function uploadsDirFor(businessId: string): string {
  return path.join(UPLOADS_DIR, businessId);
}

// ---- Team invites -------------------------------------------------------------

export async function listInvites(businessId: string): Promise<Invite[]> {
  const data = await readStore();
  return data.invites[businessId] ?? [];
}

export async function createInvite(
  businessId: string,
  input: { email: string; roleTemplate: RoleTemplate; roleId: string | null; message?: string },
): Promise<Invite> {
  return mutate((data) => {
    const invite: Invite = {
      id: crypto.randomUUID(),
      email: input.email,
      roleTemplate: input.roleTemplate,
      roleId: input.roleId,
      status: "PENDING",
      message: input.message,
      token: crypto.randomUUID(),
      invitedAt: new Date().toISOString(),
    };
    const list = data.invites[businessId] ?? [];
    list.push(invite);
    data.invites[businessId] = list;
    return invite;
  });
}

export async function revokeInvite(businessId: string, inviteId: string) {
  await mutate((data) => {
    const list = data.invites[businessId] ?? [];
    const invite = list.find((i) => i.id === inviteId);
    if (invite) {
      invite.status = "REVOKED";
      invite.respondedAt = new Date().toISOString();
    }
  });
}

export async function findInviteByToken(
  token: string,
): Promise<{ businessId: string; invite: Invite } | null> {
  const data = await readStore();
  for (const [businessId, list] of Object.entries(data.invites)) {
    const invite = list.find((i) => i.token === token);
    if (invite) return { businessId, invite };
  }
  return null;
}

export async function acceptInvite(token: string) {
  await mutate((data) => {
    for (const list of Object.values(data.invites)) {
      const invite = list.find((i) => i.token === token);
      if (invite) {
        invite.status = "ACCEPTED";
        invite.respondedAt = new Date().toISOString();
      }
    }
  });
}

// ---- Webhook / callback URL config --------------------------------------------

export async function getWebhookConfig(businessId: string): Promise<WebhookConfig | null> {
  const data = await readStore();
  return data.webhookConfig[businessId] ?? null;
}

export async function saveWebhookConfig(
  businessId: string,
  config: { callbackUrl?: string; webhookUrl?: string },
) {
  await mutate((data) => {
    data.webhookConfig[businessId] = { ...config, updatedAt: new Date().toISOString() };
  });
}

// ---- Contact settings -----------------------------------------------------------

export async function getContactSettings(businessId: string): Promise<ContactSettings | null> {
  const data = await readStore();
  return data.contactSettings[businessId] ?? null;
}

export async function saveContactSettings(businessId: string, settings: ContactSettings) {
  await mutate((data) => {
    data.contactSettings[businessId] = settings;
  });
}

// ---- Onboarding progress (derived, not stored) ---------------------------------

export async function getOnboardingProgress(businessId: string) {
  const data = await readStore();
  const kyc = data.kyc[businessId];
  const invites = data.invites[businessId] ?? [];
  const webhook = data.webhookConfig[businessId];
  return {
    businessDetailsDone: Boolean(kyc?.businessDetails),
    kycSubmitted: kyc?.status === "PENDING_REVIEW" || kyc?.status === "VERIFIED",
    teamInvited: invites.length > 0,
    webhookConfigured: Boolean(webhook?.callbackUrl || webhook?.webhookUrl),
  };
}
