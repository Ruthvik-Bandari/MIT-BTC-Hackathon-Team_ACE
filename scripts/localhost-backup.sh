#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# BitShield — Localhost Backup for Demo
# Starts both backend and frontend locally as fallback if
# cloud deployment fails during the demo.
# Usage: ./scripts/localhost-backup.sh
# ============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== BitShield Localhost Backup ==="
echo ""

# Check .env exists
if [ ! -f "$REPO_ROOT/.env" ]; then
  echo -e "${RED}ERROR: .env file not found at repo root${NC}"
  echo "  Run: cp .env.example .env && fill in your API keys"
  exit 1
fi

# Export env vars for both apps
set -a
source "$REPO_ROOT/.env"
set +a

# Override API URL for local mode
export NEXT_PUBLIC_API_URL="http://localhost:3001"
export NEXT_PUBLIC_WS_URL="ws://localhost:3001/ws"

# Kill any existing processes on our ports
echo -e "${BLUE}[1/4] Clearing ports 3000 and 3001...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 1

# Install dependencies if needed
echo -e "${BLUE}[2/4] Checking dependencies...${NC}"
if [ ! -d "$REPO_ROOT/node_modules" ]; then
  echo "  Installing dependencies..."
  (cd "$REPO_ROOT" && bun install)
fi

# Start backend
echo -e "${BLUE}[3/4] Starting Guardian API on port 3001...${NC}"
(cd "$REPO_ROOT/apps/guardian-api" && bun run dev) &
BACKEND_PID=$!

# Wait for backend
for i in $(seq 1 15); do
  if curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
    echo -e "  ${GREEN}Guardian API ready${NC}"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo -e "  ${RED}Guardian API failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

# Start frontend
echo -e "${BLUE}[4/4] Starting Dashboard on port 3000...${NC}"
(cd "$REPO_ROOT/apps/dashboard" && bun run dev) &
FRONTEND_PID=$!

sleep 3

echo ""
echo -e "${GREEN}=== Localhost backup running ===${NC}"
echo ""
echo "  Dashboard:  http://localhost:3000"
echo "  API:        http://localhost:3001"
echo "  Health:     http://localhost:3001/api/health"
echo "  WebSocket:  ws://localhost:3001/ws"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Cleanup on exit
cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo "Done."
}
trap cleanup EXIT INT TERM

# Wait for either process to exit
wait
