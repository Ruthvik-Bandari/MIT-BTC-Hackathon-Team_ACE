import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  scanAddress,
  scanWallet,
  getNetworkStats,
  ScanWalletSchema,
} from "../services/scanner.js";
import type {
  ApiResponse,
  QuantumRiskAssessment,
  WalletScanResult,
  NetworkStats,
} from "../utils/types.js";
import { broadcast } from "../index.js";

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
scannerRoutes.get("/address/:addr", (c) => {
  const addr = c.req.param("addr");
  const spent = c.req.query("spent") === "true";
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
