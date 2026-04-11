# SatsGuard — Technical Requirements Document (TRD)

**Repo**: https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git
**Runtime**: Bun (package manager + runtime)
**Language**: TypeScript (strict mode)

---

## 1. System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Anusha)                        │
│  Next.js 15 App Router + SSR + TanStack Query + Zustand         │
│  AnimateUI + Tailwind CSS + Zod + React Hook Form               │
│  xior (HTTP client) + TanStack Hotkeys + Sharp                  │
│  Deployed: Vercel Free Tier                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (xior)
┌──────────────────────────▼──────────────────────────────────────┐
│                     GUARDIAN API (Om + Ruthvik)                  │
│  Node.js + Express/Hono + TypeScript                            │
│  DAL (Data Access Layer) for security                           │
│  Deployed: Railway Free Tier / Render                           │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Claude AI    │ │ Nunchuk CLI  │ │ Quantum Scanner          │ │
│  │ (Ruthvik)    │ │ (Om)         │ │ (Vamsi)                  │ │
│  │ Intent parse │ │ Wallet ops   │ │ Address risk analysis    │ │
│  │ Risk explain │ │ Policy mgmt  │ │ bitcoinjs-lib            │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ Lightning    │ │ Cogcoin      │ │ WebSocket Server         │ │
│  │ (Om)         │ │ (Ruthvik)    │ │ (Om)                     │ │
│  │ Alby NWC     │ │ OP_RETURN    │ │ Live transaction updates │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   INFRASTRUCTURE (Bhagya)                        │
│  Vercel (frontend) + Railway/Render (API)                       │
│  GitHub Actions CI + Environment secrets                        │
│  MutinyNet Signet for Bitcoin testnet                           │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Frontend technical specification

### Framework and conventions
- **Framework**: Next.js 15 with App Router
- **Rendering**: Server Side Rendering (SSR) by default, client components only when needed
- **TypeScript**: Strict mode, no `any` types
- **Linting**: oxlint (not ESLint - faster, zero config)
- **Package manager**: Bun
- **Component architecture**: SOLID principles enforced

### State management
- **Server state**: TanStack Query v5 (all API data fetching, caching, invalidation)
- **Client state**: Zustand (UI state, guardian chat history, pending approvals)
- **Form state**: React Hook Form + @hookform/resolvers + Zod schemas

### Data fetching
- **HTTP client**: xior (NOT axios, NOT default fetch)
- **Pattern**: DAL (Data Access Layer) between components and API
- **Caching**: TanStack Query with staleTime and gcTime configured per endpoint
- **Real-time**: WebSocket for live transaction updates and guardian responses

### UI framework
- **Styling**: Tailwind CSS v4
- **Components**: AnimateUI (animated components library)
- **Icons**: Lucide React
- **Image optimization**: Sharp package via Next.js Image component
- **Keyboard shortcuts**: TanStack Hotkeys for power-user features

### Directory structure (frontend)
```
apps/dashboard/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Home/dashboard page (SSR)
│   │   ├── guardian/
│   │   │   └── page.tsx              # Guardian chat interface
│   │   ├── scanner/
│   │   │   └── page.tsx              # Quantum scanner results
│   │   └── api/                      # API routes (if BFF pattern needed)
│   │
│   ├── components/                   # React components (SOLID)
│   │   ├── guardian/
│   │   │   ├── GuardianChat.tsx      # Chat interface
│   │   │   ├── MessageBubble.tsx     # Single message component
│   │   │   └── IntentIndicator.tsx   # Shows parsed action
│   │   ├── wallet/
│   │   │   ├── WalletOverview.tsx    # Balance + policy
│   │   │   ├── PolicyEditor.tsx      # Edit spending limits
│   │   │   └── TransactionList.tsx   # Activity log
│   │   ├── scanner/
│   │   │   ├── QuantumRiskMeter.tsx  # Overall risk display
│   │   │   ├── AddressCard.tsx       # Per-address risk
│   │   │   ├── QuantumTimer.tsx      # 9-min attack countdown
│   │   │   └── NetworkStats.tsx      # 6.9M BTC stat display
│   │   ├── lightning/
│   │   │   └── PaymentDemo.tsx       # Live payment widget
│   │   └── ui/                       # Shared UI primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       └── Input.tsx
│   │
│   ├── dal/                          # Data Access Layer (security)
│   │   ├── guardian.dal.ts           # Guardian API calls
│   │   ├── wallet.dal.ts            # Wallet API calls
│   │   ├── scanner.dal.ts           # Scanner API calls
│   │   └── lightning.dal.ts         # Lightning API calls
│   │
│   ├── hooks/                        # Custom hooks
│   │   ├── useGuardian.ts           # TanStack Query + guardian DAL
│   │   ├── useWallet.ts             # Wallet state + mutations
│   │   ├── useQuantumScan.ts        # Scanner queries
│   │   └── useLightning.ts          # Payment mutations
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── chat.store.ts            # Chat message history
│   │   ├── wallet.store.ts          # Active wallet context
│   │   └── ui.store.ts              # Theme, sidebar, modals
│   │
│   ├── schemas/                      # Zod validation schemas
│   │   ├── guardian.schema.ts       # Guardian command validation
│   │   ├── wallet.schema.ts         # Wallet/policy schemas
│   │   └── transaction.schema.ts    # Transaction form schemas
│   │
│   ├── lib/                          # Utilities
│   │   ├── xior.ts                  # xior instance with interceptors
│   │   ├── formatters.ts            # Sats, BTC, address formatting
│   │   ├── constants.ts             # Risk colors, API URLs
│   │   └── types.ts                 # Shared TypeScript types
│   │
│   └── providers/                    # React context providers
│       ├── QueryProvider.tsx         # TanStack Query client
│       └── ThemeProvider.tsx         # Dark mode
│
├── public/
│   └── og-image.png                 # Social preview image
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── bunfig.toml
└── package.json
```

### DAL pattern example
```typescript
// dal/scanner.dal.ts
import { xiorInstance } from "@/lib/xior";
import { QuantumRiskAssessment, WalletScanResult } from "@/lib/types";

// DAL functions are the ONLY layer that touches the API
// Components never call xior directly - they go through hooks which use DAL

export async function scanAddress(address: string, spent: boolean): Promise<QuantumRiskAssessment> {
  const { data } = await xiorInstance.get(`/api/scanner/address/${address}`, {
    params: { spent: String(spent) }
  });
  return data.assessment;
}

export async function scanWallet(addresses: WalletAddress[]): Promise<WalletScanResult> {
  const { data } = await xiorInstance.post("/api/scanner/analyze", { addresses });
  return data;
}
```

### SOLID principles enforcement
- **S (Single Responsibility)**: Each component does ONE thing. `AddressCard` displays one address. `QuantumTimer` runs one timer. No god components.
- **O (Open/Closed)**: Components accept props for customization. Risk colors, labels configurable via props not hardcoded switches.
- **L (Liskov Substitution)**: All form inputs implement the same interface. Swap `TextInput` for `NumberInput` without breaking forms.
- **I (Interface Segregation)**: Hooks return only what the component needs. `useQuantumScan` doesn't expose wallet data.
- **D (Dependency Inversion)**: Components depend on DAL interfaces, not on xior directly. DAL can be swapped for mock data during development.

## 3. Backend technical specification

### API server
- **Runtime**: Bun
- **Framework**: Express with TypeScript (or Hono for speed)
- **Validation**: Zod on all request bodies
- **Error handling**: Centralized error middleware with typed errors

### API endpoints

```
POST   /api/guardian/parse          # Claude intent parsing
POST   /api/wallet/create           # Create Nunchuk group wallet
POST   /api/wallet/set-policy       # Configure spending limits
POST   /api/wallet/send             # Initiate transaction
POST   /api/wallet/approve/:txId    # Approve pending tx
POST   /api/wallet/deny/:txId       # Deny pending tx
GET    /api/wallet/balance           # Get wallet balance
GET    /api/wallet/transactions      # Transaction history

POST   /api/scanner/analyze         # Batch scan wallet addresses
GET    /api/scanner/address/:addr   # Single address scan
GET    /api/scanner/network-stats   # Network-wide quantum stats

POST   /api/lightning/pay           # Pay Lightning invoice
GET    /api/lightning/balance       # Alby wallet balance

POST   /api/cogcoin/anchor         # Anchor event on Bitcoin (P1)
GET    /api/health                  # Health check
```

### WebSocket events (for live updates)
```
ws://api/ws

Events emitted:
- transaction:pending      # New tx awaiting approval
- transaction:approved     # Human approved tx
- transaction:executed     # Tx confirmed
- transaction:denied       # Human denied tx
- guardian:response        # AI guardian message
- scanner:complete         # Scan finished
- lightning:settled        # Payment confirmed
```

## 4. Quantum scanner technical specification

### Address classification algorithm
```
Input: Bitcoin address string + has_been_spent_from boolean

Step 1: Decode address format
  - bech32 decode → check version byte
    - version 0, 20 bytes → P2WPKH
    - version 0, 32 bytes → P2WSH
    - version 1 → P2TR
  - base58 decode → check version byte
    - 0x00 / 0x6F → P2PKH
    - 0x05 / 0xC4 → P2SH
  - raw script → check for push-pubkey pattern → P2PK

Step 2: Assess exposure
  - P2PK → public key ALWAYS exposed → CRITICAL
  - P2PKH + spent → public key in scriptSig → HIGH
  - P2WPKH + spent → public key in witness → HIGH
  - P2TR → tweaked key visible in output → MEDIUM
  - Unspent hash-protected → LOW
  - P2SH/P2WSH → depends on script exposure → VARIABLE

Step 3: Generate recommendation
  - CRITICAL/HIGH → "Migrate to fresh P2WPKH immediately"
  - MEDIUM → "Consider script-path only, await BIP-360"
  - LOW → "Safe at rest, avoid address reuse"
```

### Data sources
- **Testnet UTXO lookup**: mempool.space API (https://mempool.space/signet/api/)
- **Address type detection**: bitcoinjs-lib v6
- **Network stats**: Hardcoded from Google whitepaper (6.9M BTC, 1.7M P2PK)

## 5. Security considerations (Vamsi's domain)

### Wallet security
- Private keys NEVER leave Nunchuk's secure enclave
- Agent key has restricted capabilities (bounded authority)
- Policy co-signer enforces limits server-side
- All wallet operations require authentication

### API security
- DAL pattern ensures no direct API exposure in client components
- Zod validation on every request body
- Rate limiting on Claude API calls (cost management)
- Environment variables for all secrets (API keys, NWC strings)
- CORS restricted to frontend domain

### Demo safety
- Testnet/Signet only (no real BTC)
- Demo wallet pre-funded with testnet sats
- API keys scoped to minimum permissions
- No sensitive data in git history

## 6. Deployment specification (Bhagya's domain)

### Frontend: Vercel (free tier)
- Auto-deploy from main branch
- Edge functions for SSR
- Environment variables via Vercel dashboard
- Custom domain optional (satsguard.vercel.app)

### Backend: Railway (free tier) or Render
- Docker container or direct Node.js deployment
- Environment variables via dashboard
- Auto-deploy from main branch
- Health check endpoint for uptime monitoring

### CI/CD: GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bunx oxlint .
  
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run typecheck
```

## 7. Performance targets

| Metric | Target | How |
|---|---|---|
| First Contentful Paint | < 1.5s | Next.js SSR + edge |
| Time to Interactive | < 2.5s | Code splitting, lazy loading |
| Claude API latency | < 3s | Sonnet 4 model, streaming |
| Lightning payment | < 2s | Alby NWC direct connection |
| Quantum scan (single) | < 100ms | bitcoinjs-lib local decode |
| Quantum scan (batch 10) | < 500ms | Parallel address analysis |
| WebSocket reconnect | < 1s | Auto-reconnect with backoff |

## 8. Error handling strategy

### Frontend errors
- TanStack Query retry with exponential backoff (3 retries)
- Zustand error state for UI error boundaries
- Toast notifications for user-facing errors
- Graceful degradation: if scanner fails, show cached results

### Backend errors
- Centralized error middleware
- Typed error classes (ValidationError, NunchukError, ClaudeError)
- Structured logging with request ID
- Fallback responses for non-critical failures

### Lessons learned log
Create `LESSONS.md` in repo root. After every bug fix, append:
```
## [Timestamp] Bug description
- **Root cause**: ...
- **Fix**: ...
- **Prevention rule**: ...
```
This prevents repeated mistakes across the team.
