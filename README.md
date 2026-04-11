# SatsGuard

**AI-powered Bitcoin guardian with quantum defense.**

Built at [MIT Bitcoin Expo 2026 Hackathon](https://mitbitcoinexpo.org/) by Team ACE.

[![CI](https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE/actions/workflows/ci.yml/badge.svg)](https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE/actions/workflows/ci.yml)

---

## What is SatsGuard?

SatsGuard is the first AI-powered Bitcoin financial guardian that protects funds from both **rogue AI agents** and **quantum computer attacks**.

- **Natural language guardian** — Tell your AI what it can spend: _"Let my AI spend up to 5000 sats per day"_
- **Bounded authority** — Built on [Nunchuk's AI Agent Skills](https://nunchuk.io/) (released April 8, 2026) for multisig policy enforcement
- **Quantum vulnerability scanner** — Analyzes Bitcoin addresses for quantum risk based on [Google Quantum AI's March 2026 whitepaper](https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/)
- **Lightning payments** — Live micropayments via [Alby NWC](https://getalby.com)
- **On-chain audit trail** — Guardian events anchored on Bitcoin via [Cogcoin](https://cogcoin.org/)

### Key stats from Google's whitepaper
- **6.9 million BTC** have exposed public keys (~1/3 of supply)
- **< 500,000 qubits** can break secp256k1
- **~9 minutes** to derive a private key during a mempool attack

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│              Dashboard (Next.js 15)               │
│   TanStack Query + Zustand + Tailwind + AnimateUI │
│              Deployed: Vercel                     │
└───────────────────────┬──────────────────────────┘
                        │ REST + WebSocket
┌───────────────────────▼──────────────────────────┐
│            Guardian API (Express + Bun)            │
│                                                    │
│  ┌────────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ Claude AI  │ │ Nunchuk  │ │ Quantum Scanner │ │
│  │ Guardian   │ │ Wallet   │ │ (bitcoinjs-lib) │ │
│  └────────────┘ └──────────┘ └─────────────────┘ │
│  ┌────────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │ Lightning  │ │ Cogcoin  │ │ WebSocket       │ │
│  │ (Alby NWC) │ │ OP_RETURN│ │ Live updates    │ │
│  └────────────┘ └──────────┘ └─────────────────┘ │
│          Deployed: Railway / Render               │
└──────────────────────────────────────────────────┘
```

---

## Quick start

```bash
# Prerequisites: Bun (https://bun.sh)
curl -fsSL https://bun.sh/install | bash

# Clone and install
git clone https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git
cd MIT-BTC-Hackathon-Team_ACE
bun install

# Set up environment
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, ALBY_NWC_URL, COGCOIN_API_KEY

# Run testnet setup (guided walkthrough)
./scripts/setup-testnet.sh

# Start development servers
bun run dev
```

### Individual apps

```bash
# Backend API (port 3001)
cd apps/guardian-api && bun run dev

# Frontend dashboard (port 3000)
cd apps/dashboard && bun run dev
```

---

## Project structure

```
├── apps/
│   ├── guardian-api/       # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── routes/     # API route handlers
│   │   │   ├── services/   # Business logic (quantum scanner, Claude)
│   │   │   ├── middleware/  # Security, CORS, rate limiting
│   │   │   └── index.ts    # Server entry point
│   │   ├── Dockerfile      # Production Docker image
│   │   └── railway.json    # Railway deployment config
│   │
│   └── dashboard/          # Next.js 15 App Router frontend
│       ├── src/app/        # Pages and layouts
│       ├── vercel.json     # Vercel deployment config
│       └── next.config.ts  # Next.js configuration
│
├── scripts/
│   ├── setup-testnet.sh    # Bitcoin testnet + Alby wallet setup
│   └── demo-seed.sh        # Pre-populate demo data
│
├── docs/                   # Architecture and design docs
├── .github/workflows/      # CI/CD pipeline
├── render.yaml             # Render deployment (repo root)
└── .env.example            # Environment variable template
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Frontend | Next.js 15, React 19, TanStack Query, Zustand, Tailwind CSS v4 |
| Backend | Express, TypeScript, Zod |
| AI | Anthropic Claude API |
| Bitcoin | bitcoinjs-lib, Nunchuk CLI, Alby NWC |
| Identity | Cogcoin (OP_RETURN anchoring) |
| Deployment | Vercel (frontend), Railway/Render (backend) |
| CI/CD | GitHub Actions (lint + typecheck + build) |
| Linter | oxlint |

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/guardian/parse` | Parse natural language command via Claude |
| POST | `/api/wallet/create` | Create Nunchuk group wallet |
| POST | `/api/wallet/set-policy` | Set spending policy |
| POST | `/api/wallet/send` | Initiate transaction |
| POST | `/api/wallet/approve/:txId` | Approve pending transaction |
| POST | `/api/wallet/deny/:txId` | Deny pending transaction |
| GET | `/api/wallet/balance` | Get wallet balance |
| POST | `/api/scanner/analyze` | Batch scan addresses for quantum risk |
| GET | `/api/scanner/address/:addr` | Scan single address |
| GET | `/api/scanner/network-stats` | Network-wide quantum threat stats |
| POST | `/api/lightning/pay` | Pay Lightning invoice |
| GET | `/api/lightning/balance` | Alby wallet balance |
| GET | `/api/health` | Health check |

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `ALBY_NWC_URL` | Yes | Nostr Wallet Connect string from Alby |
| `COGCOIN_API_KEY` | Yes | Cogcoin API access |
| `BITCOIN_NETWORK` | Yes | `signet` (never mainnet) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL for frontend |
| `NEXT_PUBLIC_WS_URL` | Yes | WebSocket URL for frontend |

---

## Team ACE

| Member | Role |
|--------|------|
| **Om Patel** | Full-stack: Backend API + Frontend dashboard |
| **Ruthvik Bandari** | Claude AI guardian + Cogcoin integration |
| **Vamsi Yanamadala** | Quantum scanner + security |
| **Bhagyasri Uddandam** | Deployment + infrastructure + CI/CD |
| **Anusha** | Documentation + presentation + QA |

---

## License

MIT Bitcoin Expo 2026 Hackathon Project
