import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ServerWebSocket } from "bun";

import { healthRoutes } from "./routes/health.js";
import { walletRoutes } from "./routes/wallet.js";
import { lightningRoutes } from "./routes/lightning.js";
import { guardianRoutes } from "./routes/guardian.js";
import { scannerRoutes } from "./routes/scanner.js";
import { cogcoinRoutes } from "./routes/cogcoin.js";
import { resilienceRoutes } from "./routes/resilience.js";
import { webhookRoutes } from "./routes/webhook.js";
import { errorHandler } from "./middleware/error.js";
import { securityHeaders, rateLimiter } from "./middleware/security.js";
import { initCogcoin } from "./services/cogcoin.js";
import type { WsMessage, WsEventType } from "./utils/types.js";

// ── Hono app ─────────────────────────────────────────────────

const app = new Hono();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(
  cors({
    origin: (origin) => {
      const allowed = [
        process.env.CORS_ORIGIN,
        "http://localhost:3000",
        "https://dashboard-three-sand-20.vercel.app",
      ].filter(Boolean);
      return allowed.includes(origin) ? origin : allowed[0]!;
    },
    credentials: true,
  })
);
app.use(logger());
app.use(securityHeaders);
app.use(rateLimiter);
app.onError(errorHandler);

// ── Routes ──────────────────────────────────────────────────────

app.route("/api/health", healthRoutes);
app.route("/api/wallet", walletRoutes);
app.route("/api/lightning", lightningRoutes);
app.route("/api/guardian", guardianRoutes);
app.route("/api/scanner", scannerRoutes);
app.route("/api/cogcoin", cogcoinRoutes);
app.route("/api/resilience", resilienceRoutes);
app.route("/api/webhook", webhookRoutes);

// ── Bun native HTTP + WebSocket server ──────────────────────────

const clients = new Set<ServerWebSocket<unknown>>();

const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // Upgrade WebSocket requests on /ws path
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // All other requests go through Hono
    return app.fetch(req, server);
  },
  websocket: {
    open(ws) {
      clients.add(ws);
      console.log(`[WS] Client connected (${clients.size} total)`);
    },
    close(ws) {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (${clients.size} total)`);
    },
    message(_ws, _message) {
      // Clients don't send messages in our protocol — server push only
    },
  },
});

// Broadcast helper — used by services to push real-time events
export function broadcast(type: WsEventType, payload: unknown): void {
  const message: WsMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  const data = JSON.stringify(message);

  for (const client of clients) {
    client.send(data);
  }
}

// ── Cogcoin init (non-blocking) ────────────────────────────────
initCogcoin()
  .then(() => console.log("[startup] Cogcoin identity registered"))
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[startup] Cogcoin init skipped: ${msg}`);
  });

console.log(`
  ⚡ BitShield Guardian API (Hono + Bun)
  ├─ HTTP    → http://localhost:${server.port}
  ├─ WS      → ws://localhost:${server.port}/ws
  ├─ Health  → http://localhost:${server.port}/api/health
  ├─ Cogcoin → http://localhost:${server.port}/api/cogcoin/anchor
  ├─ Webhook → http://localhost:${server.port}/api/webhook/nunchuk
  └─ Network: ${process.env.BITCOIN_NETWORK ?? "signet"}
`);
