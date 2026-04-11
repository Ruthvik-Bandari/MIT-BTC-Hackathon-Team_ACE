# SatsGuard

**AI-Powered Bitcoin Guardian with Quantum Defense**

MIT Bitcoin Expo 2026 Hackathon | Team ACE

> The world's first AI guardian that protects Bitcoin from rogue AI agents **and** quantum computer attacks. Built on Nunchuk's brand-new Agent Skills (released April 8, 2026) and informed by Google Quantum AI's March 30 whitepaper.

---

## The Problem

1. **AI agents are getting wallet access** — but who guards the guardian? Without bounded authority, a compromised AI could drain funds.
2. **Quantum computers are coming** — Google's whitepaper shows <500K qubits can break secp256k1 in ~9 minutes. **6.9 million BTC** (~1/3 of supply) already have exposed public keys.

## SatsGuard's Solution

Speak plain English. SatsGuard's Claude AI guardian parses your intent, enforces spending policies, scans for quantum-vulnerable addresses, and anchors every action as an immutable on-chain audit trail.

## Key Features

| Feature | Description |
|---------|-------------|
| Natural Language Guardian | Set spending policies, send payments, scan wallets — all in plain English |
| Bounded-Authority Wallet | AI operates within strict daily limits via Nunchuk group wallet + co-signing |
| Quantum Vulnerability Scanner | Classifies P2PK/P2PKH/P2WPKH/P2TR/P2SH/P2WSH for quantum risk |
| Real-Time Streaming | SSE-powered chat with token-by-token Claude responses |
| Lightning Payments | Live micropayments via Alby NWC with policy enforcement |
| Cogcoin Audit Trail | Immutable OP_RETURN anchoring of every guardian action |
| 9-Minute Attack Timer | Interactive quantum attack countdown for demo wow factor |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 15)                      │
│  App Router + SSR | TanStack Query + Zustand                  │
│  Tailwind CSS v4 + AnimateUI | xior HTTP client               │
└───────────────────────┬──────────────────────────────────────┘
                        │ REST + SSE
┌───────────────────────▼──────────────────────────────────────┐
│                  GUARDIAN API (Express + Bun)                  │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ Claude AI      │  │ Nunchuk CLI    │  │ Quantum Scanner │ │
│  │ Intent parse   │  │ Wallet ops     │  │ Address risk    │ │
│  │ SSE streaming  │  │ Policy mgmt    │  │ bitcoinjs-lib   │ │
│  │ Risk warnings  │  │ Co-signing     │  │ Google data     │ │
│  └────────────────┘  └────────────────┘  └─────────────────┘ │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ Lightning      │  │ Cogcoin        │  │ WebSocket       │ │
│  │ Alby NWC       │  │ OP_RETURN      │  │ Live updates    │ │
│  │ Micropayments  │  │ Audit trail    │  │ tx events       │ │
│  └────────────────┘  └────────────────┘  └─────────────────┘ │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│              BITCOIN NETWORK (Signet/Testnet)                  │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git
cd MIT-BTC-Hackathon-Team_ACE

# 2. Environment
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, COGCOIN_API_KEY, ALBY_NWC_URL

# 3. Backend
cd apps/guardian-api
bun install
bun run dev          # Starts on http://localhost:3001

# 4. Frontend (separate terminal)
cd apps/dashboard
bun install
bun run dev          # Starts on http://localhost:3000

# 5. Test the guardian
bun scripts/test-guardian.ts    # Tests all 7 intents
bun scripts/test-edge-cases.ts  # Edge case regression suite
bun scripts/seed-demo.ts        # Demo walkthrough for judges
```

## Guardian Intents

SatsGuard's Claude AI recognizes 7 intent types:

| Intent | Example | Response |
|--------|---------|----------|
| `SET_POLICY` | "Let my AI spend up to 5000 sats per day" | Sets daily limit, approval threshold |
| `SEND_PAYMENT` | "Send 10000 sats to tb1q..." | Validates policy + quantum risk, initiates tx |
| `CHECK_BALANCE` | "What's my balance?" | Returns balance with policy status |
| `SCAN_QUANTUM` | "Scan my wallet for quantum risk" | Classifies all addresses by vulnerability |
| `APPROVE_TRANSACTION` | "Approve that transaction" | Approves most recent pending tx |
| `DENY_TRANSACTION` | "Cancel that, don't send it" | Denies/rejects pending tx |
| `CHAT` | "What can you do?" | General help, quantum risk education |

## API Endpoints

### Guardian

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/guardian/parse` | Parse natural language into structured action (JSON) |
| `POST` | `/api/guardian/stream` | SSE streaming — tokens arrive in real-time |

### Wallet (Nunchuk)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/wallet/create` | Create group wallet (user + agent + co-signer) |
| `POST` | `/api/wallet/set-policy` | Configure spending limits |
| `POST` | `/api/wallet/send` | Initiate transaction with policy check |
| `POST` | `/api/wallet/approve/:txId` | Approve pending transaction |
| `POST` | `/api/wallet/deny/:txId` | Deny pending transaction |
| `GET` | `/api/wallet/balance` | Query wallet balance |

### Quantum Scanner

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scanner/analyze` | Batch scan wallet addresses |
| `GET` | `/api/scanner/address/:addr` | Single address quantum risk |
| `GET` | `/api/scanner/network-stats` | Network-wide risk statistics |

### Cogcoin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cogcoin/anchor` | Anchor guardian event via OP_RETURN |
| `GET` | `/api/cogcoin/verify/:txId` | Verify anchored event on-chain |
| `GET` | `/api/cogcoin/identity` | Get registered SatsGuard identity |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check with Cogcoin status |

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Bun | 8x faster than npm, native TypeScript |
| Backend | Express + TypeScript (strict) | Proven, well-typed, team-familiar |
| Frontend | Next.js 15 App Router + SSR | Performance + SEO + RSC |
| AI | Claude Sonnet 4 (@anthropic-ai/sdk) | Best intent parsing, structured output |
| Server State | TanStack Query v5 | Caching, invalidation, optimistic updates |
| Client State | Zustand | Minimal, fast, no boilerplate |
| Forms | React Hook Form + Zod | Validation at the schema level |
| Styling | Tailwind CSS v4 + AnimateUI | Dark theme, animations, responsive |
| HTTP Client | xior | Lighter than axios, interceptors |
| Wallet | Nunchuk CLI + Agent Skills | First-ever product on these tools |
| Lightning | Alby NWC (@getalby/sdk) | Instant micropayments |
| Anchoring | Cogcoin OP_RETURN (@cogcoin/client) | On-chain audit trail |
| Linting | oxlint | 100x faster than ESLint |
| Bitcoin | Signet/Testnet only | Never mainnet |

## Quantum Risk Classification

Based on Google Quantum AI's March 30, 2026 whitepaper:

| Address Type | Condition | Risk Level | Action |
|-------------|-----------|------------|--------|
| P2PK | Always | CRITICAL | Migrate immediately |
| P2PKH | Spent from | HIGH | Public key in scriptSig |
| P2WPKH | Spent from | HIGH | Public key in witness |
| P2TR | Any | MEDIUM | Tweaked key visible |
| P2PKH/P2WPKH | Unspent | LOW | Safe at rest |
| P2SH/P2WSH | Varies | VARIABLE | Depends on script |

Key facts:
- **6.9 million BTC** with exposed public keys (~1/3 of total supply)
- **1.7 million BTC** from Satoshi-era P2PK outputs
- CRQC with **<500,000 physical qubits** can break secp256k1 in **~9 minutes**

## Project Structure

```
MIT-BTC-Hackathon-Team_ACE/
├── apps/
│   ├── guardian-api/              # Backend Express + TypeScript
│   │   ├── src/
│   │   │   ├── index.ts           # Server entry point
│   │   │   ├── services/
│   │   │   │   ├── claude.ts      # Claude AI guardian engine
│   │   │   │   ├── cogcoin.ts     # Cogcoin OP_RETURN anchoring
│   │   │   │   ├── nunchuk.ts     # Nunchuk wallet operations
│   │   │   │   ├── quantum.ts     # Quantum vulnerability scanner
│   │   │   │   └── lightning.ts   # Alby Lightning payments
│   │   │   ├── routes/
│   │   │   │   ├── guardian.ts    # /api/guardian/* routes
│   │   │   │   └── cogcoin.ts     # /api/cogcoin/* routes
│   │   │   └── types/
│   │   │       └── guardian.ts    # Shared TypeScript types + Zod schemas
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── dashboard/                 # Next.js 15 App Router frontend
│       └── src/
│           ├── app/               # Pages (SSR)
│           ├── components/        # React components (SOLID)
│           ├── dal/               # Data Access Layer
│           ├── hooks/             # TanStack Query hooks
│           ├── stores/            # Zustand stores
│           └── schemas/           # Zod validation
│
├── scripts/
│   ├── test-guardian.ts           # Intent classification tests
│   ├── test-edge-cases.ts         # Edge case regression suite
│   └── seed-demo.ts              # Demo data for judges
│
├── docs/                          # Architecture docs
├── .github/workflows/ci.yml       # GitHub Actions CI
├── .env.example                   # Environment template
└── CLAUDE.md                      # AI assistant instructions
```

## Scripts

```bash
bun run dev              # Start dev server (both apps)
bun run build            # Production build
bun run typecheck        # TypeScript strict check
bunx oxlint .            # Lint (100x faster than ESLint)

# Test scripts
bun scripts/test-guardian.ts      # 12 intent classification tests
bun scripts/test-edge-cases.ts    # 20 edge case regression tests
bun scripts/seed-demo.ts          # Demo walkthrough (7 steps)
```

## Team ACE

| Member | Role | Machine |
|--------|------|---------|
| Om Patel | Full-stack: backend + frontend | RTX 3050 / Ryzen 7 |
| Ruthvik Bandari | Claude AI guardian + Cogcoin | MacBook Pro M4 Pro |
| Vamsi | Quantum scanner + security | RTX 5070 Ti / 64GB |
| Bhagya | Deployment + infrastructure | MacBook Pro M4 Pro |
| Anusha | Docs + presentation + QA | Dell laptop |

## Sponsor Alignment

| Sponsor | Tier | Integration |
|---------|------|-------------|
| Nunchuk | Major | First product on Agent Skills (released 48 hours ago) |
| Cogcoin | Major | On-chain identity anchoring via OP_RETURN |
| HRF | Headline | Quantum-safe migration for dissidents |
| Fidelity | Regular | Institutional quantum readiness |
| MIT DCI | Regular | AI bounded authority research |

## License

MIT
