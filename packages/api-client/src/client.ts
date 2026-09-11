import { apiRequest, type ApiClientConfig, toPageQuery } from "./http";
import type * as T from "./types";

/**
 * One function per real backend endpoint (doc F6). Grouped by resource so call
 * sites read as `client.apiKeys.generate()` rather than a flat function soup.
 * Every function takes the same `ApiClientConfig` explicitly rather than
 * closing over a singleton, since the web app's Route Handlers construct a
 * fresh config per request (a different caller's token each time) - see
 * apps/web/src/server/backend-client.ts.
 */
export function createBackendClient(config: ApiClientConfig) {
  return {
    auth: {
      signup: (body: T.SignupRequest) =>
        apiRequest<T.AuthResponse>(config, "/api/v1/auth/signup", { method: "POST", body }),
      login: (body: T.LoginRequest) =>
        apiRequest<T.AuthResponse>(config, "/api/v1/auth/login", { method: "POST", body }),
      forgotPassword: (body: T.ForgotPasswordRequest) =>
        apiRequest<T.ForgotPasswordResponse>(config, "/api/v1/auth/forgot-password", {
          method: "POST",
          body,
        }),
      resetPassword: (body: T.ResetPasswordRequest) =>
        apiRequest<T.MessageResponse>(config, "/api/v1/auth/reset-password", {
          method: "POST",
          body,
        }),
      changePassword: (body: T.ChangePasswordRequest) =>
        apiRequest<T.MessageResponse>(config, "/api/v1/auth/change-password", {
          method: "POST",
          body,
        }),
    },

    roles: {
      create: (body: T.CreateRoleRequest) =>
        apiRequest<T.RoleResponse>(config, "/api/v1/roles", { method: "POST", body }),
      list: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.RoleResponse>>(config, "/api/v1/roles", {
          query: toPageQuery(params),
        }),
    },

    apiKeys: {
      generate: () =>
        apiRequest<T.ApiKeyGeneratedResponse>(config, "/api/v1/api-keys", { method: "POST" }),
      regenerate: () =>
        apiRequest<T.ApiKeyGeneratedResponse>(config, "/api/v1/api-keys/regenerate", {
          method: "POST",
        }),
      list: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.ApiKeyResponse>>(config, "/api/v1/api-keys", {
          query: toPageQuery(params),
        }),
      addIpWhitelist: (body: T.IpWhitelistRequest) =>
        apiRequest<void>(config, "/api/v1/api-keys/ip-whitelist", { method: "POST", body }),
      listIpWhitelist: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<string>>(config, "/api/v1/api-keys/ip-whitelist", {
          query: toPageQuery(params),
        }),
      removeIpWhitelist: (cidr: string) =>
        apiRequest<void>(config, "/api/v1/api-keys/ip-whitelist", {
          method: "DELETE",
          query: { cidr },
        }),
    },

    virtualAccounts: {
      listMine: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.VirtualAccountResponse>>(config, "/api/v1/virtual-accounts", {
          query: toPageQuery(params),
        }),
    },

    transactions: {
      create: (body: T.CreateTransactionRequest, idempotencyKey: string) =>
        apiRequest<T.TransactionResponse>(config, "/api/v1/transactions", {
          method: "POST",
          body,
          idempotencyKey,
        }),
      get: (id: string) => apiRequest<T.TransactionResponse>(config, `/api/v1/transactions/${id}`),
    },

    bankAccounts: {
      create: (body: T.CreateBankAccountRequest) =>
        apiRequest<T.BankAccountResponse>(config, "/api/v1/bank-accounts", {
          method: "POST",
          body,
        }),
      list: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.BankAccountResponse>>(config, "/api/v1/bank-accounts", {
          query: toPageQuery(params),
        }),
      resolve: (bankId: string, accountNumber: string) =>
        apiRequest<T.ResolvedBankAccountResponse>(config, "/api/v1/banks/resolve-account", {
          query: { bankId, accountNumber },
        }),
    },

    settlementAccounts: {
      create: (body: T.CreateSettlementAccountRequest) =>
        apiRequest<T.SettlementAccountResponse>(config, "/api/v1/settlement-accounts", {
          method: "POST",
          body,
        }),
      list: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.SettlementAccountResponse>>(
          config,
          "/api/v1/settlement-accounts",
          { query: toPageQuery(params) },
        ),
      toggleAutoSettle: (body: T.AutoSettleToggleRequest) =>
        apiRequest<void>(config, "/api/v1/settlement-accounts/auto-settle", {
          method: "PATCH",
          body,
        }),
    },

    settlements: {
      trigger: (body: T.SettleRequest, idempotencyKey: string) =>
        apiRequest<T.SettlementResponse[]>(config, "/api/v1/settlements", {
          method: "POST",
          body,
          idempotencyKey,
        }),
    },

    collectionAccount: {
      create: (body: T.CreateCollectionAccountRequest) =>
        apiRequest<T.CollectionAccountResponse>(config, "/api/v1/collection-account", {
          method: "POST",
          body,
        }),
      get: () => apiRequest<T.CollectionAccountResponse>(config, "/api/v1/collection-account"),
    },

    paymentLinks: {
      create: (body: T.CreatePaymentLinkRequest, idempotencyKey: string) =>
        apiRequest<T.PaymentLinkResponse>(config, "/api/v1/payment-links", {
          method: "POST",
          body,
          idempotencyKey,
        }),
      list: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.PaymentLinkResponse>>(config, "/api/v1/payment-links", {
          query: toPageQuery(params),
        }),
      revoke: (id: string) =>
        apiRequest<void>(config, `/api/v1/payment-links/${id}`, { method: "DELETE" }),
      resolve: (shortCode: string) =>
        apiRequest<T.PaymentLinkResponse>(config, `/api/v1/pay/${shortCode}`),
      pay: (shortCode: string, body: T.PayLinkRequest, idempotencyKey: string) =>
        apiRequest<T.TransactionResponse>(config, `/api/v1/pay/${shortCode}`, {
          method: "POST",
          body,
          idempotencyKey,
        }),
    },

    dynamicAccounts: {
      create: (body: T.CreateDynamicAccountRequest) =>
        apiRequest<T.DynamicVirtualAccountResponse>(config, "/api/v1/temporary-accounts", {
          method: "POST",
          body,
        }),
      list: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.DynamicVirtualAccountResponse>>(
          config,
          "/api/v1/temporary-accounts",
          { query: toPageQuery(params) },
        ),
      simulateDeposit: (accountNumber: string, body: T.SimulateDepositRequest, idempotencyKey: string) =>
        apiRequest<T.TransactionResponse>(
          config,
          `/api/v1/temporary-accounts/${accountNumber}/simulate-deposit`,
          { method: "POST", body, idempotencyKey },
        ),
    },

    paymentProcessors: {
      create: (body: T.CreatePaymentProcessorRequest) =>
        apiRequest<T.PaymentProcessorResponse>(config, "/api/v1/payment-processors", {
          method: "POST",
          body,
        }),
      list: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.PaymentProcessorResponse>>(
          config,
          "/api/v1/payment-processors",
          { query: toPageQuery(params) },
        ),
      get: (id: string) =>
        apiRequest<T.PaymentProcessorResponse>(config, `/api/v1/payment-processors/${id}`),
    },

    referenceData: {
      listCountries: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.CountryResponse>>(config, "/api/v1/countries", {
          query: toPageQuery(params),
        }),
      getCountry: (id: string) => apiRequest<T.CountryResponse>(config, `/api/v1/countries/${id}`),
      listStates: (countryId: string, level?: number, params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.AdminDivisionResponse>>(
          config,
          `/api/v1/countries/${countryId}/states`,
          { query: { ...toPageQuery(params), level } },
        ),
      listChildren: (parentId: string, params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.AdminDivisionResponse>>(
          config,
          `/api/v1/states/${parentId}/children`,
          { query: toPageQuery(params) },
        ),
      listBanks: (params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.BankResponse>>(config, "/api/v1/banks", {
          query: toPageQuery(params),
        }),
    },

    /**
     * Third-party collect/withdraw (doc 3 §2.5) - HMAC-signed, server-to-server
     * only. Never called from either client UI directly; exposed here only
     * because the Console's own docs/integration-test tooling may want it.
     * Callers must supply the X-Public-Key/X-Timestamp/X-Signature headers
     * themselves via `extraHeaders` on the config - this package deliberately
     * has no crypto dependency so it stays usable unchanged in a browser, a
     * Node Route Handler, or React Native.
     */
    thirdParty: {
      collect: (body: T.CollectRequest, idempotencyKey: string) =>
        apiRequest<T.TransactionResponse>(config, "/api/v1/collect", {
          method: "POST",
          body,
          idempotencyKey,
        }),
      withdraw: (body: T.WithdrawRequest, idempotencyKey: string) =>
        apiRequest<T.SettlementResponse[]>(config, "/api/v1/withdraw", {
          method: "POST",
          body,
          idempotencyKey,
        }),
    },
  };
}

export type BackendClient = ReturnType<typeof createBackendClient>;
