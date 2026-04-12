#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# BitShield — Demo Seed Script
# Pre-populates the backend with demo data for hackathon presentation
# Run: chmod +x scripts/demo-seed.sh && ./scripts/demo-seed.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="${SATSGUARD_API_URL:-http://localhost:3001}"

echo "=== BitShield Demo Seed ==="
echo "API: $API_URL"
echo ""

# Wait for API to be ready
echo -e "${BLUE}[1/4] Waiting for API...${NC}"
for i in $(seq 1 10); do
  if curl -sf "$API_URL/api/health" >/dev/null 2>&1; then
    echo -e "  ${GREEN}API is ready${NC}"
    break
  fi
  if [ "$i" -eq 10 ]; then
    echo -e "  ${RED}API not responding at $API_URL${NC}"
    echo "  Start the API first: cd apps/guardian-api && bun run dev"
    exit 1
  fi
  sleep 1
done

# Demo addresses with mixed quantum risk levels
echo -e "${BLUE}[2/4] Seeding demo addresses for quantum scan...${NC}"

# P2PKH address (spent from = HIGH risk)
echo -n "  Seeding P2PKH (HIGH risk): "
curl -sf "$API_URL/api/scanner/address/mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn?spent=true" \
  -o /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${YELLOW}SKIP (endpoint not implemented yet)${NC}"

# P2WPKH address (unspent = LOW risk)
echo -n "  Seeding P2WPKH (LOW risk): "
curl -sf "$API_URL/api/scanner/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx" \
  -o /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${YELLOW}SKIP (endpoint not implemented yet)${NC}"

# P2TR address (MEDIUM risk)
echo -n "  Seeding P2TR (MEDIUM risk): "
curl -sf "$API_URL/api/scanner/address/tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c" \
  -o /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${YELLOW}SKIP (endpoint not implemented yet)${NC}"

# Network stats
echo -e "${BLUE}[3/4] Verifying network stats...${NC}"
STATS=$(curl -sf "$API_URL/api/scanner/network-stats" 2>/dev/null || echo '{}')
if echo "$STATS" | grep -q "totalExposedBTC"; then
  echo -e "  ${GREEN}Network stats endpoint working${NC}"
  echo "  Total exposed BTC: $(echo "$STATS" | grep -o '"totalExposedBTC":[0-9]*' | cut -d: -f2)"
else
  echo -e "  ${YELLOW}Network stats not available yet${NC}"
fi

# Guardian test
echo -e "${BLUE}[4/4] Testing guardian parse...${NC}"
GUARDIAN_RESPONSE=$(curl -sf -X POST "$API_URL/api/guardian/parse" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my wallet balance?"}' 2>/dev/null || echo '{}')
if echo "$GUARDIAN_RESPONSE" | grep -q "error"; then
  echo -e "  ${YELLOW}Guardian not implemented yet (expected)${NC}"
else
  echo -e "  ${GREEN}Guardian responding${NC}"
fi

echo ""
echo -e "${GREEN}=== Demo seed complete ===${NC}"
echo ""
echo "Demo flow for judges:"
echo "  1. Open dashboard → show quantum risk meter"
echo "  2. Scan demo addresses → show mixed risk levels"
echo "  3. Ask guardian: 'Scan my wallet for quantum risk'"
echo "  4. Ask guardian: 'Send 5000 sats to tb1q...'"
echo "  5. Show policy enforcement (over-limit denial)"
echo "  6. Show Lightning payment via Alby"
echo "  7. Show 9-minute quantum attack timer"
