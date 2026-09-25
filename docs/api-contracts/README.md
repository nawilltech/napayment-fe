# API contracts — historical record

**Status: resolved.** These files were the suggested contracts behind every
onboarding screen while it was still served by `apps/web/src/server/dev-store.ts`
(a local JSON-file stand-in). The backend has since implemented essentially
all of them — see `docs/nawill-pay-frontend.md` doc F6 for the real,
current endpoint shapes and doc F9 for what's still actually open. `dev-store.ts`
has been deleted; every Route Handler that used to read/write it now calls
the real backend instead.

Kept here as a historical reference — each file below notes where it landed.

| File | What it sketched | Where it landed |
|---|---|---|
| `users-me.json` | `GET /api/v1/users/me` | **Implemented, exact match.** Doc F6 "Users." |
| `business-details.json` | `PUT/GET /api/v1/business/kyc/details` | **Implemented, exact field match.** Doc F6 "Business KYC (KYB)." |
| `owner-identity.json` | `PUT/GET /api/v1/kyc/owner-identity` | **Implemented, exact match** — sandboxed verification via `IdentityVerificationGateway`, as sketched. Doc F6 "Owner Identity." |
| `kyc-documents.json` | `POST/GET /api/v1/kyc/documents` | **Implemented, exact match**, plus a `GET /{id}/download` this sketch didn't anticipate. Doc F6 "KYC Documents & Submission." |
| `kyc-submit.json` | `POST /api/v1/kyc/submit` | **Implemented, exact match**, including the same validation behavior sketched here. Doc F6. |
| `team-invites.json` | `POST/GET/DELETE /api/v1/team/invitations` | **Implemented**, with one shape change: `InviteResponse` carries `roleId`, not `roleTemplate` (not echoed back — resolve it against `GET /roles`). The sketch's "biggest gap" (a real join-business signup path) is also closed: `POST /api/v1/auth/signup/accept-invite`. Doc F6. |
| `webhook-config.json` | `PUT/GET /api/v1/api-keys/webhook-config` | **Implemented, exact match**, including the suggested schema change (columns added directly to `ApiKeyCredential`, as sketched). Doc F6 "API Keys." |
| `contact-settings.json` | `PUT/GET /api/v1/business/contact` | **Implemented, exact match**, including the default-to-account-email behavior sketched here. Doc F6 "Business Contact." |

The one gap this integration *surfaced* rather than closed: there's still no
public "resolve invite by token" endpoint, so the accept-invite page can't
show who invited you before you submit — see doc F9.

## Payouts/Treasury phase

| File | What it sketched | Where it landed |
|---|---|---|
| `transaction-pin.json` | A proposed PIN set/change/verify contract, sketched ahead of the backend (see `docs/treasury-settlements-ui-design.md`) | **Implemented**, with one shape change: the backend chose the simpler inline-PIN-per-endpoint approach over this sketch's recommended verification-token shape, and the first real PIN-gated feature was peer-to-peer transfer (FR-Auth-1), not settlement/payout gating. One endpoint (`POST /api/v1/auth/transaction-pin`) handles both first-time set and change — no separate PUT, and no GET status endpoint exists yet. See the file for the real shape and the Settings → Security / Send Money screens for where it's consumed. |
