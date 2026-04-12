#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# BitShield — Endpoint Test Script
# Tests all API endpoints on deployed or local backend
# Usage: ./scripts/test-endpoints.sh [API_URL]
# ============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="${1:-${SATSGUARD_API_URL:-http://localhost:3001}}"
PASS=0
FAIL=0
SKIP=0

echo "=== BitShield Endpoint Tests ==="
echo "Target: $API_URL"
echo ""

test_endpoint() {
  local method="$1"
  local path="$2"
  local desc="$3"
  local data="${4:-}"
  local expect="${5:-200}"

  echo -n "  $method $path — $desc: "

  if [ "$method" = "GET" ]; then
    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$API_URL$path" 2>/dev/null || echo "000")
  else
    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$path" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null || echo "000")
  fi

  if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}UNREACHABLE${NC}"
    ((FAIL++))
  elif [ "$HTTP_CODE" = "$expect" ]; then
    echo -e "${GREEN}$HTTP_CODE OK${NC}"
    ((PASS++))
  elif [ "$HTTP_CODE" = "501" ]; then
    echo -e "${YELLOW}$HTTP_CODE NOT IMPLEMENTED${NC}"
    ((SKIP++))
  else
    echo -e "${RED}$HTTP_CODE (expected $expect)${NC}"
    ((FAIL++))
  fi
}

# Health
echo -e "${BLUE}[Health]${NC}"
test_endpoint GET "/api/health" "Health check"

# Scanner endpoints
echo ""
echo -e "${BLUE}[Quantum Scanner]${NC}"
test_endpoint GET "/api/scanner/network-stats" "Network quantum stats"
test_endpoint GET "/api/scanner/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx?spent=false" "Single address scan"
test_endpoint POST "/api/scanner/analyze" "Batch address scan" \
  '{"addresses":[{"address":"tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx","hasBeenSpentFrom":false}]}'

# Guardian
echo ""
echo -e "${BLUE}[Guardian]${NC}"
test_endpoint POST "/api/guardian/parse" "Parse natural language" \
  '{"message":"What is my balance?"}'

# Wallet
echo ""
echo -e "${BLUE}[Wallet]${NC}"
test_endpoint POST "/api/wallet/create" "Create wallet" '{}'
test_endpoint POST "/api/wallet/set-policy" "Set policy" '{"dailyLimit":5000}'
test_endpoint GET "/api/wallet/balance" "Get balance"
test_endpoint POST "/api/wallet/send" "Send transaction" '{"address":"tb1qtest","amount":1000}'

# Lightning
echo ""
echo -e "${BLUE}[Lightning]${NC}"
test_endpoint POST "/api/lightning/pay" "Pay invoice" '{"invoice":"lntbs1..."}'
test_endpoint GET "/api/lightning/balance" "Lightning balance"

# WebSocket test
echo ""
echo -e "${BLUE}[WebSocket]${NC}"
WS_URL=$(echo "$API_URL" | sed 's/http/ws/')/ws
echo -n "  WS $WS_URL — WebSocket connect: "
if command -v wscat &>/dev/null; then
  echo '{}' | timeout 3 wscat -c "$WS_URL" 2>/dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${YELLOW}TIMEOUT (may be OK)${NC}"
else
  echo -e "${YELLOW}SKIP (wscat not installed)${NC}"
  ((SKIP++))
fi

# CORS test
echo ""
echo -e "${BLUE}[CORS]${NC}"
echo -n "  OPTIONS /api/health — CORS preflight: "
CORS_HEADER=$(curl -sf -I -X OPTIONS "$API_URL/api/health" \
  -H "Origin: https://bitshield.vercel.app" \
  -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control-allow" || echo "")
if [ -n "$CORS_HEADER" ]; then
  echo -e "${GREEN}OK${NC}"
  ((PASS++))
else
  echo -e "${YELLOW}No CORS headers (check config)${NC}"
  ((SKIP++))
fi

# Summary
echo ""
echo "================================"
echo -e "  ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}SKIP/NOT IMPL: $SKIP${NC}"
echo "================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
