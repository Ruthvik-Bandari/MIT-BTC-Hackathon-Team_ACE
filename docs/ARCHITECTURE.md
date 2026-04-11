# SatsGuard — Architecture

## System overview

```
                    ┌─────────────────────┐
                    │       User          │
                    │  "Send 5000 sats    │
                    │   to tb1q..."       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Next.js 15       │
                    │    Dashboard        │
                    │  (Vercel Free)      │
                    │                     │
                    │  - Guardian Chat    │
                    │  - Wallet Overview  │
                    │  - Quantum Scanner  │
                    │  - Lightning Demo   │
                    └──────────┬──────────┘
                               │
                         REST + WebSocket
                               │
                    ┌──────────▼──────────┐
                    │   Guardian API      │
                    │   (Railway Free)    │
                    │                     │
                    │   Express + Bun     │
                    │   Port 3001         │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                   │
   ┌────────▼───────┐ ┌───────▼────────┐ ┌───────▼────────┐
   │  Claude AI     │ │  Nunchuk CLI   │ │  Quantum       │
   │  Guardian      │ │  Wallet Ops    │ │  Scanner       │
   │                │ │                │ │                │
   │  Intent parse  │ │  Group wallet  │ │  Address type  │
   │  Risk explain  │ │  Policy mgmt   │ │  Risk assess   │
   │  NL responses  │ │  Tx approval   │ │  Batch scan    │
   └────────────────┘ └────────────────┘ └────────────────┘
            │                  │                   │
   ┌────────▼───────┐ ┌───────▼────────┐ ┌───────▼────────┐
   │  Anthropic API │ │  Bitcoin       │ │  mempool.space │
   │  (Claude)      │ │  Signet        │ │  Signet API    │
   └────────────────┘ └────────────────┘ └────────────────┘
            │
   ┌────────▼───────┐ ┌────────────────┐
   │  Lightning     │ │  Cogcoin       │
   │  (Alby NWC)   │ │  (OP_RETURN)   │
   └────────────────┘ └────────────────┘
```

## Data flow

### Guardian chat flow
```
User input → Dashboard → POST /api/guardian/parse
  → Claude AI parses intent
  → Returns structured action (send, set-policy, scan, query)
  → Dashboard executes action via appropriate API
  → WebSocket pushes status updates back
```

### Transaction flow (with policy enforcement)
```
User: "Send 10000 sats to tb1q..."
  → Claude parses: {action: "send", amount: 10000, address: "tb1q..."}
  → Check quantum risk on destination address
  → Check spending policy (daily limit)
  → If within limit → auto-approve via Nunchuk
  → If over limit → queue for human approval
  → WebSocket: transaction:pending / transaction:approved
```

### Quantum scan flow
```
Address input → detectAddressType() → assessQuantumRisk()
  │
  ├─ P2PK (raw pubkey)         → CRITICAL (always exposed)
  ├─ P2PKH + spent             → HIGH (pubkey in scriptSig)
  ├─ P2WPKH + spent            → HIGH (pubkey in witness)
  ├─ P2TR (taproot)            → MEDIUM (tweaked key visible)
  ├─ Unspent hash-protected    → LOW (key hidden behind hash)
  └─ P2SH / P2WSH             → VARIABLE (depends on script)
```

## Security architecture

### Defense layers
1. **CORS** — Origin whitelist (frontend domain only)
2. **Rate limiting** — 60 req/min per IP (in-memory)
3. **Body size guard** — 256KB max request body
4. **Security headers** — CSP, HSTS, X-Frame-Options
5. **Zod validation** — All request bodies validated
6. **DAL pattern** — Frontend never calls API directly

### Wallet security (Nunchuk model)
```
Group Wallet (2-of-3 multisig)
  ├── User Key      — Full control, human-held
  ├── Agent Key     — AI agent, bounded authority
  └── Policy Signer — Enforces spending limits server-side

Private keys NEVER leave Nunchuk's secure enclave.
Agent key has restricted capabilities only.
```

## Deployment

### Infrastructure
```
GitHub (source) → GitHub Actions (CI)
                     ├── Lint (oxlint)
                     ├── Type Check (tsc)
                     └── Build (both apps)

main branch push → Vercel (dashboard auto-deploy)
                 → Railway/Render (API auto-deploy)
```

### Environment isolation
- **Development** — localhost:3000 (dashboard) + localhost:3001 (API)
- **Production** — satsguard.vercel.app + satsguard-api.railway.app
- **Bitcoin network** — Signet/testnet ONLY (never mainnet)

## Performance targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 2.5s |
| Claude API latency | < 3s |
| Lightning payment | < 2s |
| Quantum scan (single) | < 100ms |
| Quantum scan (batch 10) | < 500ms |
| WebSocket reconnect | < 1s |
