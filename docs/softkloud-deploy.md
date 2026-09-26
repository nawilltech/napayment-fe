# Deploying to the softkloud server

This app joins the same shared stack the `napayment` backend and
`app.nawill.ng`/`spend-wise` use: Postgres/Redis/Caddy already running in
`/opt/stack`, everything else on the `nawill-net` Docker network. See
`napayment`'s `docs/softkloud-deploy.md` for the full shared-stack picture;
this file only covers what's specific to the frontend.

CI (`.github/workflows/deploy-dev.yml`, calling the reusable `_deploy.yml`)
redeploys the `dev` environment automatically on every push to the `dev`
branch. Nothing here happens automatically - each step below is one-time.

## 1. One-time server-side setup

**App checkout.** `git clone https://github.com/nawilltech/napayment-fe.git
/opt/apps/napayment-fe`.

**Caddy site block**, added to `/opt/stack/Caddyfile`:

```
dev.napayment.nawill.ng {
	reverse_proxy napayment-web:3000
}
```

Validate (`docker exec caddy caddy validate --config
/etc/caddy/Caddyfile`) before reloading (`docker exec caddy caddy reload
--config /etc/caddy/Caddyfile`).

## 2. One-time GitHub repo setup

A dedicated deploy keypair (not shared with `napayment`'s, so each is
independently revocable), added to the server's `~/.ssh/authorized_keys`,
same unrestricted-key tradeoff as `napayment`/`app.nawill.ng` (see that
repo's deploy doc for why).

GitHub **Environment** `dev`, with these environment secrets:

| Secret | Value |
|---|---|
| `SSH_HOST` | the server's hostname or IP |
| `SSH_USER` | `nawilltech` |
| `SSH_KEY` | the deploy keypair's private half |
| `APP_PATH` | `/opt/apps/napayment-fe` |
| `WEB_ENV_FILE` | full contents of `apps/web/.env.local` for this environment |

### `WEB_ENV_FILE` contents

```env
NAWILL_API_BASE_URL=http://napayment-api:8080
```

Server-side only (the BFF pattern - see `.env.example`) - the browser never
calls this directly, so the internal container name is correct here, not
the public `api.dev.napayment.nawill.ng` domain.

## 3. What happens on every push to `dev`

1. `ci.yml` - typecheck, lint, production build. Already gated the PR that
   landed the push.
2. `deploy-dev.yml` calls `_deploy.yml`, which SSHes in and:
   - `git fetch` + `git reset --hard origin/dev` in `/opt/apps/napayment-fe`.
   - Rewrites `apps/web/.env.local` from the `WEB_ENV_FILE` secret.
   - `docker compose -f docker-compose.prod.yml up -d --build`, then
     prunes dangling images.

`docker-compose.prod.yml` builds `apps/web/Dockerfile` (context is the
monorepo root, so npm workspaces resolve) and starts it as
`napayment-web` on `nawill-net`, no ports published to the host - Caddy
reaches it by container name.

## 4. Adding `prod` later

Same shape as `napayment`'s doc: a `prod` Environment, a separate
`APP_PATH` checkout, a `deploy-prod.yml` triggering on `main`, a Caddy
block for the prod domain. `_deploy.yml` needs no changes.
