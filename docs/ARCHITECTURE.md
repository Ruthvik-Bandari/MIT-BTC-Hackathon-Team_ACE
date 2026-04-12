# BitShield — Architecture

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

---

## Security Architecture

**Author**: Vamsi Yanamadala (Security Lead, Team ACE)

### Threat Model

BitShield faces three threat categories:

1. **Quantum Computing**: Shor's algorithm derives private keys from exposed public keys. Google whitepaper: <500K qubits breaks secp256k1 in ~9 minutes. 6.9M BTC exposed.
2. **API Attacks**: Input injection, DoS, CORS bypass, information leakage.
3. **Wallet Threats**: Unauthorized AI agent transactions, key exposure.

### Defense Layers

```
                    ┌────────────────────┐
                    │  Security Layer    │
                    │  ┌──────────────┐  │
                    │  │ Sec Headers  │  │  ← HSTS, CSP, X-Frame
                    │  │ CORS         │  │  ← Origin whitelist
                    │  │ Rate Limit   │  │  ← 60 req/min/IP
                    │  │ Body Guard   │  │  ← 256KB max
                    │  │ Zod Valid    │  │  ← Schema validation
                    │  │ Error Typed  │  │  ← No stack traces leaked
                    │  └──────────────┘  │
                    └────────────────────┘
```

| Control | Implementation | Details |
|---|---|---|
| Security Headers | `middleware/security.ts` | HSTS, CSP, X-Frame-Options: DENY, nosniff, X-Powered-By removed |
| CORS | `middleware/security.ts` | Origin whitelist from FRONTEND_URL env + localhost |
| Rate Limiting | `middleware/security.ts` | In-memory, 60 req/min/IP, X-RateLimit headers, auto-cleanup |
| Body Size Guard | `middleware/security.ts` | 256KB max, 413 response if exceeded |
| Input Validation | `schemas/scanner.schema.ts` | Zod on all endpoints: address format, prefix, length, type |
| Error Handling | `middleware/security.ts` | Typed error classes (ValidationError, ScanError, RateLimitError). No internals leaked. |
| DAL Pattern | Frontend architecture | Components never call API directly |

### Wallet Security (Nunchuk model)
```
Group Wallet (2-of-3 multisig)
  ├── User Key      — Full control, human-held
  ├── Agent Key     — AI agent, bounded authority
  └── Policy Signer — Enforces spending limits server-side

Private keys NEVER leave Nunchuk's secure enclave.
Agent key has restricted capabilities only.
```

### Environment & Secrets

| Secret | Storage | Never In |
|---|---|---|
| ANTHROPIC_API_KEY | Environment variable | Git, client bundle |
| ALBY_NWC_URL | Environment variable | Git, client bundle |
| COGCOIN_API_KEY | Environment variable | Git, client bundle |

`.env` is in `.gitignore`. Secret audit passed: no keys in git history or source.

### Test Coverage

| Suite | Tests | Status |
|---|---|---|
| Address type detection | 11 | Pass |
| Public key exposure | 8 | Pass |
| Risk assessment | 7 | Pass |
| Batch wallet analysis | 2 | Pass |
| Network stats verification | 1 | Pass |
| **Total** | **29** | **29 pass, 0 fail** |

Run: `bun test tests/quantum.test.ts`

### Load Test Results

- 100 concurrent GET requests: **100% success** (all HTTP 200)
- Single request latency (local): <10ms
- Single request latency (with mempool API): ~2.2s

---

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
- **Production** — bitshield.vercel.app + bitshield-api.railway.app
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

## Known Limitations

1. Rate limiter is in-memory — resets on restart, not shared across instances
2. UTXO monitor uses polling (30s) not mempool WebSocket — acceptable for demo
3. P2SH/P2WSH risk assessment is conservative (LOW without script analysis)
4. P2PK cannot be tested via address (script type, not address format)
5. Migration planner generates instructions, not unsigned transactions
