# One image recipe for every Next.js app in the monorepo - pick it with
# --build-arg APP=web|admin (docker-compose.prod.yml does). The build context
# is the repo root so npm workspaces (packages/*) resolve; a Dockerfile scoped
# to one app can't see its workspace dependencies.
FROM node:20-alpine AS build
ARG APP
WORKDIR /app

COPY . .
RUN npm ci
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
