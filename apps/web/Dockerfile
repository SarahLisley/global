# Multi-stage Dockerfile otimizado para o Front-end (Next.js Standalone)

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++

RUN corepack enable && corepack prepare pnpm@9.x.x --activate

WORKDIR /app

# Em desenvolvimento ou build, Next.js embutiu as URLs
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Compilando o web. O standalone deixará a saída enxuta.
RUN pnpm --filter @pgb/web build

# -----------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3200
ENV HOSTNAME="0.0.0.0"

# Criar usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia public 
COPY --from=builder /app/apps/web/public ./apps/web/public

# Standalone output (Contém servidor enxuto do Next.js copiando só o necessário)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Static assets 
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3200

CMD ["node", "apps/web/server.js"]
