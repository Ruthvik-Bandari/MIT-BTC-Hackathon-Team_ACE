# SatsGuard

**AI-Powered Bitcoin Guardian with Quantum Defense**

MIT Bitcoin Expo 2026 Hackathon | Team ACE

---

## The Real-World Problem

Two existential threats to Bitcoin are converging right now:

**1. AI Agents Are Getting Wallet Access**
Companies are giving AI agents the ability to spend Bitcoin autonomously. But there's no standard for *bounded authority* — if an AI agent goes rogue or gets compromised, it can drain a wallet with no human in the loop. The Nunchuk team released AI Agent Skills on April 8, 2026 to solve this, but nobody has built a product on it yet. **We're the first.**

**2. Quantum Computers Will Break Bitcoin's Cryptography**
On March 30, 2026, Google Quantum AI published a whitepaper showing that a cryptographically relevant quantum computer (CRQC) with fewer than 500,000 physical qubits can derive a Bitcoin private key from its public key in approximately 9 minutes using Shor's algorithm. **6.9 million BTC** (~$690B at current prices, ~1/3 of total supply) already have their public keys exposed on-chain. These funds are sitting ducks:

| Address Type | Condition | Exposed BTC | Risk |
|-------------|-----------|-------------|------|
| P2PK | Always exposed | 1.7M BTC | CRITICAL |
| P2PKH/P2WPKH | Spent from (key in scriptSig/witness) | ~5.2M BTC | HIGH |
| P2TR (Taproot) | Tweaked key visible by default | Growing | MEDIUM |

Most Bitcoin holders don't even know their addresses are vulnerable. There's no tool that scans a wallet and says "these 3 addresses need to migrate NOW."

## What SatsGuard Does

SatsGuard is a unified security dashboard that solves both problems:

**Speak plain English. Your AI guardian handles the rest.**

```
User: "Let my AI spend up to 5000 sats per day"
Guardian: Policy updated. Daily limit set to 5,000 sats. 
          Transactions above this require your approval.

User: "Send 10000 sats to tb1q..."
Guardian: This exceeds your daily limit. Queued for manual approval.
          WARNING: Destination address has HIGH quantum risk — 
          public key is exposed. Consider migrating first.

User: "Scan my wallet for quantum risk"
Guardian: Found 3 addresses with exposed public keys:
          - 1 CRITICAL (P2PK, 500K sats) — migrate immediately
          - 1 HIGH (spent P2PKH, 250K sats) — key in scriptSig
          - 1 MEDIUM (P2TR, 300K sats) — tweaked key visible
```

### Core Features

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Natural Language Guardian** | Parse commands via Claude AI into structured wallet actions | No crypto jargon — anyone can manage their Bitcoin security |
| **Bounded-Authority Wallet** | Nunchuk group wallet with AI agent + co-signer + policy enforcement | AI can spend within limits, humans approve large transactions |
| **Quantum Vulnerability Scanner** | Classify P2PK/P2PKH/P2WPKH/P2TR/P2SH/P2WSH by quantum risk | First tool that tells you which addresses to migrate and why |
| **Real-Time Streaming** | SSE-powered chat with token-by-token Claude responses | Feels like ChatGPT, but for your Bitcoin wallet |
| **Lightning Payments** | Pay invoices via Alby NWC with policy enforcement | Live micropayments within spending limits |
| **Cogcoin Audit Trail** | Anchor every guardian action on-chain via OP_RETURN | Immutable, verifiable proof of what the AI did and when |
| **Migration Planner** | Step-by-step instructions to move funds to quantum-safe addresses | Don't just warn — show exactly how to fix it |
| **9-Minute Attack Timer** | Interactive countdown showing how fast a quantum attack would work | Demo wow factor backed by real Google research |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 15)                      │
│  App Router + SSR | TanStack Query + Zustand                 │
│  Tailwind CSS v4 + AnimateUI | xior HTTP client              │
└────────────────────────┬────────────────────────────────────┘
                         │ REST + SSE + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                GUARDIAN API (Hono + Bun)                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Claude AI    │  │ Nunchuk CLI  │  │ Quantum Scanner   │  │
│  │ Intent parse │  │ Wallet ops   │  │ Address risk      │  │
│  │ SSE stream   │  │ Policy mgmt  │  │ Migration plans   │  │
│  │ Risk warnings│  │ Co-signing   │  │ BIP-360 readiness │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Lightning    │  │ Cogcoin      │  │ UTXO Monitor      │  │
│  │ Alby NWC     │  │ OP_RETURN    │  │ Real-time alerts  │  │
│  │ Micropayments│  │ Audit trail  │  │ mempool.space     │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              BITCOIN NETWORK (Signet/Testnet)                 │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Bun | Native TypeScript, 8x faster installs |
| Backend | Hono + TypeScript (strict) + Zod | Lightweight, edge-ready, type-safe |
| Frontend | Next.js 15 App Router + SSR | Performance + React Server Components |
| AI | Claude Sonnet 4 via @anthropic-ai/sdk | Best structured output + streaming |
| Server State | TanStack Query v5 | Caching, invalidation, optimistic updates |
| Client State | Zustand | Minimal, fast, no boilerplate |
| Forms | React Hook Form + Zod | Schema-level validation |
| Styling | Tailwind CSS v4 + AnimateUI | Dark theme, animations |
| HTTP Client | xior | Lighter than axios, interceptors |
| Wallet | Nunchuk CLI + Agent Skills | First product on these tools |
| Lightning | Alby NWC (@getalby/sdk) | Instant micropayments |
| Scanner | bitcoinjs-lib v7 + mempool.space | Real address decoding + on-chain data |
| Anchoring | Cogcoin OP_RETURN (@cogcoin/client) | On-chain audit trail |
| Real-time | Bun native WebSocket | Live transaction updates |
| Linting | oxlint | 100x faster than ESLint |

## Quick Start

```bash
# Clone
git clone https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git
cd MIT-BTC-Hackathon-Team_ACE

# Environment
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, ALBY_NWC_URL

# Backend
cd apps/guardian-api
bun install
bun run dev          # http://localhost:3001

# Frontend (separate terminal)
cd apps/dashboard
bun install
bun run dev          # http://localhost:3000

# Test guardian AI (with backend running)
bun scripts/test-guardian.ts
bun scripts/seed-demo.ts
```

## API Endpoints

### Guardian (Claude AI)
```
POST /api/guardian/parse     # Parse natural language → structured action
```

### Wallet (Nunchuk)
```
POST /api/wallet/create      # Create group wallet (user + agent + co-signer)
POST /api/wallet/set-policy  # Set daily limits, per-tx limits
POST /api/wallet/send        # Initiate transaction (policy-checked)
POST /api/wallet/approve/:id # Approve pending transaction
POST /api/wallet/deny/:id    # Deny pending transaction
GET  /api/wallet/balance     # Query balance
GET  /api/wallet/transactions # Transaction history
```

### Quantum Scanner
```
POST /api/scanner/analyze        # Batch scan wallet addresses
GET  /api/scanner/address/:addr  # Single address quantum risk
GET  /api/scanner/network-stats  # Network-wide vulnerability stats
```

### Lightning (Alby NWC)
```
POST /api/lightning/pay      # Pay Lightning invoice
GET  /api/lightning/balance   # Lightning wallet balance
```

### Cogcoin (On-Chain Audit)
```
POST /api/cogcoin/anchor     # Anchor guardian event via OP_RETURN
GET  /api/cogcoin/verify/:tx # Verify anchored event on-chain
GET  /api/cogcoin/identity   # SatsGuard identity info
```

### System
```
GET  /api/health             # Health check + service availability
WS   /ws                     # Real-time events (tx updates, scan alerts)
```

## Guardian Intent Classification

| Intent | Example | What Happens |
|--------|---------|-------------|
| `SET_POLICY` | "Let my AI spend up to 5000 sats per day" | Sets daily limit + approval threshold |
| `SEND_PAYMENT` | "Send 10000 sats to tb1q..." | Policy check + quantum risk warning + tx creation |
| `CHECK_BALANCE` | "What's my balance?" | Returns balance + policy status + risk summary |
| `SCAN_QUANTUM` | "Scan my wallet for quantum risk" | Classifies all addresses, flags vulnerable ones |
| `APPROVE_TRANSACTION` | "Approve that transaction" | Approves most recent pending tx |
| `DENY_TRANSACTION` | "Cancel that, don't send it" | Denies pending tx |
| `CHAT` | "How many bitcoins are at risk?" | Quantum education + general help |

## Quantum Risk Classification

Based on [Google Quantum AI's March 2026 whitepaper](https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf):

| Risk | Address Type | Condition | Action |
|------|-------------|-----------|--------|
| **CRITICAL** | P2PK | Public key always exposed | Migrate immediately |
| **HIGH** | P2PKH, P2WPKH | Spent from (key revealed) | Migrate to fresh address |
| **MEDIUM** | P2TR | Tweaked key visible | Consider script-path only |
| **LOW** | P2PKH, P2WPKH | Unspent (hash-protected) | Safe at rest, avoid reuse |

## Project Structure

```
apps/
├── guardian-api/                 # Backend (Hono + Bun)
│   └── src/
│       ├── index.ts              # Server + WebSocket + route wiring
│       ├── routes/
│       │   ├── guardian.ts       # Claude AI intent parsing
│       │   ├── wallet.ts        # Nunchuk wallet operations
│       │   ├── scanner.ts       # Quantum vulnerability scanner
│       │   ├── lightning.ts     # Alby Lightning payments
│       │   ├── cogcoin.ts       # On-chain audit anchoring
│       │   └── health.ts        # Service health check
│       ├── services/
│       │   ├── claude.ts        # Claude AI engine + streaming
│       │   ├── nunchuk.ts       # Nunchuk CLI wrapper
│       │   ├── scanner.ts       # Address risk classification
│       │   ├── quantum.ts       # Deep quantum analysis (bitcoinjs-lib)
│       │   ├── alby.ts          # Lightning via Alby NWC
│       │   ├── cogcoin.ts       # Cogcoin OP_RETURN anchoring
│       │   ├── mempool.ts       # mempool.space API client
│       │   ├── migration.ts     # Quantum migration planner
│       │   ├── bip360.ts        # Post-quantum BIP-360 readiness
│       │   ├── timeline.ts      # Quantum threat timeline
│       │   └── monitor.ts       # Real-time UTXO monitoring
│       ├── types/                # Type definitions
│       ├── utils/                # Shared utility types
│       ├── schemas/              # Zod validation schemas
│       └── middleware/           # Error handling
│
└── dashboard/                    # Frontend (Next.js 15)
    └── src/
        ├── app/                  # Pages: /, /guardian, /scanner
        ├── components/
        │   ├── guardian/         # Chat interface
        │   ├── wallet/           # Balance, policy, transactions
        │   ├── scanner/          # Risk meter, address cards, timer
        │   ├── lightning/        # Payment widget
        │   └── ui/               # Shared components
        ├── dal/                  # Data Access Layer → API
        ├── hooks/                # TanStack Query hooks
        ├── stores/               # Zustand (chat, wallet, UI)
        ├── schemas/              # Frontend Zod validation
        └── providers/            # Query, Theme, WebSocket

scripts/
├── test-guardian.ts              # 12 intent classification tests
├── test-edge-cases.ts            # 20 edge case regression tests
└── seed-demo.ts                  # Demo walkthrough for judges
```

## Research & Motivation

| Source | Key Finding |
|--------|------------|
| [Google Quantum AI (Mar 2026)](https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf) | <500K qubits breaks secp256k1 in ~9 min |
| [Nunchuk Agent Skills (Apr 8, 2026)](https://nunchuk.io/) | First bounded-authority AI wallet tools |
| [BIP-360 (P2QRH)](https://bip360.org/) | Post-quantum migration standard for Bitcoin |
| Blockchain analysis | 6.9M BTC with exposed public keys (~1/3 supply) |
| Satoshi-era outputs | 1.7M BTC in P2PK — public key always visible |

## Sponsor Alignment

| Sponsor | How SatsGuard Integrates |
|---------|------------------------|
| **Nunchuk** | First product built on Agent Skills (released 48 hours before hackathon) |
| **Cogcoin** | On-chain identity anchoring for guardian event audit trail |
| **HRF** | Quantum-safe fund migration for dissidents and activists |
| **Fidelity** | Institutional quantum migration readiness assessment |
| **MIT DCI** | AI bounded authority research validation |

## Team ACE

| Member | Role |
|--------|------|
| **Om Patel** | Full-stack: Backend API + Frontend dashboard |
| **Ruthvik Bandari** | Claude AI guardian engine + Cogcoin integration |
| **Vamsi** | Quantum vulnerability scanner + security |
| **Bhagya** | Deployment + infrastructure |
| **Anusha** | Documentation + presentation + QA |

## License

MIT
