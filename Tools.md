# SatsGuard — Tools & Dependencies

## Runtime & Package management

| Tool | Version | Purpose | Install |
|---|---|---|---|
| Bun | latest | Runtime + package manager (8x faster than npm) | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js | 22+ LTS | Fallback runtime for compatibility | Pre-installed or via nvm |
| TypeScript | 5.5+ | Type safety across entire codebase | `bun add -d typescript` |

## Frontend stack

| Tool | Purpose | Install |
|---|---|---|
| Next.js 15 | App Router, SSR, RSC framework | `bun create next-app` |
| React 19 | UI library | Included with Next.js |
| TanStack Query v5 | Server state, caching, mutations | `bun add @tanstack/react-query` |
| Zustand | Client state management | `bun add zustand` |
| Zod | Schema validation | `bun add zod` |
| React Hook Form | Form management | `bun add react-hook-form` |
| @hookform/resolvers | Zod + RHF bridge | `bun add @hookform/resolvers` |
| Tailwind CSS v4 | Utility-first styling | `bun add tailwindcss @tailwindcss/postcss` |
| AnimateUI | Animated UI components | `bun add animate-ui` |
| xior | HTTP client (replaces axios/fetch) | `bun add xior` |
| TanStack Hotkeys | Keyboard shortcut management | `bun add @tanstack/react-hotkeys` |
| Sharp | Image optimization | `bun add sharp` |
| Lucide React | Icon library | `bun add lucide-react` |
| oxlint | Fast linter (replaces ESLint) | `bun add -d oxlint` |

## Backend stack

| Tool | Purpose | Install |
|---|---|---|
| Express | HTTP server | `bun add express @types/express` |
| cors | CORS middleware | `bun add cors @types/cors` |
| @anthropic-ai/sdk | Claude API client | `bun add @anthropic-ai/sdk` |
| ws | WebSocket server | `bun add ws @types/ws` |

## Bitcoin & Crypto

| Tool | Purpose | Install |
|---|---|---|
| nunchuk-cli | Wallet management CLI | Clone from github.com/nunchuk-io |
| nunchuk-cli-agent-skills | AI agent wallet interface | Clone from github.com/nunchuk-io |
| bitcoinjs-lib v6 | Address decoding, tx building | `bun add bitcoinjs-lib` |
| @getalby/sdk | Alby Lightning wallet SDK | `bun add @getalby/sdk` |
| @cogcoin/client | Cogcoin identity and OP_RETURN | npm install (from team access) |
| @cogcoin/genesis | Cogcoin mining/scoring | npm install (from team access) |
| ecpair | Key pair utilities | `bun add ecpair` |
| tiny-secp256k1 | Secp256k1 curve operations | `bun add tiny-secp256k1` |

## Testing & Quality

| Tool | Purpose | Install |
|---|---|---|
| oxlint | Linting (100x faster than ESLint) | `bun add -d oxlint` |
| Polar | Local Lightning network testing | Download from lightningpolar.com |
| MutinyNet | Bitcoin Signet for testing | https://mutinynet.com/ |

## Deployment & Infrastructure

| Tool | Purpose | Tier |
|---|---|---|
| Vercel | Frontend hosting (Next.js) | Free tier |
| Railway | Backend API hosting | Free tier ($5 credit) |
| Render | Backend alternative | Free tier |
| GitHub Actions | CI/CD pipeline | Free for public repos |
| GitHub | Source control | Free |

## Development tools

| Tool | Purpose | Who uses it |
|---|---|---|
| Claude Code | Collaborative AI coding sessions | All team members |
| Codex 5.3 | Bug removal + code optimization | Ruthvik |
| VS Code / Cursor | Code editor | All |
| Postman / Bruno | API testing | Om, Vamsi |
| Chrome DevTools | Frontend debugging | Anusha |
| tmux | Terminal multiplexing (HPC) | Ruthvik, Om |

## AI & ML tools

| Tool | Purpose | Owner |
|---|---|---|
| Anthropic Claude API (Sonnet 4) | Intent parsing, guardian responses | Ruthvik |
| Claude Code Project Session | Team collaboration | All |
| Codex 5.3 | Code review and optimization | Ruthvik |

## Hardware allocation

| Person | Machine | Primary use |
|---|---|---|
| Om Patel | RTX 3050 / Ryzen 7 5800H | Backend API server, Nunchuk CLI, Lightning |
| Ruthvik | MacBook Pro M4 Pro / 24GB | Claude AI integration, Cogcoin, coordination |
| Vamsi | RTX 5070 Ti / 64GB / i9-285H | Quantum scanner, security testing, heavy compute |
| Bhagya | MacBook Pro M4 Pro / 24GB | Deployment, infrastructure, CI/CD |
| Anusha | Dell business laptop | Frontend development, UI/UX, documentation |
| HPC (Ruthvik+Om) | H200 GPUs, Northeastern | Blockchain analysis at scale (if needed) |

## External APIs

| API | Endpoint | Purpose | Auth |
|---|---|---|---|
| Anthropic | api.anthropic.com | Claude AI guardian | API key |
| Mempool.space | mempool.space/signet/api | UTXO lookups, fee data | None (public) |
| Alby NWC | Via Nostr relay | Lightning payments | NWC connection string |
| Cogcoin | cogcoin.org API | Bitcoin identity anchoring | API key (team has access) |
| Blockstream | blockstream.info/testnet/api | Backup UTXO source | None (public) |
