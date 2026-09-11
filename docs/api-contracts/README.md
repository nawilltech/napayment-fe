# API contracts — backend gaps

Each JSON file here is a **suggested contract** for a backend endpoint that
doesn't exist yet (see `docs/nawill-pay-frontend.md` doc F9). They're written
in the same request/response shape the real backend uses elsewhere (doc F6),
so implementing one should be a drop-in replacement for the corresponding
`apps/web/src/server/dev-store.ts` function — no frontend contract change
needed, just swap the Route Handler's data source.

Copy-paste the `request`/`response` blocks directly into `curl`, Postman, or
a WireMock stub (matching the backend's own contract-test approach, doc 3
§5.2) to test against once implemented.

| File | Suggested endpoint | Realizes |
|---|---|---|
| `users-me.json` | `GET /api/v1/users/me` | Profile display — no equivalent exists at all today |
| `business-details.json` | `PUT/GET /api/v1/business/kyc/details` | FR-8 (business KYB) |
| `owner-identity.json` | `PUT/GET /api/v1/kyc/owner-identity` | FR-8 (BVN/NIN) |
| `kyc-documents.json` | `POST/GET /api/v1/kyc/documents` | FR-8 |
| `kyc-submit.json` | `POST /api/v1/kyc/submit` | FR-8, feeds FR-3's admin review queue |
| `team-invites.json` | `POST/GET/DELETE /api/v1/team/invitations` | FR-5a + FR-Notif-1 (email dispatch) |
| `webhook-config.json` | `PUT/GET /api/v1/api-keys/webhook-config` | FR-9 ("configure a webhook URL") |
| `contact-settings.json` | `PUT/GET /api/v1/business/contact` | Dispute/refund/support routing (Settings → Contact) |
