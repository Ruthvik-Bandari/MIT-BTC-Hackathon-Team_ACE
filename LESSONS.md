# SatsGuard — Lessons Learned Log

Every bug fix gets documented here. Read before coding. Never repeat a mistake.

---

## Template

```
## [HH:MM] Short description
- **Person**: Who hit it
- **Root cause**: Why it happened
- **Fix**: What solved it
- **Prevention rule**: How to avoid it forever
```

---

## Lessons

## [H2:00] CI fails: "bun could not find package.json"
- **Person**: Vamsi
- **Root cause**: CI runs `bun install` from repo root, but package.json only existed in apps/guardian-api/
- **Fix**: Added root package.json with workspaces config + set working-directory in CI workflow
- **Prevention rule**: Monorepos always need a root package.json. CI workflows must specify working-directory for each step.

## [H3:00] Port 3001 in use after smoke test
- **Person**: Vamsi
- **Root cause**: Background bun process from earlier test wasn't killed, holding the port
- **Fix**: Kill process on port before starting: `powershell Get-NetTCPConnection -LocalPort 3001 | Stop-Process`
- **Prevention rule**: Always kill background server processes after testing. Use `kill %1` or port-specific kill.

## [H4:00] oxlint warnings on unused catch parameters
- **Person**: Vamsi
- **Root cause**: `catch (bech32Error)` names the error but doesn't use it — oxlint flags unused vars
- **Fix**: Changed to `catch {` (parameter-less catch, ES2019+)
- **Prevention rule**: Use parameter-less `catch {}` when you intentionally ignore the error. Bun supports ES2022+.

## [H6:00] P2WSH test address checksum invalid
- **Person**: Vamsi
- **Root cause**: Manually constructed bech32 test address had wrong checksum — bitcoinjs-lib rejects it
- **Fix**: Generated valid P2WSH address programmatically using `bitcoin.address.toBech32(Buffer.alloc(32, 0xab), 0, 'tb')`
- **Prevention rule**: Never hand-write bech32 addresses for tests. Generate them with bitcoinjs-lib to guarantee valid checksums.

## [H7:00] Security middleware existed but wasn't wired into index.ts
- **Person**: Vamsi
- **Root cause**: Team's index.ts was rewritten with simpler inline cors setup, didn't import security.ts middleware
- **Fix**: Added imports for `rateLimiter`, `securityHeaders`, `errorHandler` from middleware/security.ts to index.ts
- **Prevention rule**: After merge conflicts, always verify that middleware is actually mounted in the Express app, not just existing as a file.

## [H7:00] Security audit findings
- **Person**: Vamsi
- **Findings**:
  - No secrets in git history (verified with `git log -p -- '*.env'` and grep for API key patterns)
  - No hardcoded API keys in source code
  - All error responses use typed error classes — no stack traces leaked to clients
  - CORS restricts to configured frontend origin
  - Rate limiter active: 60 req/min/IP with proper headers
  - Security headers set: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
  - Zod validation on all scanner request bodies and params
  - Load test: 100 concurrent requests all returned 200, zero failures
- **Prevention rule**: Run security audit checklist before every push to main.

