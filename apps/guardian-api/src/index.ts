import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";

const app = express();
const port = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "satsguard-guardian-api",
    network: process.env.BITCOIN_NETWORK || "signet",
    timestamp: new Date().toISOString(),
  });
});

// Placeholder routes — teammates will implement
app.post("/api/guardian/parse", (_req, res) => {
  res.status(501).json({ error: "Not implemented yet — Ruthvik's task" });
});

app.post("/api/wallet/create", (_req, res) => {
  res.status(501).json({ error: "Not implemented yet — Om's task" });
});

app.get("/api/scanner/network-stats", (_req, res) => {
  res.json({
    totalExposedBTC: 6_900_000,
    p2pkAddresses: 1_700_000,
    attackTimeMinutes: 9,
    qubitsRequired: 500_000,
    source: "Google Quantum AI, March 2026",
  });
});

// HTTP server + WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "connected", message: "SatsGuard Guardian API" }));
});

server.listen(port, () => {
  console.log(`[SatsGuard] Guardian API running on port ${port}`);
  console.log(`[SatsGuard] WebSocket available at ws://localhost:${port}/ws`);
  console.log(`[SatsGuard] Network: ${process.env.BITCOIN_NETWORK || "signet"}`);
});
