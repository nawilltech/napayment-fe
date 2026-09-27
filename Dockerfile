# One image recipe for every Next.js app in the monorepo - pick it with
# --build-arg APP=web|admin (docker-compose.prod.yml does). The build context
# is the repo root so npm workspaces (packages/*) resolve; a Dockerfile scoped
# to one app can't see its workspace dependencies.
FROM node:20-alpine AS build
WORKDIR /app

# Dependencies first, from manifests only, so this layer is (a) cached across
# deploys until a package.json/lockfile changes and (b) identical for web and
# admin - one install shared by both images, not two parallel downloads.
# APP is declared *after* this on purpose: an ARG in scope changes the cache
# key of every RUN below it. Add new workspaces here.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY packages/api-client/package.json packages/api-client/
COPY packages/bff/package.json packages/bff/
COPY packages/format/package.json packages/format/
COPY packages/schemas/package.json packages/schemas/
COPY packages/ui/package.json packages/ui/
COPY packages/ui-tokens/package.json packages/ui-tokens/
# The server's link to the registry drops connections now and then (ECONNRESET) - retry, don't fail the deploy.
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000
RUN npm ci

COPY . .
ARG APP
RUN npx turbo run build --filter=${APP}

FROM node:20-alpine
ARG APP
ENV APP=${APP} NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build /app .
USER nextjs

# web listens on 3000, admin on 3001 (each app's `start` script).
EXPOSE 3000 3001
CMD ["sh", "-c", "npm run start --workspace=${APP}"]
