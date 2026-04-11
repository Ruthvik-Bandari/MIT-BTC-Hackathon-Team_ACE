import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { scannerRouter } from "./routes/scanner.js";
import { initMonitor } from "./services/monitor.js";

const app = express();
const port = Number(process.env["PORT"]) || 3001;

// Middleware
app.use(cors({
  origin: process.env["CORS_ORIGIN"] || "*",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "satsguard-guardian-api",
    network: process.env["BITCOIN_NETWORK"] || "signet",
    timestamp: new Date().toISOString(),
    features: [
      "quantum-scanner",
      "auto-detect-spent",
      "quantum-timeline",
      "migration-planner",
      "bip360-checker",
      "utxo-monitor",
    ],
  });
});

// Placeholder routes — teammates will implement
app.post("/api/guardian/parse", (_req, res) => {
  res.status(501).json({ error: "Not implemented yet — Ruthvik's task" });
});

app.post("/api/wallet/create", (_req, res) => {
  res.status(501).json({ error: "Not implemented yet — Om's task" });
});

// Quantum Scanner (Vamsi) — all scanner routes
app.use("/api/scanner", scannerRouter);

// HTTP server + WebSocket
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

server.listen(port, () => {
  console.log(`[SatsGuard] Guardian API running on port ${port}`);
  console.log(`[SatsGuard] WebSocket available at ws://localhost:${port}/ws`);
  console.log(`[SatsGuard] Network: ${process.env["BITCOIN_NETWORK"] || "signet"}`);
  console.log(`[SatsGuard] Scanner endpoints:`);
  console.log(`  GET  /api/scanner/address/:addr          — manual scan`);
  console.log(`  GET  /api/scanner/address/:addr/auto     — auto-detect scan`);
  console.log(`  GET  /api/scanner/address/:addr/full     — comprehensive scan`);
  console.log(`  GET  /api/scanner/address/:addr/migrate  — migration plan`);
  console.log(`  GET  /api/scanner/address/:addr/bip360   — BIP-360 check`);
  console.log(`  POST /api/scanner/analyze                — batch scan`);
  console.log(`  GET  /api/scanner/network-stats           — network stats`);
  console.log(`  GET  /api/scanner/timeline                — quantum timeline`);
  console.log(`  POST /api/scanner/monitor/watch           — watch address`);
  console.log(`  GET  /api/scanner/monitor/watched         — list watched`);
});
