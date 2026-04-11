import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { guardianRouter } from "./routes/guardian.js";
import { cogcoinRouter } from "./routes/cogcoin.js";
import { scannerRouter } from "./routes/scanner.js";
import { initCogcoin, getRegisteredIdentity } from "./services/cogcoin.js";
import { initMonitor } from "./services/monitor.js";

const app = express();
const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env["CORS_ORIGIN"] ?? "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use("/api/guardian", guardianRouter);
app.use("/api/cogcoin", cogcoinRouter);
app.use("/api/scanner", scannerRouter);

/** Health check endpoint for uptime monitoring and deployment probes. */
app.get("/api/health", (_req, res) => {
  const identity = getRegisteredIdentity();
  res.json({
    status: "ok",
    service: "satsguard-guardian-api",
    network: process.env["BITCOIN_NETWORK"] ?? "signet",
    timestamp: new Date().toISOString(),
    cogcoin: identity ? { id: identity.id, name: identity.name } : null,
    features: [
      "quantum-scanner",
      "auto-detect-spent",
      "quantum-timeline",
      "migration-planner",
      "bip360-checker",
      "utxo-monitor",
      "guardian-ai",
      "cogcoin",
    ],
  });
});

// ─── Placeholder routes for teammates ───────────────────────────────────────

app.post("/api/wallet/create", (_req, res) => {
  res.status(501).json({ error: "Not implemented yet — Om's task" });
});

// ─── HTTP Server + WebSocket ────────────────────────────────────────────────

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({
    type: "connected",
    message: "SatsGuard Guardian API",
    features: ["scanner:risk_changed", "scanner:tx_detected"],
  }));
});

// Initialize UTXO monitor with WebSocket server
initMonitor(wss);

// ─── Server Startup ─────────────────────────────────────────────────────────

async function start(): Promise<void> {
  // Initialize Cogcoin (non-blocking — server starts even if Cogcoin fails)
  try {
    await initCogcoin();
    console.log("[startup] Cogcoin identity registered");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[startup] Cogcoin init skipped: ${message}`);
  }

  server.listen(PORT, () => {
    console.log(`[startup] SatsGuard Guardian API running on http://localhost:${PORT}`);
    console.log(`[startup] WebSocket available at ws://localhost:${PORT}/ws`);
    console.log(`[startup] Health:   http://localhost:${PORT}/api/health`);
    console.log(`[startup] Guardian: POST http://localhost:${PORT}/api/guardian/parse`);
    console.log(`[startup] Stream:   POST http://localhost:${PORT}/api/guardian/stream`);
    console.log(`[startup] Cogcoin:  POST http://localhost:${PORT}/api/cogcoin/anchor`);
    console.log(`[startup] Scanner endpoints:`);
    console.log(`  GET  /api/scanner/address/:addr/full     — comprehensive scan`);
    console.log(`  GET  /api/scanner/address/:addr/auto     — auto-detect scan`);
    console.log(`  GET  /api/scanner/address/:addr/migrate  — migration plan`);
    console.log(`  GET  /api/scanner/address/:addr/bip360   — BIP-360 check`);
    console.log(`  GET  /api/scanner/timeline               — quantum timeline`);
    console.log(`  POST /api/scanner/monitor/watch          — watch address`);
  });
}

start().catch((error: unknown) => {
  console.error("[startup] Fatal error:", error);
  process.exit(1);
});

export { app };
