# Portal Global Bravo — Scaffold v2

- Monorepo: pnpm + turbo
- Apps: Next.js (apps/web), API stub (apps/api) — futura API Oracle
- Pacote compartilhado: packages/ui
- Node: 20 (ver .nvmrc)

## Rodar local:
```bash
corepack enable
corepack prepare pnpm@9.11.0 --activate
pnpm install
pnpm dev
```

Rotas:
- Web: http://localhost:3000
- API stub: http://localhost:4001/health