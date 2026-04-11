#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# SatsGuard — Bitcoin Testnet Setup Script
# Run: chmod +x scripts/setup-testnet.sh && ./scripts/setup-testnet.sh
# ============================================================

echo "=== SatsGuard Testnet Setup ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check prerequisites
echo -e "${BLUE}[1/5] Checking prerequisites...${NC}"
if ! command -v bun &>/dev/null; then
  echo "ERROR: Bun not installed. Install from https://bun.sh"
  exit 1
fi
echo "  Bun: $(bun --version)"

# Step 2: Verify .env exists
echo -e "${BLUE}[2/5] Checking environment...${NC}"
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "  ${YELLOW}Created .env from .env.example — fill in your API keys!${NC}"
  else
    echo "  ERROR: No .env or .env.example found"
    exit 1
  fi
else
  echo "  .env exists"
fi

# Step 3: Bitcoin signet/testnet setup instructions
echo ""
echo -e "${BLUE}[3/5] Bitcoin Testnet (MutinyNet Signet) Setup${NC}"
echo "  ┌──────────────────────────────────────────────────────────┐"
echo "  │ 1. Go to: https://mutinynet.com/faucet                  │"
echo "  │ 2. Enter a signet address to receive test sats           │"
echo "  │ 3. You'll get free signet BTC for testing                │"
echo "  │                                                          │"
echo "  │ Alternative faucets:                                     │"
echo "  │  - https://signetfaucet.com                              │"
echo "  │  - https://alt.signetfaucet.com                          │"
echo "  └──────────────────────────────────────────────────────────┘"

# Step 4: Alby NWC setup
echo ""
echo -e "${BLUE}[4/5] Alby Lightning Wallet (NWC) Setup${NC}"
echo "  ┌──────────────────────────────────────────────────────────┐"
echo "  │ 1. Go to: https://getalby.com                           │"
echo "  │ 2. Create an account (free)                              │"
echo "  │ 3. Go to: Settings → Wallet → Nostr Wallet Connect      │"
echo "  │ 4. Create a new NWC connection                           │"
echo "  │ 5. Copy the connection string (starts with               │"
echo "  │    nostr+walletconnect://...)                            │"
echo "  │ 6. Paste into .env as ALBY_NWC_URL=<string>             │"
echo "  └──────────────────────────────────────────────────────────┘"

# Step 5: Verify API connectivity
echo ""
echo -e "${BLUE}[5/5] Testing API connectivity...${NC}"

# Test mempool.space signet API
echo -n "  Mempool.space signet API: "
if curl -sf "https://mempool.space/signet/api/blocks/tip/height" >/dev/null 2>&1; then
  BLOCK_HEIGHT=$(curl -sf "https://mempool.space/signet/api/blocks/tip/height")
  echo -e "${GREEN}OK${NC} (block height: $BLOCK_HEIGHT)"
else
  echo -e "${YELLOW}UNREACHABLE (check network)${NC}"
fi

# Test known signet address
echo -n "  Signet address lookup: "
if curl -sf "https://mempool.space/signet/api/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx" >/dev/null 2>&1; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${YELLOW}UNREACHABLE${NC}"
fi

echo ""
echo -e "${GREEN}=== Setup checklist ===${NC}"
echo "  [ ] .env file created with all keys filled in"
echo "  [ ] ANTHROPIC_API_KEY set (Claude API)"
echo "  [ ] ALBY_NWC_URL set (Lightning wallet)"
echo "  [ ] COGCOIN_API_KEY set (Cogcoin)"
echo "  [ ] BITCOIN_NETWORK=signet in .env"
echo "  [ ] Testnet sats received from faucet"
echo ""
echo -e "${GREEN}Done! Run 'bun run dev' to start the development server.${NC}"
