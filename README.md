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
│                  FRONTEND (Next.js 16)                       │
│  App Router + SSR + Turbopack | React 19                     │
│  TanStack Query v5 + Zustand v5 | xior HTTP client           │
│  Tailwind CSS v4 + shadcn/ui + AnimateUI (Motion 12)         │
└────────────────────────┬────────────────────────────────────┘
                         │ REST + SSE + WebSocket
┌────────────────────────▼────────────────────────────────────┐
│               GUARDIAN API (Hono 4 + Bun 1.3)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Claude AI    │  │ Nunchuk CLI  │  │ Quantum Scanner   │  │
│  │ Sonnet 4     │  │ Group wallet │  │ bitcoinjs-lib v7  │  │
│  │ Intent parse │  │ Policy mgmt  │  │ Risk classify     │  │
│  │ SSE stream   │  │ Co-signing   │  │ Migration plans   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Lightning    │  │ Cogcoin      │  │ UTXO Monitor      │  │
│  │ Alby NWC v7  │  │ OP_RETURN    │  │ mempool.space     │  │
│  │ Micropayments│  │ Audit trail  │  │ Real-time alerts  │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              BITCOIN NETWORK (Signet/Testnet)                 │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack (Verified)

| Layer | Package | Version | Purpose |
|-------|---------|---------|---------|
| Runtime | Bun | 1.3.8 | TypeScript runtime + package manager |
| Backend Framework | Hono | 4.12 | Lightweight HTTP framework for Bun |
| Validation | Zod + @hono/zod-validator | 3.25 | Request/response schema validation |
| Frontend Framework | Next.js | 16.2 | App Router + SSR + Turbopack |
| UI Library | React | 19.2 | Server + client components |
| Server State | @tanstack/react-query | 5.75 | Caching, mutations, invalidation |
| Client State | Zustand | 5.0 | Minimal global state management |
| Forms | react-hook-form + @hookform/resolvers | 7.56 | Schema-driven form validation |
| Styling | Tailwind CSS | 4.2 | Utility-first CSS framework |
| UI Components | shadcn/ui + AnimateUI (Motion 12) | 4.2 / 12.38 | Dark theme + animated components |
| Icons | Lucide React | 1.8 | Consistent icon set |
| HTTP Client | xior | 0.7 | Lightweight axios alternative |
| Keyboard Shortcuts | @tanstack/react-hotkeys | 0.9 | Command palette + shortcuts |
| AI | @anthropic-ai/sdk | 0.39 | Claude Sonnet 4 intent parsing |
| Wallet | nunchuk-cli | 0.1 | Bounded-authority group wallets |
| Bitcoin | bitcoinjs-lib | 7.0 | Address decoding + type detection |
| Lightning | @getalby/sdk | 7.0 | Alby NWC Lightning payments |
| Blockchain Data | mempool.space API | - | UTXO lookups, spent detection |
| Anchoring | @cogcoin/client | 0.5 | OP_RETURN on-chain audit trail |
| Image Optimization | Sharp | 0.33 | Next.js image processing |
| Real-time | Bun native WebSocket | - | Live transaction updates |
| Linting | oxlint | 0.16 | 100x faster than ESLint |
| TypeScript | typescript | 5.8 | Strict mode, zero `any` types |

## Quick Start

```bash
# Clone
git clone https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git
cd MIT-BTC-Hackathon-Team_ACE

# Install all workspace dependencies
bun install

# Environment
cp .env.example .env
# Fill in your API keys:
#   ANTHROPIC_API_KEY  — Claude AI (required)
#   ALBY_NWC_URL       — Alby Lightning wallet (required)
#   NUNCHUK_API_KEY    — Nunchuk wallet management (required)
#   COGCOIN_API_KEY    — Cogcoin on-chain anchoring (optional)

# Symlink .env into sub-apps so Bun picks it up
ln -sf ../../.env apps/guardian-api/.env
ln -sf ../../.env apps/dashboard/.env

# Start both services (two terminals)
cd apps/guardian-api && bun run dev   # http://localhost:3001
cd apps/dashboard   && bun run dev   # http://localhost:3000

# Or start everything from the root
bun run dev

# Verify services are connected
curl http://localhost:3001/api/health
# → { "services": { "nunchuk": true, "alby": true, "claude": true } }

# Test guardian AI (with backend running)
bun scripts/test-guardian.ts
bun scripts/seed-demo.ts
```

### Cogcoin Setup (Optional)

SatsGuard can anchor guardian actions on-chain via Cogcoin OP_RETURN transactions.

```bash
# Install Cogcoin CLI
cd tools/cogcoin && bun install

# Initialize wallet and repair if needed
npx cogcoin init
npx cogcoin repair --yes

# Note: if bitcoind fails with "Not enough file descriptors",
# increase the limit before running:
ulimit -n 10240
npx cogcoin repair --yes
```

## API Endpoints

### Guardian (Claude AI)
```
POST /api/guardian/parse        # Parse natural language → structured action
```

### Wallet (Nunchuk)
```
POST /api/wallet/create         # Create group wallet (user + agent + co-signer)
POST /api/wallet/set-policy     # Set daily limits, per-tx limits
POST /api/wallet/send           # Initiate transaction (policy-checked)
POST /api/wallet/approve/:txId  # Approve pending transaction
POST /api/wallet/deny/:txId     # Deny pending transaction
GET  /api/wallet/balance        # Query balance
GET  /api/wallet/transactions   # Transaction history
```

### Quantum Scanner
```
POST /api/scanner/analyze       # Batch scan wallet addresses
GET  /api/scanner/address/:addr # Single address quantum risk
GET  /api/scanner/network-stats # Network-wide vulnerability stats
```

### Lightning (Alby NWC)
```
POST /api/lightning/pay         # Pay Lightning invoice
GET  /api/lightning/balance     # Lightning wallet balance
```

### Cogcoin (On-Chain Audit)
```
POST /api/cogcoin/anchor        # Anchor guardian event via OP_RETURN
GET  /api/cogcoin/verify/:txId  # Verify anchored event on-chain
GET  /api/cogcoin/identity      # SatsGuard identity info
```

### System
```
GET  /api/health                # Health check + service availability
WS   /ws                        # Real-time events (tx updates, scan alerts)
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

## Monorepo Structure

```
satsguard/
├── package.json                                    # Workspace root
├── .env.example                                    # Environment template
├── .github/workflows/ci.yml                        # CI: lint + typecheck
│
├── apps/
│   ├── guardian-api/                               # ── BACKEND (Hono + Bun) ──
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile                              # Docker deployment
│   │   ├── railway.json                            # Railway config
│   │   ├── render.yaml                             # Render config
│   │   ├── src/
│   │   │   ├── index.ts                            # Bun.serve + Hono + WebSocket
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── guardian.ts                     # POST /api/guardian/parse
│   │   │   │   ├── wallet.ts                       # /api/wallet/* (Nunchuk CLI)
│   │   │   │   ├── scanner.ts                      # /api/scanner/* (quantum risk)
│   │   │   │   ├── lightning.ts                    # /api/lightning/* (Alby NWC)
│   │   │   │   ├── cogcoin.ts                      # /api/cogcoin/* (OP_RETURN)
│   │   │   │   └── health.ts                       # GET /api/health
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── claude.ts                       # Claude Sonnet 4 intent parsing
│   │   │   │   ├── nunchuk.ts                      # Nunchuk CLI wrapper (Bun.spawn)
│   │   │   │   ├── scanner.ts                      # Address type detection + risk
│   │   │   │   ├── quantum.ts                      # Deep analysis (bitcoinjs-lib v7)
│   │   │   │   ├── alby.ts                         # Lightning payments (Alby NWC)
│   │   │   │   ├── cogcoin.ts                      # Cogcoin OP_RETURN anchoring
│   │   │   │   ├── mempool.ts                      # mempool.space UTXO lookups
│   │   │   │   ├── migration.ts                    # Quantum migration step planner
│   │   │   │   ├── bip360.ts                       # Post-quantum BIP-360 readiness
│   │   │   │   ├── timeline.ts                     # Quantum threat timeline (2024-2035)
│   │   │   │   └── monitor.ts                      # Real-time UTXO monitoring
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   └── error.ts                        # Typed error handler
│   │   │   │
│   │   │   ├── schemas/
│   │   │   │   └── scanner.schema.ts               # Zod validation for scanner
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── guardian.ts                      # Guardian + Cogcoin types
│   │   │   │   ├── quantum.ts                      # Quantum analysis types
│   │   │   │   └── cogcoin-client.d.ts             # @cogcoin/client type stub
│   │   │   │
│   │   │   └── utils/
│   │   │       └── types.ts                        # Shared API types
│   │   │
│   │   └── tests/
│   │       └── quantum.test.ts                     # Quantum scanner tests
│   │
│   └── dashboard/                                  # ── FRONTEND (Next.js 16) ──
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── postcss.config.mjs
│       ├── components.json                         # shadcn/ui config
│       ├── vercel.json                             # Vercel deployment
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx                      # Root layout + providers
│       │   │   ├── page.tsx                        # Home / dashboard
│       │   │   ├── globals.css                     # Tailwind v4 + theme
│       │   │   ├── guardian/page.tsx                # Guardian chat page
│       │   │   └── scanner/page.tsx                # Quantum scanner page
│       │   │
│       │   ├── components/
│       │   │   ├── guardian/
│       │   │   │   ├── GuardianChat.tsx            # Chat interface
│       │   │   │   ├── MessageBubble.tsx           # Message display
│       │   │   │   └── IntentIndicator.tsx         # Parsed action badge
│       │   │   ├── wallet/
│       │   │   │   ├── WalletOverview.tsx          # Balance + policy
│       │   │   │   ├── PolicyEditor.tsx            # Edit spending limits
│       │   │   │   └── TransactionList.tsx         # Tx history
│       │   │   ├── scanner/
│       │   │   │   ├── QuantumRiskMeter.tsx        # Risk traffic light
│       │   │   │   ├── AddressCard.tsx             # Per-address risk
│       │   │   │   ├── QuantumTimer.tsx            # 9-min attack countdown
│       │   │   │   └── NetworkStats.tsx            # 6.9M BTC stats
│       │   │   ├── lightning/
│       │   │   │   └── PaymentDemo.tsx             # Lightning payment widget
│       │   │   ├── animate-ui/                     # AnimateUI (Motion 12)
│       │   │   │   ├── components/backgrounds/     # Stars background
│       │   │   │   └── primitives/                 # Effects, buttons, text
│       │   │   └── ui/                             # shadcn/ui components
│       │   │       ├── button.tsx, card.tsx, badge.tsx, input.tsx
│       │   │       ├── navbar.tsx, skeleton.tsx
│       │   │       ├── command-palette.tsx          # Cmd+K palette
│       │   │       ├── crypto-icons-bg.tsx          # BTC background art
│       │   │       └── error-boundary.tsx           # Error fallback
│       │   │
│       │   ├── dal/                                # Data Access Layer
│       │   │   ├── guardian.dal.ts                  # → /api/guardian/*
│       │   │   ├── wallet.dal.ts                    # → /api/wallet/*
│       │   │   ├── scanner.dal.ts                   # → /api/scanner/*
│       │   │   └── lightning.dal.ts                 # → /api/lightning/*
│       │   │
│       │   ├── hooks/
│       │   │   ├── useGuardian.ts                   # Guardian mutations
│       │   │   ├── useWallet.ts                     # Wallet queries + mutations
│       │   │   ├── useQuantumScan.ts                # Scanner queries
│       │   │   ├── useLightning.ts                  # Lightning mutations
│       │   │   ├── useWebSocket.ts                  # WS auto-reconnect
│       │   │   ├── useHotkeys.ts                    # Keyboard shortcuts
│       │   │   └── use-is-in-view.tsx               # Intersection observer
│       │   │
│       │   ├── stores/
│       │   │   ├── chat.store.ts                    # Chat message history
│       │   │   ├── wallet.store.ts                  # Active wallet state
│       │   │   └── ui.store.ts                      # Theme, sidebar, modals
│       │   │
│       │   ├── schemas/
│       │   │   ├── guardian.schema.ts               # Guardian input validation
│       │   │   ├── wallet.schema.ts                 # Wallet form schemas
│       │   │   └── transaction.schema.ts            # Transaction schemas
│       │   │
│       │   ├── providers/
│       │   │   ├── QueryProvider.tsx                 # TanStack Query client
│       │   │   ├── ThemeProvider.tsx                 # Dark mode
│       │   │   ├── WebSocketProvider.tsx             # WS context
│       │   │   └── HotkeysProvider.tsx               # Keyboard shortcuts
│       │   │
│       │   └── lib/
│       │       ├── xior.ts                          # HTTP client instance
│       │       ├── types.ts                         # Shared frontend types
│       │       ├── constants.ts                     # API URLs, risk colors
│       │       ├── formatters.ts                    # Sats/BTC formatting
│       │       ├── utils.ts                         # cn() + helpers
│       │       └── get-strict-context.tsx            # Type-safe React context
│       │
│       └── public/                                  # Static assets
│
├── scripts/
│   ├── test-guardian.ts                             # 12 intent classification tests
│   ├── test-edge-cases.ts                           # 20 edge case regressions
│   ├── seed-demo.ts                                 # 7-step demo walkthrough
│   ├── demo-seed.sh                                 # Shell demo seeder
│   ├── setup-testnet.sh                             # Testnet bootstrap
│   ├── test-endpoints.sh                            # cURL endpoint tests
│   └── localhost-backup.sh                          # Local backup script
│
├── docs/
│   └── ARCHITECTURE.md                              # System architecture docs
│
└── render.yaml                                      # Render deployment (root)
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
