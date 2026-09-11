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
  errorCode: string;
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
  /** Presence of businessName triggers a business signup instead of an individual one. */
  businessName?: string;
  cacNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresInSeconds: number;
  userId: string;
  businessId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  /** TODO(FE-Gap, doc F9): returned directly today rather than emailed/SMS'd. */
  resetToken: string | null;
}

export interface ResetPasswordRequest {
  email: string;
  /** 6-digit code */
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
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
  paymentProcessorId: string;
  createdAt: string;
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

export interface ResolvedBankAccountResponse {
  accountNumber: string;
  accountName: string;
  bankId: string;
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

export interface CreateCollectionAccountRequest {
  bankId: string;
  accountNumber: string;
  accountName: string;
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
