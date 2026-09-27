import { apiRequest, apiRequestBinary, type ApiClientConfig, toPageQuery } from "./http";
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
      /** FR-5a: signup variant that attaches the new user to the inviting business under the invite's role. */
      signupViaInvite: (body: T.AcceptInviteRequest) =>
        apiRequest<T.AuthResponse>(config, "/api/v1/auth/signup/accept-invite", {
          method: "POST",
          body,
        }),
      /**
       * NFR-7: rotates the presented refresh token - the response's
       * refreshToken is a NEW one, the presented one is now dead
       * (single-use). Public endpoint, no Bearer token needed - the refresh
       * token itself is the credential.
       */
      refresh: (body: T.RefreshTokenRequest) =>
        apiRequest<T.AuthResponse>(config, "/api/v1/auth/refresh", { method: "POST", body }),
      /** Revokes the refresh token server-side. Public endpoint, same as refresh. */
      logout: (body: T.RefreshTokenRequest) =>
        apiRequest<T.MessageResponse>(config, "/api/v1/auth/logout", { method: "POST", body }),
      /** FR-Auth-2: set (first time) or change the 4-digit transaction PIN required to send a transfer. */
      setTransactionPin: (body: T.SetTransactionPinRequest) =>
        apiRequest<T.MessageResponse>(config, "/api/v1/auth/transaction-pin", { method: "POST", body }),
    },

    users: {
      /** No profile-read endpoint existed before this - closed the doc F9 gap. */
      me: () => apiRequest<T.UserResponse>(config, "/api/v1/users/me"),
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
      getWebhookConfig: () =>
        apiRequest<T.WebhookConfigResponse>(config, "/api/v1/api-keys/webhook-config"),
      updateWebhookConfig: (body: T.WebhookConfigRequest) =>
        apiRequest<T.WebhookConfigResponse>(config, "/api/v1/api-keys/webhook-config", {
          method: "PUT",
          body,
        }),
    },

    business: {
      getKycDetails: () =>
        apiRequest<T.BusinessKycDetailsResponse | null>(config, "/api/v1/business/kyc/details"),
      updateKycDetails: (body: T.BusinessKycDetailsRequest) =>
        apiRequest<T.BusinessKycDetailsResponse>(config, "/api/v1/business/kyc/details", {
          method: "PUT",
          body,
        }),
      getContact: () =>
        apiRequest<T.BusinessContactResponse>(config, "/api/v1/business/contact"),
      updateContact: (body: T.BusinessContactRequest) =>
        apiRequest<T.BusinessContactResponse>(config, "/api/v1/business/contact", {
          method: "PUT",
          body,
        }),
    },

    kyc: {
      getOwnerIdentity: () =>
        apiRequest<T.OwnerIdentityResponse | null>(config, "/api/v1/kyc/owner-identity"),
      updateOwnerIdentity: (body: T.OwnerIdentityRequest) =>
        apiRequest<T.OwnerIdentityResponse>(config, "/api/v1/kyc/owner-identity", {
          method: "PUT",
          body,
        }),
      listDocuments: () =>
        apiRequest<T.KycDocumentResponse[]>(config, "/api/v1/kyc/documents"),
      /** `file` is a FormData already carrying `type` and `file` parts - see http.ts's FormData pass-through. */
      uploadDocument: (form: FormData) =>
        apiRequest<T.KycDocumentResponse>(config, "/api/v1/kyc/documents", {
          method: "POST",
          body: form,
        }),
      /** Returns the raw Response so the caller can stream the file through rather than buffering it. */
      downloadDocument: (id: string) =>
        apiRequestBinary(config, `/api/v1/kyc/documents/${id}/download`),
      submit: () => apiRequest<T.KycSubmitResponse>(config, "/api/v1/kyc/submit", { method: "POST" }),
    },

    team: {
      createInvite: (body: T.CreateInviteRequest) =>
        apiRequest<T.InviteResponse>(config, "/api/v1/team/invitations", { method: "POST", body }),
      listInvites: () => apiRequest<T.InviteResponse[]>(config, "/api/v1/team/invitations"),
      revokeInvite: (id: string) =>
        apiRequest<{ ok: boolean }>(config, `/api/v1/team/invitations/${id}`, { method: "DELETE" }),
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
      list: (filter?: T.TransactionFilter, params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.TransactionResponse>>(config, "/api/v1/transactions", {
          query: { ...filter, ...toPageQuery(params) },
        }),
      analytics: (filter?: T.TransactionFilter) =>
        apiRequest<T.TransactionAnalyticsResponse>(config, "/api/v1/transactions/analytics", {
          query: { ...filter },
        }),
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
        apiRequest<T.PaymentLinkCheckoutResponse>(config, `/api/v1/pay/${shortCode}`),
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



    /** FR-Auth-1: peer-to-peer transfer between two Nawill virtual accounts, gated by the transaction PIN above. */
    transfers: {
      /** Confirm-before-send: resolves the masked recipient name before the caller commits. */
      resolve: (identifier: string) =>
        apiRequest<T.TransferResolveResponse>(config, "/api/v1/transfers/resolve", {
          query: { identifier },
        }),
      create: (body: T.TransferRequest, idempotencyKey: string) =>
        apiRequest<T.TransferResponse>(config, "/api/v1/transfers", {
          method: "POST",
          body,
          idempotencyKey,
        }),
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
    /** Platform admin console (FR-3) - SUPERADMIN / platform-* permissions only. */
    admin: {
      listBusinesses: (filter?: T.AdminBusinessFilter, params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.AdminBusinessSummary>>(config, "/api/v1/admin/businesses", {
          query: { ...filter, ...toPageQuery(params) },
        }),
      businessStats: () => apiRequest<T.BusinessStats>(config, "/api/v1/admin/businesses/stats"),
      getBusiness: (id: string) => apiRequest<T.AdminBusinessDetail>(config, `/api/v1/admin/businesses/${id}`),
      approveKyc: (id: string) =>
        apiRequest<T.AdminBusinessDetail>(config, `/api/v1/admin/businesses/${id}/kyc/approve`, { method: "POST" }),
      rejectKyc: (id: string, body: T.RejectKycRequest) =>
        apiRequest<T.AdminBusinessDetail>(config, `/api/v1/admin/businesses/${id}/kyc/reject`, {
          method: "POST",
          body,
        }),
      downloadKycDocument: (documentId: string) =>
        apiRequestBinary(config, `/api/v1/admin/kyc-documents/${documentId}/download`),
      listAuditLogs: (filter?: T.AuditLogFilter, params?: T.PageParams) =>
        apiRequest<T.PageResponse<T.AuditLogEntry>>(config, "/api/v1/admin/audit-logs", {
          query: { ...filter, ...toPageQuery(params) },
        }),
      deactivateBusiness: (id: string, body: T.DeactivateBusinessRequest) =>
        apiRequest<T.AdminBusinessDetail>(config, `/api/v1/admin/businesses/${id}/deactivate`, {
          method: "POST",
          body,
        }),
      activateBusiness: (id: string) =>
        apiRequest<T.AdminBusinessDetail>(config, `/api/v1/admin/businesses/${id}/activate`, { method: "POST" }),
      /** Every payment method the platform supports (for the processor form). */
      paymentMethods: () => apiRequest<T.PaymentMethodOption[]>(config, "/api/v1/admin/payment-methods"),
      paymentProcessors: {
        list: (params?: T.PageParams) =>
          apiRequest<T.PageResponse<T.PaymentProcessorResponse>>(config, "/api/v1/admin/payment-processors", {
            query: toPageQuery(params),
          }),
        get: (id: string) => apiRequest<T.PaymentProcessorResponse>(config, `/api/v1/admin/payment-processors/${id}`),
        create: (body: T.CreatePaymentProcessorRequest) =>
          apiRequest<T.PaymentProcessorResponse>(config, "/api/v1/admin/payment-processors", { method: "POST", body }),
        update: (id: string, body: T.UpdatePaymentProcessorRequest) =>
          apiRequest<T.PaymentProcessorResponse>(config, `/api/v1/admin/payment-processors/${id}`, {
            method: "PATCH",
            body,
          }),
        enableMethod: (id: string, method: T.PaymentMethod) =>
          apiRequest<T.PaymentProcessorResponse>(config, `/api/v1/admin/payment-processors/${id}/methods/${method}`, {
            method: "PUT",
          }),
        disableMethod: (id: string, method: T.PaymentMethod) =>
          apiRequest<T.PaymentProcessorResponse>(config, `/api/v1/admin/payment-processors/${id}/methods/${method}`, {
            method: "DELETE",
          }),
        /** Platform switch (requires the staff password). */
        setActive: (id: string, active: boolean, body: T.PasswordConfirmationRequest) =>
          apiRequest<T.PaymentProcessorResponse>(
            config,
            `/api/v1/admin/payment-processors/${id}/${active ? "activate" : "deactivate"}`,
            { method: "POST", body },
          ),
        /** Default for all businesses; clears their own settings (requires the staff password). */
        setForAllBusinesses: (id: string, enabled: boolean, body: T.PasswordConfirmationRequest) =>
          apiRequest<T.ForAllBusinessesResponse>(
            config,
            `/api/v1/admin/payment-processors/${id}/${enabled ? "enable" : "disable"}-for-all-businesses`,
            { method: "POST", body },
          ),
      },
      businessPaymentProcessors: {
        list: (businessId: string) =>
          apiRequest<T.BusinessPaymentProcessor[]>(config, `/api/v1/admin/businesses/${businessId}/payment-processors`),
        set: (businessId: string, processorId: string, enabled: boolean) =>
          apiRequest<T.BusinessPaymentProcessor>(
            config,
            `/api/v1/admin/businesses/${businessId}/payment-processors/${processorId}`,
            { method: "PUT", body: { enabled } },
          ),
        reset: (businessId: string, processorId: string) =>
          apiRequest<T.BusinessPaymentProcessor>(
            config,
            `/api/v1/admin/businesses/${businessId}/payment-processors/${processorId}`,
            { method: "DELETE" },
          ),
      },
    },

    /** Payment methods the caller's own account can accept right now (FR-Proc-3). */
    paymentMethods: {
      available: () => apiRequest<T.PaymentMethodOption[]>(config, "/api/v1/payment-methods"),
    },

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
