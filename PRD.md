# SatsGuard — Product Requirements Document (PRD)

**Project**: SatsGuard - AI-Powered Bitcoin Guardian with Quantum Defense
**Event**: MIT Bitcoin Expo 2026 Hackathon (April 10-12)
**Team**: Team ACE
**Repo**: https://github.com/Ruthvik-Bandari/MIT-BTC-Hackathon-Team_ACE.git

---

## 1. Product vision

SatsGuard is the world's first AI-powered Bitcoin financial guardian that protects funds from both rogue AI agents and quantum computer attacks. Built on Nunchuk's AI agent tools (released April 8, 2026) and informed by Google Quantum AI's March 30 whitepaper, SatsGuard lets users control AI agent spending through natural language while proactively scanning for quantum-vulnerable addresses.

## 2. Target users

- Bitcoin holders concerned about AI agent access to their wallets
- Institutional custodians preparing for post-quantum migration
- Developers integrating AI agents with Bitcoin payment infrastructure
- Hackathon judges evaluating practical Bitcoin security tools

## 3. Core features (MVP for hackathon)

### F1: Natural language guardian interface
**Priority**: P0 (must have)
**Owner**: Ruthvik

Users speak commands in plain English. Claude AI parses intent and translates to wallet operations.

**Acceptance criteria**:
- User can set spending policies: "Let my AI spend up to 5000 sats per day"
- User can initiate transactions: "Send 10000 sats to tb1q..."
- User can query status: "What's my balance?" / "Show my quantum risk"
- Guardian warns before risky operations
- Response time < 3 seconds for intent parsing

### F2: Nunchuk bounded-authority wallet
**Priority**: P0 (must have)
**Owner**: Om

AI agent operates within strict policy limits using Nunchuk's group wallet model.

**Acceptance criteria**:
- Create group wallet (user key + agent key + policy co-signer)
- Configure daily spending limit in sats
- Auto-approve transactions below limit
- Queue transactions above limit for human approval
- Human can approve/deny pending transactions from dashboard
- Transaction history with policy enforcement logs

### F3: Quantum vulnerability scanner
**Priority**: P0 (must have)
**Owner**: Vamsi

Analyze Bitcoin addresses for quantum computing vulnerability based on Google's whitepaper.

**Acceptance criteria**:
- Classify all major address types (P2PK, P2PKH, P2WPKH, P2TR, P2SH, P2WSH)
- Detect whether public key has been exposed (spent-from detection)
- Assign risk levels: CRITICAL / HIGH / MEDIUM / LOW / SAFE
- Provide specific recommendations per address
- Show network-wide stats (6.9M BTC at risk)
- 9-minute quantum attack countdown timer for demo

### F4: Lightning payment integration
**Priority**: P0 (must have)
**Owner**: Om

Live Lightning micropayments for the demo using Alby NWC.

**Acceptance criteria**:
- Connect to Alby wallet via Nostr Wallet Connect
- Agent discovers paid API endpoint
- Agent pays Lightning invoice within policy limits
- Payment settles in < 2 seconds (visible to judges)
- Receipt displayed on dashboard
- Works on testnet/signet

### F5: Dashboard UI
**Priority**: P0 (must have)
**Owner**: Anusha (with tech stack from Ruthvik)

React-based dashboard displaying all guardian activity.

**Acceptance criteria**:
- Guardian chat panel (natural language input/output)
- Wallet overview (balance, policy, agent activity)
- Quantum risk meter with per-address breakdown
- Transaction flow visualization (pending/approved/executed)
- 9-minute quantum attack timer (interactive simulation)
- Responsive design, dark theme
- Built with specified Next.js + TanStack + Tailwind + AnimateUI stack

### F6: Deployment
**Priority**: P0 (must have)
**Owner**: Bhagya

Deploy on free-tier infrastructure for live demo.

**Acceptance criteria**:
- Frontend deployed (Vercel free tier)
- Backend API deployed (Railway free tier or Render)
- Environment variables secured
- HTTPS endpoints
- < 500ms cold start

### F7: Cogcoin identity integration
**Priority**: P1 (nice to have)
**Owner**: Ruthvik + Vamsi

Anchor SatsGuard guardian events on Bitcoin via Cogcoin OP_RETURN.

**Acceptance criteria**:
- Register SatsGuard as Cogcoin identity
- Anchor policy changes and quantum scan results on-chain
- Verifiable audit trail of guardian actions
- Uses Cogcoin npm packages (confirmed access)

## 4. Non-functional requirements

| Requirement | Target |
|---|---|
| API response time | < 3 seconds (Claude parsing) |
| Lightning payment latency | < 2 seconds |
| Frontend load time | < 2 seconds (Lighthouse) |
| Uptime during demo | 100% |
| Browser support | Chrome, Safari (latest) |
| Mobile responsive | Yes (judges may check on phone) |

## 5. Out of scope (for this hackathon)

- Mainnet deployment (testnet/signet only)
- Full BIP-360 P2MR implementation
- OP_CAT covenant scripts
- Production key management
- Multi-language support

## 6. Success metrics

- Working end-to-end demo with zero failures during pitch
- Live Lightning payment settling on screen
- Quantum scanner correctly classifying all address types
- Consistent GitHub commit history from all 5 team members
- Devpost submission before Sunday 8:00 AM ET
- 3-5 minute demo video recorded and uploaded

## 7. Judging criteria alignment

| Criteria | How SatsGuard scores |
|---|---|
| Technical | Nunchuk multisig + Claude AI + quantum analysis + Lightning + Cogcoin anchoring |
| Originality | First-ever product on Nunchuk's 48-hour-old tools + quantum defense angle |
| Ambitious | Solving AI agent safety + quantum migration in one product |
| Design/UX | Natural language interface, zero crypto jargon for end users |
| Wow Factor | Live Lightning payment + 9-minute quantum attack timer + real-time AI guardian |
