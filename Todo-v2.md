# SatsGuard — Master TODO (v2 - Updated assignments)

**Repo**: https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git
**Deadline**: Sunday April 12, 8:00 AM ET (Devpost submission)

Legend: `[ ]` todo | `[~]` in progress | `[x]` done
Priority: **P0** = must ship | **P1** = important | **P2** = nice to have

---

## Team assignments (FINAL)

| Person | Primary role | Secondary role | Machine |
|---|---|---|---|
| **Om Patel** | Full-stack: Backend API + Frontend dashboard | Nunchuk CLI + Lightning | RTX 3050 / Ryzen 7 5800H + HPC |
| **Ruthvik** | Claude AI guardian engine + Cogcoin | Team coordination, Codex optimization | MacBook Pro M4 Pro + HPC |
| **Vamsi** | Quantum vulnerability scanner + security | API security audit, testing | 5070 Ti / 64GB / i9-285H |
| **Bhagya** | Deployment + infrastructure + CI/CD | Testnet setup, env management | MacBook Pro M4 Pro |
| **Anusha** | Documentation + presentation + demo video | Light frontend content (copy, static pages), QA testing | Dell business laptop |

---

## Phase 0: Setup (Hours 0-1) — ALL TEAM

### Repo and environment
- [ ] **P0** | ALL | Clone repo and verify push access for all 5 members
- [ ] **P0** | Ruthvik | Create monorepo folder structure per TRD.md
- [ ] **P0** | Ruthvik | Add .gitignore, README.md, PRD.md, TRD.md, Tools.md, Resources.md
- [ ] **P0** | Ruthvik | Create .env.example with placeholder keys
- [ ] **P0** | ALL | `bun install` on each machine, verify Bun works
- [ ] **P0** | Ruthvik | Set up Claude Code project session for collaboration
- [ ] **P0** | Anusha | Create LESSONS.md in repo root

### Critical first-hour actions
- [ ] **P0** | Om | Find Nunchuk sponsor reps, confirm CLI setup process
- [ ] **P0** | Om | Clone nunchuk-cli + nunchuk-cli-agent-skills repos
- [ ] **P0** | Om | Scaffold Next.js 15 app (`apps/dashboard/`) with Tailwind + AnimateUI + TypeScript
- [ ] **P0** | Om | Scaffold Express server (`apps/guardian-api/`) with TypeScript
- [ ] **P0** | Ruthvik | Set up Anthropic API key, test Claude API call
- [ ] **P0** | Vamsi | Install bitcoinjs-lib, test address decoding
- [ ] **P0** | Bhagya | Create Alby wallet, get NWC connection string
- [ ] **P0** | Bhagya | Set up Vercel project linked to repo
- [ ] **P0** | Anusha | Set up Devpost draft submission, start writing project description

### First commit (within 15 minutes)
- [ ] **P0** | Ruthvik | Push initial structure commit
- [ ] **P0** | ALL | Each member pushes at least one commit in first hour

---

## Phase 1: Foundation (Hours 1-6) — PARALLEL WORK

### Om Patel — Backend API + Frontend scaffold (FULL STACK)

**Backend (hours 1-3)**
- [ ] **P0** | Create Express server entry point with TypeScript + cors + JSON parsing
- [ ] **P0** | Set up Nunchuk CLI wrapper service (`services/nunchuk.ts`)
- [ ] **P0** | Implement POST /api/wallet/create (group wallet)
- [ ] **P0** | Implement POST /api/wallet/set-policy (spending limits)
- [ ] **P0** | Implement POST /api/wallet/send (initiate transaction with policy check)
- [ ] **P0** | Implement POST /api/wallet/approve/:txId and /deny/:txId
- [ ] **P0** | Implement GET /api/wallet/balance
- [ ] **P0** | Set up WebSocket server for live updates (ws library)
- [ ] **P0** | Implement GET /api/health

**Frontend scaffold (hours 3-6)**
- [ ] **P0** | Set up Next.js 15 with App Router + SSR
- [ ] **P0** | Install and configure full stack: TanStack Query, Zustand, Zod, React Hook Form, @hookform/resolvers, AnimateUI, xior, TanStack Hotkeys, oxlint
- [ ] **P0** | Create project structure per TRD.md (components/, dal/, hooks/, stores/, schemas/, lib/, providers/)
- [ ] **P0** | Set up xior instance with base URL and interceptors (`lib/xior.ts`)
- [ ] **P0** | Create QueryProvider.tsx (TanStack Query client)
- [ ] **P0** | Create ThemeProvider.tsx (dark mode)
- [ ] **P0** | Create DAL files: guardian.dal.ts, wallet.dal.ts, scanner.dal.ts, lightning.dal.ts
- [ ] **P0** | Create root layout with sidebar navigation + dark theme
- [ ] **P0** | Build GuardianChat.tsx (text input + message list + send button)
- [ ] **P0** | Build WalletOverview.tsx (balance card + policy display)
- [ ] Commit every 30-45 minutes with descriptive messages

### Ruthvik — Claude AI Guardian + Cogcoin
- [ ] **P0** | Create `services/claude.ts` with guardian system prompt
- [ ] **P0** | Implement POST /api/guardian/parse (intent parsing)
- [ ] **P0** | Test Claude with sample commands:
  - "Let my AI spend up to 5000 sats per day"
  - "Send 10000 sats to tb1q..."
  - "What's my balance?"
  - "Scan my wallet for quantum risk"
- [ ] **P0** | Create structured JSON output parser for Claude responses
- [ ] **P0** | Add quantum risk warnings to transaction flow
- [ ] **P1** | Set up Cogcoin npm packages and test connection
- [ ] **P1** | Implement Cogcoin identity registration for SatsGuard
- [ ] **P1** | Create Cogcoin OP_RETURN anchoring for guardian events
- [ ] Commit every 30-45 minutes

### Vamsi — Quantum Vulnerability Scanner + Security
- [ ] **P0** | Create `services/quantum.ts` with full address classifier
- [ ] **P0** | Implement detectAddressType() for P2PK, P2PKH, P2WPKH, P2TR, P2SH, P2WSH
- [ ] **P0** | Implement assessQuantumRisk() with Google whitepaper data
- [ ] **P0** | Implement analyzeWallet() batch scanner
- [ ] **P0** | Create API routes:
  - POST /api/scanner/analyze
  - GET /api/scanner/address/:addr
  - GET /api/scanner/network-stats
- [ ] **P0** | Test with known address formats on signet
- [ ] **P0** | Verify risk levels match whitepaper exactly
- [ ] **P1** | Add mempool.space API integration for spent-from detection
- [ ] **P1** | Add Zod validation on all API request bodies
- [ ] Commit every 30-45 minutes

### Bhagya — Infrastructure + Deployment
- [ ] **P0** | Set up Vercel project for Next.js frontend
- [ ] **P0** | Set up Railway or Render for backend API
- [ ] **P0** | Configure environment variables on both platforms
- [ ] **P0** | Set up GitHub Actions CI (lint + typecheck) using ci.yml
- [ ] **P0** | Test deployment pipeline (push main → auto deploy)
- [ ] **P0** | Set up MutinyNet signet, fund testnet wallet via faucet
- [ ] **P0** | Set up Alby wallet with NWC connection
- [ ] **P1** | Set up Polar for local Lightning testing
- [ ] Commit every 30-45 minutes

### Anusha — Documentation + Presentation prep
- [ ] **P0** | Complete Devpost submission draft (project description, team bios)
- [ ] **P0** | Create pitch deck outline (5 slides in Google Slides or Canva)
- [ ] **P0** | Write slide 1 content: "The problem" (AI agents + quantum crisis)
- [ ] **P0** | Write slide 2 content: "SatsGuard solution"
- [ ] **P0** | Collect screenshots of working features as they come online
- [ ] **P0** | Research judge backgrounds for pitch targeting (see Resources.md)
- [ ] **P0** | Start demo video script (what to show in what order)
- [ ] **P1** | Create social media post drafts for after the hackathon
- [ ] **P1** | Write ARCHITECTURE.md with system diagram
- [ ] Commit docs every 30-45 minutes (docs/ folder)

---

## Phase 2: Core Integration (Hours 6-14) — CONNECT EVERYTHING

### Om Patel — Full integration

**Backend (hours 6-9)**
- [ ] **P0** | Complete wallet create → set policy → send → approve/deny flow
- [ ] **P0** | Connect Lightning payment (Alby NWC) to wallet policy check
- [ ] **P0** | Implement POST /api/lightning/pay
- [ ] **P0** | Implement GET /api/lightning/balance
- [ ] **P0** | Emit WebSocket events: transaction:pending, transaction:approved, transaction:executed, lightning:settled
- [ ] **P0** | Test end-to-end on testnet: create wallet → set limit → agent sends → approve

**Frontend features (hours 9-14)**
- [ ] **P0** | Connect GuardianChat to POST /api/guardian/parse via DAL
- [ ] **P0** | Connect WalletOverview to GET /api/wallet/balance via TanStack Query
- [ ] **P0** | Build QuantumRiskMeter.tsx (overall risk traffic light)
- [ ] **P0** | Build AddressCard.tsx (expandable per-address risk)
- [ ] **P0** | Build QuantumTimer.tsx (9-minute attack countdown — the wow piece)
- [ ] **P0** | Build TransactionList.tsx (pending/approved/executed with status badges)
- [ ] **P0** | Build PaymentDemo.tsx (live Lightning payment widget)
- [ ] **P0** | Create Zustand stores: chat.store.ts, wallet.store.ts, ui.store.ts
- [ ] **P0** | Create TanStack Query hooks: useGuardian, useWallet, useQuantumScan, useLightning
- [ ] **P0** | Wire WebSocket for real-time transaction updates
- [ ] **P1** | Build PolicyEditor.tsx with React Hook Form + Zod
- [ ] **P1** | Build NetworkStats.tsx (6.9M BTC at risk display)

### Ruthvik — AI refinement + Cogcoin
- [ ] **P0** | Refine Claude system prompt based on real testing
- [ ] **P0** | Add wallet state context injection to Claude for better parsing
- [ ] **P0** | Implement streaming responses from Claude (SSE for chat UX)
- [ ] **P0** | Connect scanner warnings into guardian transaction flow
- [ ] **P0** | Run Codex 5.3 on backend code for bug detection
- [ ] **P1** | Implement Cogcoin anchoring for policy changes
- [ ] **P1** | Create verification endpoint for Cogcoin-anchored events

### Vamsi — Scanner hardening + security
- [ ] **P0** | Integrate scanner with real testnet UTXO lookups (mempool.space)
- [ ] **P0** | Add spent-from detection via API
- [ ] **P0** | Create demo dataset: 3-5 addresses with mixed risk levels
- [ ] **P0** | Write tests for all address types
- [ ] **P0** | Security review all API endpoints (input validation, error handling)
- [ ] **P1** | Add rate limiting middleware
- [ ] **P1** | Penetration test the deployed API

### Bhagya — Deployment monitoring
- [ ] **P0** | Verify backend deploys correctly, test all endpoints via curl
- [ ] **P0** | Test WebSocket connection in deployed environment
- [ ] **P0** | Monitor deployment logs, fix environment issues
- [ ] **P0** | Ensure CORS allows frontend domain
- [ ] **P0** | Fund additional testnet sats if needed
- [ ] **P1** | Set up deployment status badges in README

### Anusha — Content + QA
- [ ] **P0** | Write slide 3 content: "Live demo" (what judges will see step by step)
- [ ] **P0** | Write slide 4 content: "Technical depth" (architecture diagram)
- [ ] **P0** | Write slide 5 content: "Why this matters" (6.9M BTC + future vision)
- [ ] **P0** | Screenshot every working feature for deck and Devpost
- [ ] **P0** | QA test: click through the entire frontend, log bugs in LESSONS.md
- [ ] **P0** | Update README.md with current screenshots
- [ ] **P1** | Write speaker notes for each pitch slide
- [ ] **P1** | Create a simple "About" or "How it works" static page in the dashboard
- [ ] **P1** | Help Om with static content text in UI components (labels, descriptions, tooltips)

---

## Phase 3: Polish + Demo Ready (Hours 14-24)

### Om Patel
- [ ] **P0** | Add AnimateUI animations to key interactions (card reveals, chat messages, timer)
- [ ] **P0** | Dark theme consistency pass across all components
- [ ] **P0** | Responsive design testing (desktop + mobile)
- [ ] **P0** | Loading states and skeleton screens for every data fetch
- [ ] **P0** | Run full demo flow 3 times: guardian chat → policy set → scan → send → approve → Lightning
- [ ] **P0** | Fix any edge cases in frontend or backend
- [ ] **P1** | Add TanStack Hotkeys: Cmd+K command palette, Cmd+S scan wallet
- [ ] **P1** | Error boundary components for graceful failures

### Ruthvik
- [ ] **P0** | Test all Claude intent parsing edge cases
- [ ] **P0** | Optimize Claude prompts for speed (target < 3s)
- [ ] **P0** | Run Codex 5.3 on full codebase for final optimization
- [ ] **P0** | Coordinate team — verify every person has 8+ commits
- [ ] **P1** | Finalize Cogcoin integration

### Vamsi
- [ ] **P0** | Final security audit of deployed system
- [ ] **P0** | Verify all quantum classifications against Google whitepaper one last time
- [ ] **P0** | Load test scanner endpoints (100 concurrent requests)
- [ ] **P0** | Verify no secrets exposed in git history or client bundle
- [ ] **P1** | Document security architecture in docs/ARCHITECTURE.md

### Bhagya
- [ ] **P0** | Verify production deployment is stable under load
- [ ] **P0** | Test from mobile device (judges check on phones)
- [ ] **P0** | Create demo seed script: pre-populate wallet with 3-5 addresses of mixed risk
- [ ] **P0** | Ensure zero downtime during demo window (Sunday morning)
- [ ] **P1** | Create deployment runbook for emergency recovery

### Anusha
- [ ] **P0** | Finalize all 5 pitch slides with visuals and speaker notes
- [ ] **P0** | Full QA pass: test every button, form, and flow in the dashboard
- [ ] **P0** | Log all bugs found in LESSONS.md with screenshots
- [ ] **P0** | Prepare demo script (exact click sequence for the 3-min demo)
- [ ] **P0** | Set up screen recording software (OBS or QuickTime)
- [ ] **P1** | Create a one-page "cheat sheet" for the presenter with key stats

---

## Phase 4: Deliverables (Hours 24-32)

### Om
- [ ] **P0** | Final code cleanup: remove console.logs, unused imports, commented code
- [ ] **P0** | Run `bunx oxlint .` and fix all warnings
- [ ] **P0** | Run `bun run typecheck` and fix all errors
- [ ] **P0** | Ensure build passes: `bun run build` in both apps

### Ruthvik
- [ ] **P0** | Final demo rehearsal with full team (3 minutes, timed)
- [ ] **P0** | Review all commits: verify 5 contributors, descriptive messages
- [ ] **P0** | Final Codex 5.3 optimization pass
- [ ] **P0** | Write final README.md with screenshots, architecture, setup guide

### Vamsi
- [ ] **P0** | Final security sign-off (no vulnerabilities in deployed system)
- [ ] **P0** | Verify all test addresses produce correct risk classifications
- [ ] **P0** | Review LESSONS.md for any unresolved issues

### Bhagya
- [ ] **P0** | Verify live demo URL works perfectly
- [ ] **P0** | Have localhost backup ready in case deployment fails
- [ ] **P0** | Run demo seed script on deployed backend
- [ ] **P0** | Final deployment health check

### Anusha
- [ ] **P0** | Record demo video (3-5 min): screen recording with narration
- [ ] **P0** | Edit demo video (trim dead time, add captions if needed)
- [ ] **P0** | Upload demo video (YouTube unlisted or Loom)
- [ ] **P0** | Complete Devpost submission: description, deck, repo link, video link
- [ ] **P0** | Final proofread of all documentation

---

## Phase 5: Submission + Pitch (Hours 32-36)

- [ ] **P0** | Anusha | Submit on Devpost BEFORE Sunday 8:00 AM ET
- [ ] **P0** | Anusha | Double-check all Devpost fields filled correctly
- [ ] **P0** | Anusha | Verify demo video link works
- [ ] **P0** | Ruthvik | Verify GitHub repo is public and accessible
- [ ] **P0** | ALL | Final demo run-through (one last time)
- [ ] **P0** | Assign pitch roles:
  - **Narrator/Pitcher**: Ruthvik (knows the AI + quantum story best)
  - **Demo operator**: Om (built the full stack, knows every click)
  - **Q&A backup**: Vamsi (security/quantum depth) + Bhagya (infra questions)
  - **Timer/support**: Anusha (keeps pitch on track, handles slides)

---

## Self-feedback loop protocol

Before committing ANY code, run this checklist:

```
1. Does it compile?     → bun run typecheck
2. Does it lint?        → bunx oxlint .
3. Does it work?        → Test the feature manually
4. Is it secure?        → No hardcoded secrets, validated inputs
5. Is it documented?    → JSDoc on exports, clear variable names
6. Does it follow SOLID? → One responsibility per component/function
7. Descriptive commit?  → "feat(scanner): add P2TR risk classification"
```

If ANY check fails → fix BEFORE committing → log in LESSONS.md.

---

## Commit tracking

| Time | Person | Commit message |
|---|---|---|
| H0:00 | Ruthvik | feat: initialize monorepo with project docs |
| H0:15 | Om | feat(api): scaffold express server with typescript |
| H0:15 | Om | feat(dashboard): scaffold next.js 15 app with tailwind |
| H0:15 | Vamsi | feat(scanner): add bitcoin address type decoder |
| H0:15 | Bhagya | chore: add github actions ci workflow |
| H0:15 | Anusha | docs: create devpost draft and pitch outline |
| ... | ... | ... |

**Rule**: minimum 1 commit per person per 45 minutes.
