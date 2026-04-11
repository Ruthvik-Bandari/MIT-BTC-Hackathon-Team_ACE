# CLAUDE.md

## Project: SatsGuard
AI-powered Bitcoin guardian with quantum defense. MIT Bitcoin Hackathon 2026, Team ACE.

## Repo
https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git

## Repo structure
- `apps/guardian-api/` — Backend Express + TypeScript API server
- `apps/dashboard/` — Next.js 15 App Router frontend
- `docs/` — Architecture docs, pitch content
- `scripts/` — Setup and demo seed scripts
- `.github/workflows/` — CI/CD

## Stack rules (STRICT)
- Runtime and package manager: **Bun** (never npm, never yarn)
- HTTP client: **xior** (never axios, never default fetch)
- Linter: **oxlint** (never ESLint)
- TypeScript strict mode, zero `any` types
- Frontend state: TanStack Query (server) + Zustand (client)
- Forms: React Hook Form + Zod + @hookform/resolvers
- Styling: Tailwind CSS v4 + AnimateUI
- Keyboard shortcuts: TanStack Hotkeys
- DAL pattern: `components → hooks → dal/ → xior → API`
- SOLID principles on every React component
- Dark theme by default
- Bitcoin network: signet/testnet only, NEVER mainnet
- Image optimization: Sharp via Next.js Image
- Deployment: Vercel (frontend) + Railway/Render (backend), free tiers only

## Key commands
```bash
bun install          # Install dependencies
bun run dev          # Start dev server
bun run build        # Production build
bun run typecheck    # TypeScript check
bunx oxlint .        # Lint
```

## Commit convention
```
feat(scope): description    # New feature
fix(scope): description     # Bug fix
docs: description           # Documentation
chore: description          # Maintenance
```
Scopes: api, dashboard, scanner, guardian, lightning, cogcoin, infra

## Environment variables
See `.env.example` — never commit `.env`

## Team
- Om Patel: Full-stack (backend + frontend)
- Ruthvik: Claude AI guardian + Cogcoin
- Vamsi: Quantum scanner + security
- Bhagya: Deployment + infrastructure
- Anusha: Docs + presentation + QA

## Key technical context
- Nunchuk CLI + Agent Skills released April 8, 2026 (we are the first to build on them)
- Google Quantum AI whitepaper March 30, 2026: <500K qubits can break secp256k1 in ~9 min
- 6.9 million BTC have exposed public keys
- Cogcoin is a Major sponsor of MIT Bitcoin Expo 2026, we have their npm packages
- Nunchuk is also a sponsor
