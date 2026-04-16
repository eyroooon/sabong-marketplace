FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @sabong/shared build
RUN pnpm --filter @sabong/api build

FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/main"]
