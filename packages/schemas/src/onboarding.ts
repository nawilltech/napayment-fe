import { z } from "zod";

/**
 * Client-side validation for the onboarding flow, mirroring the backend's own
 * Bean Validation constraints on each of these now-real endpoints (business
 * KYC, owner identity, team invites, webhook config, contact settings - see
 * docs/nawill-pay-frontend.md doc F6). Kept here, in the shared package, on
 * purpose: the *shape* of this data is a product decision independent of
 * which layer validates it, and a mobile client will want the same rules.
 */

// ---- Business KYC ----------------------------------------------------------

export const businessDetailsSchema = z.object({
  registeredName: z.string().min(2, "Required"),
  cacNumber: z
    .string()
    .min(1, "Required")
    .regex(/^(RC|BN|IT)\d{4,10}$/i, "Format like RC1234567"),
  businessType: z.enum([
    "SOLE_PROPRIETORSHIP",
    "LIMITED_LIABILITY",
    "PARTNERSHIP",
    "NGO",
    "OTHER",
  ]),
  industry: z.string().min(1, "Required"),
  countryId: z.string().uuid("Select a country"),
  stateId: z.string().uuid("Select a state"),
  addressLine: z.string().min(3, "Required"),
});
export type BusinessDetailsInput = z.infer<typeof businessDetailsSchema>;

export const KYC_DOCUMENT_TYPES = [
  "CAC_CERTIFICATE",
  "MEMORANDUM_AND_ARTICLES",
  "PROOF_OF_ADDRESS",
  "DIRECTOR_VALID_ID",
] as const;
export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

export const KYC_DOCUMENT_LABELS: Record<KycDocumentType, string> = {
  CAC_CERTIFICATE: "CAC Certificate of Incorporation",
  MEMORANDUM_AND_ARTICLES: "Memorandum & Articles of Association",
  PROOF_OF_ADDRESS: "Proof of Business Address (utility bill, max 3 months old)",
  DIRECTOR_VALID_ID: "Director/Owner Valid ID (NIN, passport, or driver's licence)",
};

export const ownerIdentitySchema = z
  .object({
    bvn: z
      .string()
      .regex(/^\d{11}$/, "BVN must be 11 digits")
      .optional()
      .or(z.literal("")),
    nin: z
      .string()
      .regex(/^\d{11}$/, "NIN must be 11 digits")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => !!data.bvn || !!data.nin, {
    message: "Provide either a BVN or an NIN",
    path: ["bvn"],
  });
export type OwnerIdentityInput = z.infer<typeof ownerIdentitySchema>;

export const KYC_STATUSES = ["NOT_STARTED", "PENDING_REVIEW", "VERIFIED", "REJECTED"] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

// ---- Team invites ------------------------------------------------------------

export const ROLE_TEMPLATES = ["ADMIN", "DEVELOPER", "ACCOUNT_OFFICER"] as const;
export type RoleTemplate = (typeof ROLE_TEMPLATES)[number];

/**
 * `permissionNames` is reference/display-only now - the backend's own
 * `RoleTemplate` enum (onboarding-auth-rbac) owns the authoritative mapping
 * and creates/reuses the role server-side on invite; the frontend used to
 * resolve this itself via POST /api/v1/roles before that endpoint existed.
 * Kept here in sync so the description text stays accurate.
 */
export const ROLE_TEMPLATE_META: Record<
  RoleTemplate,
  { label: string; description: string; permissionNames: string[] }
> = {
  ADMIN: {
    label: "Admin",
    description: "Full access to transactions, settlements, team, and API keys.",
    permissionNames: [
      "transactions:read",
      "transactions:create",
      "virtualaccounts:read",
      "settlements:read",
      "settlements:manage",
      "apikeys:manage",
      "paymentlinks:manage",
      "paymentlinks:read",
      "temporaryaccounts:manage",
      "roles:manage",
    ],
  },
  DEVELOPER: {
    label: "Developer",
    description: "Manages API keys, webhooks, and integration surfaces only.",
    permissionNames: ["apikeys:manage", "paymentlinks:read", "temporaryaccounts:manage"],
  },
  ACCOUNT_OFFICER: {
    label: "Account Officer",
    description: "Read-only access to transactions and settlement history.",
    permissionNames: ["transactions:read", "settlements:read", "virtualaccounts:read"],
  },
};

export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Enter a valid email"),
  roleTemplate: z.enum(ROLE_TEMPLATES),
  message: z.string().max(280, "Keep it under 280 characters").optional(),
});
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;

export const INVITE_STATUSES = ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

// ---- API keys & webhooks -----------------------------------------------------

export const ipWhitelistEntrySchema = z.object({
  cidr: z
    .string()
    .regex(
      /^(\d{1,3}\.){3}\d{1,3}(\/(\d|[1-2]\d|3[0-2]))?$/,
      "Enter a valid IP address or CIDR range, e.g. 192.168.1.0/24",
    ),
});
export type IpWhitelistEntryInput = z.infer<typeof ipWhitelistEntrySchema>;

export const webhookConfigSchema = z.object({
  callbackUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  webhookUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});
export type WebhookConfigInput = z.infer<typeof webhookConfigSchema>;

// ---- Contact settings ---------------------------------------------------------

export const contactSettingsSchema = z.object({
  disputeEmails: z.array(z.string().email()).default([]),
  refundEmails: z.array(z.string().email()).default([]),
  supportEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  generalEmail: z.string().email("Enter a valid email"),
});
export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
