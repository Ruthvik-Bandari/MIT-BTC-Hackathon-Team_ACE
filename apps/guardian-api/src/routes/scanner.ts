import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  scanAddress,
  scanWallet,
  getNetworkStats,
  ScanWalletSchema,
} from "../services/scanner.js";
import { hasBeenSpentFrom } from "../services/mempool.js";
import type {
  ApiResponse,
  QuantumRiskAssessment,
  WalletScanResult,
  NetworkStats,
} from "../utils/types.js";
import { broadcast } from "../utils/broadcast.js";

export const scannerRoutes = new Hono();

// POST /api/scanner/analyze — batch scan wallet addresses
scannerRoutes.post(
  "/analyze",
  zValidator("json", ScanWalletSchema),
  async (c) => {
    const { addresses } = c.req.valid("json");
    const result = scanWallet(addresses);
    broadcast("scanner:complete", result);

    const response: ApiResponse<WalletScanResult> = {
      success: true,
      data: result,
    };
    return c.json(response);
  }
);

// GET /api/scanner/address/:addr — single address scan
// Auto-detects spent status from mempool.space if not explicitly provided
scannerRoutes.get("/address/:addr", async (c) => {
  const addr = c.req.param("addr");

  // Validate address format to prevent URL injection
  if (!/^[a-zA-Z0-9]{20,90}$/.test(addr)) {
    return c.json({ success: false, error: "Invalid Bitcoin address format" }, 400);
  }

  const spentParam = c.req.query("spent");

  let spent: boolean;
  if (spentParam !== undefined) {
    spent = spentParam === "true";
  } else {
    // Auto-detect from blockchain
    try {
      spent = await hasBeenSpentFrom(addr);
    } catch {
      // Mempool API may fail for invalid/unknown addresses — default to false
      spent = false;
    }
  }

  const assessment = scanAddress(addr, spent);

  const response: ApiResponse<{ assessment: QuantumRiskAssessment }> = {
    success: true,
    data: { assessment },
  };
  return c.json(response);
});

// GET /api/scanner/network-stats — network-wide quantum vulnerability stats
scannerRoutes.get("/network-stats", (c) => {
  const stats = getNetworkStats();

  const response: ApiResponse<NetworkStats> = {
    success: true,
    data: stats,
  };
  return c.json(response);
});
