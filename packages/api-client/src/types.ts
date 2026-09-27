/**
 * Types mirroring the napayment backend's actual DTOs/enums, transcribed from
 * its controllers as of the `feat/pagination-and-term-search` branch - see
 * docs/nawill-pay-frontend.md doc F6 for the full endpoint-by-endpoint source.
 *
 * This is a hand-maintained stopgap. Once the backend's CORS gap (doc F9) is
 * closed and a codegen step against its live `/v3/api-docs` (springdoc-openapi)
 * is wired up, THAT generated schema becomes the source of truth and this file
 * should be replaced by it - see doc F4 "API client & type generation".
 */

import type { ErrorCode } from "./errors";

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  errorCode: ErrorCode;
  message: string;
  requestId: string | null;
  details: string[];
}

// ---- Auth ----------------------------------------------------------------

export interface SignupRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNo: string;
  password: string;
  confirmPassword: string;
  /** Presence of businessName triggers a business signup instead of an individual one. */
  businessName?: string;
  cacNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Returned by signup, signupViaInvite, login, AND refresh - refreshToken is
 * rotated (a new one issued) on every refresh call, single-use (NFR-7): the
 * caller must persist the new refreshToken and discard the old one every
 * time, never reuse a previously-seen one.
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  userId: string;
  /** Null for individual accounts and platform staff - only business accounts have one. */
  businessId: string | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  /** 6-digit code, delivered via the link emailed to the account's inbox. */
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * FR-Auth-2. `currentPin` is required only when the caller already has one
 * set (changing it) - omit/leave blank on a first-time set, the backend
 * validates against the caller's actual state, not the request shape.
 */
export interface SetTransactionPinRequest {
  currentPassword: string;
  currentPin?: string;
  pin: string;
  confirmPin: string;
}

/**
 * FR-Auth-1: peer-to-peer transfer between two Nawill virtual accounts.
 * `recipientIdentifier` is format-sniffed backend-side - a 10-digit numeric
 * string resolves as a Nawill account number, anything else as a phone
 * number.
 */
export interface TransferRequest {
  recipientIdentifier: string;
  amount: string;
  narration?: string;
  transactionPin: string;
}

export interface TransferResponse {
  id: string;
  transferGroupId: string;
  amount: string;
  recipientDisplayName: string;
  senderNewBalance: string;
  createdAt: string;
}

/** Confirm-before-send preview (GET /transfers/resolve?identifier=...). */
export interface TransferResolveResponse {
  displayName: string;
  accountNumberMasked: string;
}

export interface MessageResponse {
  message: string;
}

/** FR-5a's "join an existing business" signup variant - POST /api/v1/auth/signup/accept-invite. */
export interface AcceptInviteRequest {
  token: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNo: string;
  password: string;
}

// ---- Roles / RBAC ----------------------------------------------------------

export interface CreateRoleRequest {
  name: string;
  permissionNames: string[];
}

export interface RoleResponse {
  id: string;
  name: string;
  businessId: string;
  permissionNames: string[];
}

/** The full seeded permission catalog as of doc F6 - no backend constants class exists, these are literals. */
export const PERMISSIONS = [
  "transactions:create",
  "transactions:read",
  "virtualaccounts:read",
  "processors:configure",
  "processors:read",
  "roles:manage",
  "users:read",
  "settlements:read",
  "settlements:manage",
  "apikeys:manage",
  "paymentlinks:manage",
  "paymentlinks:read",
  "collection-account:manage",
  "temporaryaccounts:manage",
  "business:kyc-manage",
  "business:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

// ---- API Keys ---------------------------------------------------------------

export interface ApiKeyGeneratedResponse {
  id: string;
  publicKey: string;
  /** Shown exactly once, on generate/regenerate. Never persist this beyond the current render. */
  secretKey: string;
}

export interface ApiKeyResponse {
  id: string;
  publicKey: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface IpWhitelistRequest {
  cidr: string;
}

/** Both optional; either may be blank to clear it. */
export interface WebhookConfigRequest {
  callbackUrl?: string;
  webhookUrl?: string;
}

export interface WebhookConfigResponse {
  callbackUrl: string | null;
  webhookUrl: string | null;
  updatedAt: string;
}

// ---- Virtual Accounts ---------------------------------------------------------

export interface VirtualAccountResponse {
  id: string;
  accountNumber: string;
  userId: string | null;
  businessId: string | null;
  currency: string;
  balance: string;
}

// ---- Transactions ---------------------------------------------------------------

export type TransactionStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "ON_HOLD";
export type TransactionType = "CREDIT" | "DEBIT";

export interface CreateTransactionRequest {
  virtualAccountId: string;
  paymentProcessorId: string;
  transactionType: TransactionType;
  amount: string;
}

export interface TransactionResponse {
  id: string;
  amount: string;
  charge: string;
  transactionStatus: TransactionStatus;
  transactionType: TransactionType;
  sessionId: string;
  virtualAccountId: string;
  /** Null for a peer-to-peer transfer leg (FR-Auth-1) - no external processor is involved. */
  paymentProcessorId: string | null;
  /** Set only on transfer-sourced rows: a transfer produces one DEBIT + one CREDIT sharing this id. */
  transferGroupId: string | null;
  /** The other side's virtual account id, set only on transfer-sourced rows. */
  counterpartyAccountId: string | null;
  createdAt: string;
}

/**
 * Shared by GET /transactions and GET /transactions/analytics (backend's
 * TransactionFilter - both endpoints filter identically, so results never
 * drift between the list and its analytics). Row-level ownership scoping
 * (caller only ever sees their own/their business's transactions, or
 * everything if SUPERADMIN) is automatic server-side - virtualAccountId here
 * narrows further, it doesn't widen.
 */
export interface TransactionFilter {
  fromDate?: string; // ISO-8601 instant
  toDate?: string; // ISO-8601 instant
  status?: TransactionStatus;
  type?: TransactionType;
  term?: string; // matched against sessionId
  virtualAccountId?: string;
  /** Narrow to one business's accounts - platform admins only; others can't widen their own scope. */
  businessId?: string;
  minAmount?: string;
  maxAmount?: string;
}

export interface TransactionSummary {
  transactionId: string;
  amount: string;
  createdAt: string;
}

export interface TransactionStatusBreakdown {
  status: TransactionStatus;
  count: number;
  volume: string;
}

export interface TransactionTypeBreakdown {
  type: TransactionType;
  count: number;
  volume: string;
}

export interface TransactionDailyVolume {
  date: string; // ISO-8601 date, e.g. "2026-09-11"
  count: number;
  volume: string;
}

export interface TransactionAnalyticsResponse {
  fromDate: string | null;
  toDate: string | null;
  totalCount: number;
  totalVolume: string;
  creditVolume: string;
  debitVolume: string;
  netVolume: string;
  averageAmount: string;
  highest: TransactionSummary | null;
  lowest: TransactionSummary | null;
  byStatus: TransactionStatusBreakdown[];
  byType: TransactionTypeBreakdown[];
  dailyVolume: TransactionDailyVolume[];
}

// ---- Bank Accounts / Verification ---------------------------------------------

export interface CreateBankAccountRequest {
  bankId: string;
  accountNumber: string;
  accountName: string;
}

export interface BankAccountResponse {
  id: string;
  bankId: string;
  accountNumber: string;
  accountName: string;
}

/** GET /api/v1/banks/resolve-account - the provider's (Paystack) Name Enquiry result. */
export interface ResolvedBankAccountResponse {
  accountNumber: string;
  accountName: string;
}

// ---- Settlement Accounts / Settlements -----------------------------------------

export interface CreateSettlementAccountRequest {
  bankAccountId: string;
  /** 0.01 - 100.00 */
  splitPercentage: string;
}

export interface SettlementAccountResponse {
  id: string;
  virtualAccountId: string;
  bankAccountId: string;
  splitPercentage: string;
}

export interface AutoSettleToggleRequest {
  autoSettle: boolean;
}

export type SettlementStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface SettleRequest {
  amount?: string;
}

export interface SettlementResponse {
  id: string;
  virtualAccountId: string;
  settlementAccountId: string;
  amount: string;
  settlementStatus: SettlementStatus;
  reference: string;
}

// ---- Collection Account (superadmin only) --------------------------------------

/** No accountName: the backend resolves it via Name Enquiry and stores that, never a typed-in name. */
export interface CreateCollectionAccountRequest {
  bankId: string;
  accountNumber: string;
}

export interface CollectionAccountResponse {
  id: string;
  bankId: string;
  accountNumber: string;
  accountName: string;
  balance: string;
}

// ---- Payment Links --------------------------------------------------------------

export type PaymentLinkType = "PERMANENT" | "TEMPORARY";
export type PaymentLinkStatus = "ACTIVE" | "EXPIRED" | "REDEEMED" | "REVOKED";

export interface CreatePaymentLinkRequest {
  amount?: string;
  linkType: PaymentLinkType;
  expiresAt?: string;
  singleUse: boolean;
}

export interface PaymentLinkResponse {
  id: string;
  shortCode: string;
  amount: string | null;
  currency: string;
  linkType: PaymentLinkType;
  expiresAt: string | null;
  singleUse: boolean;
  linkStatus: PaymentLinkStatus;
}

export interface PayLinkRequest {
  amount?: string;
}

// ---- Dynamic (Temporary) Virtual Accounts ---------------------------------------

export type DynamicAccountStatus = "ACTIVE" | "EXPIRED" | "PAID" | "REVOKED";

export interface CreateDynamicAccountRequest {
  expectedAmount?: string;
  expiresAt?: string;
  reference?: string;
}

export interface SimulateDepositRequest {
  amount: string;
}

export interface DynamicVirtualAccountResponse {
  id: string;
  accountNumber: string;
  expectedAmount: string | null;
  expiresAt: string;
  status: DynamicAccountStatus;
  reference: string | null;
}

// ---- Third-party Collect / Withdraw (server-to-server, HMAC-authenticated) ------

export interface CollectRequest {
  amount: string;
}

export interface WithdrawRequest {
  amount?: string;
}

// ---- Payment Processor ----------------------------------------------------------

export interface CreatePaymentProcessorRequest {
  name: string;
}

export interface PaymentProcessorResponse {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

// ---- Reference Data ---------------------------------------------------------------

export interface CountryResponse {
  id: string;
  name: string;
  iso3: string;
  flagUrl: string;
  currency: string;
}

export interface AdminDivisionResponse {
  id: string;
  countryId: string;
  name: string;
  level: number;
  parentId: string | null;
}

export interface BankResponse {
  id: string;
  name: string;
  code: string;
}

export interface PageParams {
  page?: number;
  size?: number;
  term?: string;
}

// ---- Users -------------------------------------------------------------------------

/**
 * Mirrors the backend enum (onboarding-auth-rbac UserType). There is no
 * BUSINESS type: business owners and teammates are USER with a businessId -
 * see apps/web/src/lib/account.ts for how the console tells them apart.
 */
export type UserType = "USER" | "ADMIN" | "SUPERADMIN" | "PSSP";

/** GET /api/v1/users/me - added specifically to close the doc F9 "no profile-read endpoint" gap. */
export interface UserResponse {
  userId: string;
  businessId: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phoneNo: string;
  userType: UserType;
  businessName: string | null;
  cacNumber: string | null;
  isVerified: boolean;
  createdAt: string;
}

// ---- Business KYC (KYB) --------------------------------------------------------------

export type BusinessType = "LIMITED_LIABILITY" | "SOLE_PROPRIETORSHIP" | "PARTNERSHIP" | "NGO" | "OTHER";
export type BusinessKycStatus = "NOT_STARTED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export interface BusinessKycDetailsRequest {
  registeredName: string;
  cacNumber: string;
  businessType: BusinessType;
  industry: string;
  countryId: string;
  stateId: string;
  addressLine: string;
}

export interface BusinessKycDetailsResponse {
  registeredName: string;
  cacNumber: string;
  businessType: BusinessType;
  industry: string;
  countryId: string;
  stateId: string;
  addressLine: string;
  updatedAt: string;
}

// ---- Owner Identity (BVN/NIN) ----------------------------------------------------------

export interface OwnerIdentityRequest {
  bvn?: string;
  nin?: string;
}

export interface OwnerIdentityResponse {
  bvn: string | null;
  nin: string | null;
  verified: boolean;
}

// ---- KYC Documents -----------------------------------------------------------------------

export type KycDocumentType =
  | "CAC_CERTIFICATE"
  | "MEMORANDUM_AND_ARTICLES"
  | "PROOF_OF_ADDRESS"
  | "DIRECTOR_VALID_ID";

export interface KycDocumentResponse {
  id: string;
  type: KycDocumentType;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface KycSubmitResponse {
  status: BusinessKycStatus;
  submittedAt: string;
}

// ---- Team Invitations -----------------------------------------------------------------------

export type RoleTemplate = "ADMIN" | "DEVELOPER" | "ACCOUNT_OFFICER";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export interface CreateInviteRequest {
  email: string;
  roleTemplate: RoleTemplate;
  message?: string;
}

/**
 * Note: carries `roleId`, not the `roleTemplate` that created it - the
 * backend doesn't echo the template back. Resolve `roleId` against
 * `GET /api/v1/roles` (roles.list) if you need a human-readable role name
 * for display (doc F6).
 */
export interface InviteResponse {
  id: string;
  email: string;
  roleId: string;
  status: InvitationStatus;
  inviteUrl: string;
  invitedAt: string;
}

// ---- Business Contact ---------------------------------------------------------------------

export interface BusinessContactRequest {
  disputeEmails: string[];
  refundEmails: string[];
  supportEmail?: string;
  generalEmail: string;
}

export interface BusinessContactResponse {
  disputeEmails: string[];
  refundEmails: string[];
  supportEmail: string | null;
  generalEmail: string;
}

// ---- Platform admin (FR-3, doc 4 §C.4-C.5) - SUPERADMIN / platform-* permissions only ----

export interface AdminBusinessSummary {
  id: string;
  name: string;
  cacNumber: string | null;
  cacVerified: boolean;
  kycStatus: BusinessKycStatus;
  kycSubmittedAt: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: string;
}

export interface AdminBusinessDetail {
  summary: AdminBusinessSummary;
  businessType: BusinessType | null;
  industry: string | null;
  addressLine: string | null;
  cacVerifiedName: string | null;
  cacVerificationSource: string | null;
  kycDetailsUpdatedAt: string | null;
  kycReviewedAt: string | null;
  /** The rejection reason, shown back to the business. */
  kycReviewNote: string | null;
  ownerPhoneNo: string | null;
  /** BVN/NIN masked to the last 4 digits. Null if never submitted. */
  ownerIdentity: OwnerIdentityResponse | null;
  documents: KycDocumentResponse[];
}

export interface AdminBusinessFilter {
  term?: string;
  kycStatus?: BusinessKycStatus;
}

export interface BusinessStats {
  total: number;
  byKycStatus: Record<BusinessKycStatus, number>;
}

export interface RejectKycRequest {
  reason: string;
}

export const AUDIT_EVENT_TYPES = [
  "SIGNUP",
  "SIGNUP_VIA_INVITE",
  "LOGIN",
  "ACCOUNT_LOCKED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETED",
  "PASSWORD_CHANGED",
  "TRANSACTION_PIN_SET",
  "TRANSACTION_PIN_VERIFICATION_FAILED",
  "TRANSACTION_PIN_LOCKED",
  "REFRESH_TOKEN_ROTATED",
  "REFRESH_TOKEN_REUSE_DETECTED",
  "REFRESH_TOKEN_REVOKED",
  "BUSINESS_KYC_DETAILS_UPDATED",
  "OWNER_IDENTITY_SUBMITTED",
  "KYC_DOCUMENT_UPLOADED",
  "KYC_SUBMITTED",
  "KYC_APPROVED",
  "KYC_REJECTED",
  "TEAM_INVITATION_CREATED",
  "TEAM_INVITATION_REVOKED",
] as const;
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export type AuditOutcome = "SUCCESS" | "FAILURE";

export interface AuditLogEntry {
  id: string;
  occurredAt: string;
  eventType: AuditEventType;
  outcome: AuditOutcome;
  userId: string | null;
  businessId: string | null;
  email: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  detail: string | null;
}

export interface AuditLogFilter {
  eventType?: AuditEventType;
  outcome?: AuditOutcome;
  userId?: string;
  businessId?: string;
  email?: string;
  fromDate?: string;
  toDate?: string;
}
