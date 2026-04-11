import { Router, type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import {
  analyzeRequestSchema,
  addressParamsSchema,
  addressQuerySchema,
} from "../schemas/scanner.schema.js";
import {
  assessQuantumRisk,
  analyzeWallet,
  getNetworkQuantumStats,
} from "../services/quantum.js";

export const scannerRouter = Router();

/**
 * POST /api/scanner/analyze
 *
 * Batch-scan a list of wallet addresses for quantum vulnerability.
 * Validates request body with Zod before processing.
 *
 * Request body:
 * {
 *   "addresses": [
 *     { "address": "tb1q...", "hasBeenSpentFrom": true },
 *     { "address": "tb1p...", "hasBeenSpentFrom": false }
 *   ]
 * }
 */
scannerRouter.post(
  "/analyze",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = analyzeRequestSchema.parse(req.body);
      const result = analyzeWallet(parsed.addresses);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
        });
        return;
      }

      if (error instanceof Error) {
        res.status(422).json({
          success: false,
          error: {
            code: "SCAN_ERROR",
            message: error.message,
          },
        });
        return;
      }

      next(error);
    }
  }
);

/**
 * GET /api/scanner/address/:addr
 *
 * Scan a single address for quantum vulnerability.
 * Query param `spent=true|false` indicates spending history.
 *
 * Example: GET /api/scanner/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx?spent=true
 */
scannerRouter.get(
  "/address/:addr",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = addressParamsSchema.parse(req.params);
      const query = addressQuerySchema.parse(req.query);

      const assessment = assessQuantumRisk(params.addr, query.spent);

      res.json({
        success: true,
        data: { assessment },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
            details: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
        });
        return;
      }

      if (error instanceof Error) {
        res.status(422).json({
          success: false,
          error: {
            code: "SCAN_ERROR",
            message: error.message,
          },
        });
        return;
      }

      next(error);
    }
  }
);

/**
 * GET /api/scanner/network-stats
 *
 * Returns network-wide quantum threat statistics.
 * All data hardcoded from Google Quantum AI whitepaper (March 30, 2026).
 */
scannerRouter.get(
  "/network-stats",
  (_req: Request, res: Response) => {
    const stats = getNetworkQuantumStats();

    res.json({
      success: true,
      data: stats,
    });
  }
);
