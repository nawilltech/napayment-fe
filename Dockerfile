# Build context is the monorepo root (see docker-compose.prod.yml) so npm
# workspaces (packages/api-client, format, schemas, ui-tokens) resolve
# correctly - a Dockerfile scoped to apps/web alone can't see its own
# workspace dependencies.
FROM node:20-alpine AS build
WORKDIR /app

COPY . .
RUN npm ci
RUN npx turbo run build --filter=web

FROM node:20-alpine
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build /app .
USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start", "--workspace=web"]
