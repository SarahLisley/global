# Multi-stage Dockerfile otimizado para a API (Fastify) no ecossistema pnpm Workspace

FROM node:20-alpine AS builder
# Adiciona utilitários base que algumas dependências nativas (como bcrypt) podem precisar
RUN apk add --no-cache libc6-compat python3 make g++

RUN corepack enable && corepack prepare pnpm@9.x.x --activate

WORKDIR /app

# Copia todo o monorepo para construir a imagem garantindo as referências aos workspaces
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api ./apps/api
COPY packages ./packages

# Instala todas as dependências do monorepo de forma congelada
RUN pnpm install --frozen-lockfile

# Compila a API
RUN pnpm --filter @pgb/api build

# Faz o deploy prod-only isolado para a API, criando um pacote enxuto sem dependências de dev
RUN pnpm --filter @pgb/api deploy --prod /prod/api

# -----------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001

# Copia apenas o que importa da fase anterior (o deploy enxuto)
COPY --from=builder /prod/api ./

EXPOSE 4001

CMD ["npm", "start"]
