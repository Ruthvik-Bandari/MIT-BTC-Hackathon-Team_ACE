# SatsGuard — Security Architecture

**Author**: Vamsi Yanamadala (Security Lead, Team ACE)
**Last Updated**: April 11, 2026

---

## 1. Threat Model

SatsGuard faces three categories of threats:

### Quantum Computing Threats
- **Shor's algorithm** can derive private keys from exposed public keys
- Google Quantum AI whitepaper (March 30, 2026): <500K qubits breaks secp256k1 in ~9 minutes
- 6.9 million BTC have exposed public keys on-chain today
- 1.7 million BTC locked in P2PK outputs (Satoshi era, always exposed)

### API Security Threats
- Input injection via malformed addresses or request bodies
- Denial of service via high-volume requests
- Cross-origin attacks from unauthorized frontends
- Information leakage through verbose error messages

### Wallet Security Threats
- Unauthorized AI agent transactions exceeding policy limits
- Private key exposure through API responses
- Man-in-the-middle attacks on transaction signing

---

## 2. Security Architecture Diagram

```
                          ┌─────────────────┐
                          │   Frontend       │
                          │   (Vercel)       │
                          │   HTTPS only     │
                          └────────┬────────┘
                                   │ xior (CORS restricted)
                          ┌────────▼────────┐
                          │  Security Layer  │
                          │  ┌────────────┐  │
                          │  │ CORS       │  │  ← Origin whitelist
                          │  │ Rate Limit │  │  ← 60 req/min/IP
                          │  │ Body Guard │  │  ← 256KB max
                          │  │ Headers    │  │  ← HSTS, CSP, X-Frame
                          │  │ Zod Valid  │  │  ← Schema validation
                          │  └────────────┘  │
                          └────────┬────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │                   │                   │
      ┌────────▼──────┐  ┌────────▼──────┐  ┌────────▼──────┐
      │ Guardian AI   │  │ Quantum       │  │ Wallet        │
      │ (Claude)      │  │ Scanner       │  │ (Nunchuk)     │
      │               │  │               │  │               │
      │ Intent parse  │  │ Address type  │  │ Group wallet  │
      │ Risk warnings │  │ Risk assess   │  │ Policy limits │
      │ Streaming     │  │ Mempool API   │  │ Co-signing    │
      └───────────────┘  │ Timeline      │  └───────────────┘
                         │ Migration     │
                         │ BIP-360       │
                         │ UTXO Monitor  │
                         └───────────────┘
```

---

## 3. Security Controls Implemented

### 3.1 Input Validation (Zod)

Every API endpoint validates request data using Zod schemas before processing:

| Endpoint | Schema | Validates |
|---|---|---|
| POST /api/scanner/analyze | `analyzeRequestSchema` | Array of 1-100 addresses, each with valid Bitcoin prefix and boolean spent flag |
| GET /api/scanner/address/:addr | `addressParamsSchema` | Address string 20-90 chars |
| GET /api/scanner/address/:addr?spent= | `addressQuerySchema` | Enum "true"/"false", defaults to "false" |
| POST /api/scanner/monitor/watch | `watchRequestSchema` | Valid Bitcoin address prefix |
| GET /api/scanner/timeline/year/:year | `yearParamsSchema` | Integer 2024-2040 |

Bitcoin address prefix validation accepts: `tb1`, `bc1`, `bcrt1` (bech32), `1`, `3`, `m`, `n`, `2` (base58).

### 3.2 Rate Limiting

- **Algorithm**: In-memory sliding window counter per client IP
- **Limit**: 60 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Response**: HTTP 429 with `retryAfter` seconds when exceeded
- **Cleanup**: Expired entries pruned every 60 seconds to prevent memory leak

### 3.3 CORS

- **Allowed Origins**: `FRONTEND_URL` environment variable + localhost:3000/3001
- **Methods**: GET, POST, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: Enabled
- **Preflight Cache**: 24 hours

### 3.4 Security Headers

| Header | Value | Purpose |
|---|---|---|
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | XSS filter |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Force HTTPS |
| Content-Security-Policy | default-src 'self' | Restrict content sources |
| X-Powered-By | (removed) | Hide server technology |

### 3.5 Error Handling

Typed error classes prevent information leakage:

- `AppError` → Base class with code, message, statusCode
- `ValidationError` → 400 with Zod details
- `ScanError` → 422 for address decode failures
- `RateLimitError` → 429
- `NotFoundError` → 404

Unknown/unexpected errors return generic "An unexpected error occurred" — no stack traces, no internal details.

### 3.6 Request Body Size Limit

- Maximum body size: 256KB
- Checked via `Content-Length` header before parsing
- Returns 413 if exceeded

---

## 4. Quantum Scanner Security Model

### 4.1 Risk Classification Integrity

All risk classifications are derived from the Google Quantum AI whitepaper (March 30, 2026). No estimated or hallucinated data:

| Address Type | Spent? | Risk | Whitepaper Basis |
|---|---|---|---|
| P2PK | always | CRITICAL | Key directly in scriptPubKey |
| P2PKH | yes | HIGH | Key revealed in scriptSig |
| P2WPKH | yes | HIGH | Key revealed in witness |
| P2TR | always | MEDIUM | Tweaked key in output |
| P2PKH/P2WPKH | no | LOW | Hash-protected (HASH160) |
| P2SH/P2WSH | no | LOW | Hash-protected |

### 4.2 Mempool API Integration

- **Source**: mempool.space signet API (public, no auth)
- **Timeout**: 10 seconds per request
- **Fallback**: If mempool API fails, scanner falls back to manual mode with `spent=false`
- **No secrets**: Public API, no keys stored

### 4.3 UTXO Monitor

- **Polling interval**: 30 seconds
- **Broadcast**: WebSocket to all connected clients
- **Events**: `scanner:risk_changed` (key exposure detected), `scanner:tx_detected` (new transaction)
- **No persistent storage**: Watch list is in-memory, clears on restart

---

## 5. Wallet Security (Nunchuk Integration)

- Private keys **NEVER** leave Nunchuk's secure enclave
- AI agent key has bounded authority (policy co-signer enforces limits)
- All transactions above the daily limit require human approval
- Transaction history is auditable
- Testnet/signet only — no mainnet operations

---

## 6. Environment & Secrets Management

| Secret | Storage | Never In |
|---|---|---|
| ANTHROPIC_API_KEY | Environment variable | Git, client bundle |
| ALBY_NWC_URL | Environment variable | Git, client bundle |
| COGCOIN_API_KEY | Environment variable | Git, client bundle |
| CORS_ORIGIN | Environment variable | — |
| PORT | Environment variable | — |

`.env` is in `.gitignore`. `.env.example` contains only placeholder values.

---

## 7. Test Coverage

| Test Suite | Tests | Status |
|---|---|---|
| Address type detection | 11 tests | All pass |
| Public key exposure | 8 tests | All pass |
| Risk assessment | 7 tests | All pass |
| Batch wallet analysis | 2 tests | All pass |
| Network stats verification | 1 test | All pass |
| **Total** | **29 tests** | **29 pass, 0 fail** |

Run: `bun test tests/quantum.test.ts`

---

## 8. Known Limitations

1. Rate limiter is in-memory — resets on server restart, not shared across instances
2. UTXO monitor uses polling (30s) not mempool WebSocket — acceptable for demo
3. P2SH/P2WSH risk assessment is conservative (treated as LOW without script analysis)
4. P2PK cannot be tested via address (it's a script type, not an address format) — classified by API hint parameter
5. Migration planner generates instructions, not actual unsigned transactions (bitcoinjs-lib could be extended for this)
