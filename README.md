# SatsGuard — AI-Powered Bitcoin Guardian with Quantum Defense

> MIT Bitcoin Hackathon 2026 | Team ACE

**6.9 million BTC have exposed public keys.** Google Quantum AI estimates <500K qubits can break secp256k1 in ~9 minutes. SatsGuard is the first line of defense.

## What is SatsGuard?

SatsGuard is an AI-powered Bitcoin security dashboard that:

- **Quantum Scanner** — Scans Bitcoin addresses for quantum vulnerability. Detects exposed public keys (P2PK, spent P2PKH/P2WPKH, P2TR) and classifies risk as CRITICAL/HIGH/MEDIUM/LOW with migration recommendations.
- **AI Guardian** — Natural language interface powered by Claude AI. Chat to manage wallets, approve transactions, scan addresses, and understand quantum risks.
- **Smart Wallet** — Nunchuk-powered group wallet with AI-enforced spending policies (daily limits, per-tx limits, multi-sig approval flows).
- **Lightning Payments** — Pay Lightning invoices via Alby NWC directly from the dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Backend | Hono + TypeScript + Zod validation |
| Frontend | Next.js 15 + React 19 + Tailwind CSS v4 |
| UI | shadcn/ui + AnimateUI (Motion 12) |
| State | TanStack Query v5 (server) + Zustand (client) |
| Forms | React Hook Form + Zod + @hookform/resolvers |
| HTTP | xior |
| AI | Anthropic Claude API (Sonnet 4) |
| Bitcoin | Nunchuk CLI + bitcoinjs-lib |
| Lightning | Alby NWC (@getalby/sdk) |
| Real-time | Bun native WebSocket |
| Linting | oxlint |

## Project Structure

```
apps/
├── guardian-api/          # Backend API (Hono + Bun)
│   └── src/
│       ├── routes/        # health, wallet, lightning, guardian, scanner
│       ├── services/      # nunchuk, alby, claude, scanner
│       ├── middleware/     # error handler
│       └── utils/         # shared types
│
└── dashboard/             # Frontend (Next.js 15)
    └── src/
        ├── app/           # Pages: /, /guardian, /scanner
        ├── components/    # guardian/, wallet/, scanner/, lightning/, ui/
        ├── dal/           # Data Access Layer (xior → API)
        ├── hooks/         # TanStack Query hooks
        ├── stores/        # Zustand stores
        ├── schemas/       # Zod validation
        ├── lib/           # xior instance, formatters, constants, types
        └── providers/     # Query, Theme, WebSocket, Hotkeys

scripts/
└── seed-demo.ts           # Demo data seeder
```

## Quick Start

```bash
# Prerequisites: Bun 1.3+
bun install

# Backend
cd apps/guardian-api
cp ../../.env.example .env   # Fill in your API keys
bun run dev                  # http://localhost:3001

# Frontend
cd apps/dashboard
bun run dev                  # http://localhost:3000

# Demo seed (with backend running)
bun scripts/seed-demo.ts
```

## API Endpoints

```
GET    /api/health                  # Service health check
POST   /api/guardian/parse          # Claude AI intent parsing
POST   /api/wallet/create           # Create group wallet
POST   /api/wallet/set-policy       # Set spending limits
POST   /api/wallet/send             # Initiate transaction
POST   /api/wallet/approve/:txId    # Approve pending tx
POST   /api/wallet/deny/:txId       # Deny pending tx
GET    /api/wallet/balance           # Wallet balance
GET    /api/wallet/transactions      # Transaction history
POST   /api/scanner/analyze          # Batch quantum scan
GET    /api/scanner/address/:addr    # Single address scan
GET    /api/scanner/network-stats    # Network vulnerability stats
POST   /api/lightning/pay            # Pay Lightning invoice
GET    /api/lightning/balance        # Lightning wallet balance
WS     /ws                          # Real-time events
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Command palette |
| `⌘G` / `Ctrl+G` | Guardian chat |
| `⌘S` / `Ctrl+S` | Quantum scanner |
| `Escape` | Close modal |

## Environment Variables

See [.env.example](.env.example) for required configuration.

## Team ACE

| Member | Role |
|---|---|
| **Om Patel** | Full-stack: Backend API + Frontend dashboard |
| **Ruthvik** | Claude AI guardian + Cogcoin |
| **Vamsi** | Quantum scanner + security |
| **Bhagya** | Deployment + infrastructure |
| **Anusha** | Documentation + presentation + QA |

## Key Technical Context

- **Nunchuk CLI + Agent Skills** released April 8, 2026 — we are the first to build on them
- **Google Quantum AI whitepaper** (March 30, 2026): <500K qubits can break secp256k1 in ~9 min
- **6.9 million BTC** have exposed public keys
- Bitcoin network: **signet/testnet only** (never mainnet)

## License

MIT
