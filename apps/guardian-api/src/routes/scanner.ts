import { Router, type Request, type Response, type NextFunction } from "express";
import type { Router as RouterType } from "express";
import { ZodError } from "zod";
import {
  analyzeRequestSchema,
  addressParamsSchema,
  addressQuerySchema,
  watchRequestSchema,
  yearParamsSchema,
} from "../schemas/scanner.schema.js";
import {
  assessQuantumRisk,
  analyzeWallet,
  getNetworkQuantumStats,
  detectAddressType,
  isPublicKeyExposed,
} from "../services/quantum.js";
import { getFullAddressInfo } from "../services/mempool.js";
import { getQuantumTimeline, getThreatLevelForYear, yearsUntilCritical } from "../services/timeline.js";
import { buildMigrationPlan } from "../services/migration.js";
import { assessBip360Compatibility } from "../services/bip360.js";
import {
  watchAddress,
  unwatchAddress,
  getWatchedAddresses,
} from "../services/monitor.js";
import type { EnhancedQuantumAssessment } from "../types/quantum.js";

export const scannerRouter: RouterType = Router();

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function handleError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
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

// ---------------------------------------------------------------------------
// Core Scanner Endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/scanner/analyze
 * Batch-scan wallet addresses for quantum vulnerability.
 */
scannerRouter.post(
  "/analyze",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = analyzeRequestSchema.parse(req.body);
      const result = analyzeWallet(parsed.addresses);
      res.json({ success: true, data: result });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

/**
 * GET /api/scanner/address/:addr
 * Scan a single address. Pass ?spent=true|false for manual mode.
 */
scannerRouter.get(
  "/address/:addr",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = addressParamsSchema.parse(req.params);
      const query = addressQuerySchema.parse(req.query);
      const assessment = assessQuantumRisk(params.addr, query.spent);
      res.json({ success: true, data: { assessment } });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

/**
 * GET /api/scanner/address/:addr/auto
 * Auto-scan: queries mempool.space to detect spent status automatically.
 * No need to pass ?spent — it's detected from on-chain data.
 */
scannerRouter.get(
  "/address/:addr/auto",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = addressParamsSchema.parse(req.params);
      const address = params.addr;

      const [addressType, onChainInfo] = await Promise.all([
        Promise.resolve(detectAddressType(address)),
        getFullAddressInfo(address),
      ]);

      const publicKeyExposed = isPublicKeyExposed(addressType, onChainInfo.hasBeenSpentFrom);
      const baseAssessment = assessQuantumRisk(address, onChainInfo.hasBeenSpentFrom);

      const enhanced: EnhancedQuantumAssessment = {
        ...baseAssessment,
        balanceSats: onChainInfo.balanceSats,
        totalReceived: onChainInfo.totalReceived,
        totalSent: onChainInfo.totalSent,
        txCount: onChainInfo.txCount,
        utxoCount: onChainInfo.utxoCount,
        autoDetected: true,
      };

      // Include BIP-360 assessment and migration plan
      const bip360 = assessBip360Compatibility(
        address,
        addressType,
        baseAssessment.riskLevel,
        publicKeyExposed
      );
      const migration = buildMigrationPlan(
        address,
        baseAssessment.riskLevel,
        addressType,
        onChainInfo.balanceSats
      );
      const timeline = yearsUntilCritical(publicKeyExposed);

      res.json({
        success: true,
        data: {
          assessment: enhanced,
          bip360,
          migration,
          quantumCountdown: timeline,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unable to decode")) {
        handleError(error, res, next);
        return;
      }

      // Mempool API failure — fall back to manual mode
      try {
        const params = addressParamsSchema.parse(req.params);
        const assessment = assessQuantumRisk(params.addr, false);
        res.json({
          success: true,
          data: {
            assessment,
            autoDetected: false,
            warning: "Mempool API unavailable. Using default spent=false. Results may be incomplete.",
          },
        });
      } catch (fallbackError) {
        handleError(fallbackError, res, next);
      }
    }
  }
);

/**
 * GET /api/scanner/network-stats
 * Network-wide quantum threat statistics from Google whitepaper.
 */
scannerRouter.get(
  "/network-stats",
  (_req: Request, res: Response) => {
    const stats = getNetworkQuantumStats();
    res.json({ success: true, data: stats });
  }
);

// ---------------------------------------------------------------------------
// Quantum Timeline Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/scanner/timeline
 * Full quantum threat timeline projection (2024-2035).
 */
scannerRouter.get(
  "/timeline",
  (_req: Request, res: Response) => {
    const timeline = getQuantumTimeline();
    res.json({ success: true, data: timeline });
  }
);

/**
 * GET /api/scanner/timeline/year/:year
 * Threat level for a specific year.
 */
scannerRouter.get(
  "/timeline/year/:year",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = yearParamsSchema.parse(req.params);
      const point = getThreatLevelForYear(params.year);

      if (!point) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `No projection data for year ${params.year}`,
          },
        });
        return;
      }

      res.json({ success: true, data: point });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

// ---------------------------------------------------------------------------
// Migration Plan Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/scanner/address/:addr/migrate
 * Get a migration plan for a quantum-vulnerable address.
 * Auto-detects on-chain data for balance and fee estimation.
 */
scannerRouter.get(
  "/address/:addr/migrate",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = addressParamsSchema.parse(req.params);
      const address = params.addr;
      const addressType = detectAddressType(address);

      let balanceSats: number | null = null;
      let hasSpent = false;

      try {
        const info = await getFullAddressInfo(address);
        balanceSats = info.balanceSats;
        hasSpent = info.hasBeenSpentFrom;
      } catch {
        // Mempool unavailable — proceed without balance data
      }

      const assessment = assessQuantumRisk(address, hasSpent);
      const migration = buildMigrationPlan(
        address,
        assessment.riskLevel,
        addressType,
        balanceSats
      );

      res.json({ success: true, data: migration });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

// ---------------------------------------------------------------------------
// BIP-360 Compatibility Endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/scanner/address/:addr/bip360
 * Check BIP-360 post-quantum compatibility for an address.
 */
scannerRouter.get(
  "/address/:addr/bip360",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = addressParamsSchema.parse(req.params);
      const address = params.addr;
      const addressType = detectAddressType(address);

      let hasSpent = false;
      try {
        const info = await getFullAddressInfo(address);
        hasSpent = info.hasBeenSpentFrom;
      } catch {
        // Mempool unavailable — assume unspent (conservative)
      }

      const publicKeyExposed = isPublicKeyExposed(addressType, hasSpent);
      const assessment = assessQuantumRisk(address, hasSpent);
      const bip360 = assessBip360Compatibility(
        address,
        addressType,
        assessment.riskLevel,
        publicKeyExposed
      );

      res.json({ success: true, data: bip360 });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

// ---------------------------------------------------------------------------
// UTXO Monitor Endpoints
// ---------------------------------------------------------------------------

/**
 * POST /api/scanner/monitor/watch
 * Add an address to the real-time monitoring watch list.
 */
scannerRouter.post(
  "/monitor/watch",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = watchRequestSchema.parse(req.body);
      const watched = watchAddress(parsed.address);
      res.json({ success: true, data: watched });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

/**
 * DELETE /api/scanner/monitor/watch/:addr
 * Remove an address from the watch list.
 */
scannerRouter.delete(
  "/monitor/watch/:addr",
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = addressParamsSchema.parse(req.params);
      const removed = unwatchAddress(params.addr);
      res.json({
        success: true,
        data: { removed, address: params.addr },
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);

/**
 * GET /api/scanner/monitor/watched
 * List all currently watched addresses.
 */
scannerRouter.get(
  "/monitor/watched",
  (_req: Request, res: Response) => {
    const watched = getWatchedAddresses();
    res.json({
      success: true,
      data: {
        count: watched.length,
        addresses: watched,
      },
    });
  }
);

// ---------------------------------------------------------------------------
// Full Comprehensive Scan (Demo-ready endpoint)
// ---------------------------------------------------------------------------

/**
 * GET /api/scanner/address/:addr/full
 * The ultimate endpoint: auto-detects everything and returns
 * assessment + timeline + migration plan + BIP-360 compatibility.
 * One address in, complete quantum security posture out.
 */
scannerRouter.get(
  "/address/:addr/full",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = addressParamsSchema.parse(req.params);
      const address = params.addr;
      const addressType = detectAddressType(address);

      let balanceSats: number | null = null;
      let hasSpent = false;
      let onChainData: {
        totalReceived: number;
        totalSent: number;
        txCount: number;
        utxoCount: number;
      } | null = null;

      try {
        const info = await getFullAddressInfo(address);
        balanceSats = info.balanceSats;
        hasSpent = info.hasBeenSpentFrom;
        onChainData = {
          totalReceived: info.totalReceived,
          totalSent: info.totalSent,
          txCount: info.txCount,
          utxoCount: info.utxoCount,
        };
      } catch {
        // Mempool unavailable
      }

      const publicKeyExposed = isPublicKeyExposed(addressType, hasSpent);
      const assessment = assessQuantumRisk(address, hasSpent);
      const bip360 = assessBip360Compatibility(address, addressType, assessment.riskLevel, publicKeyExposed);
      const migration = buildMigrationPlan(address, assessment.riskLevel, addressType, balanceSats);
      const countdown = yearsUntilCritical(publicKeyExposed);
      const timeline = getQuantumTimeline();

      res.json({
        success: true,
        data: {
          assessment: onChainData
            ? { ...assessment, ...onChainData, balanceSats, autoDetected: true as const }
            : { ...assessment, balanceSats, autoDetected: false as const },
          bip360,
          migration,
          quantumCountdown: countdown,
          timeline: {
            currentYear: timeline.currentYear,
            ecdsaBreakYear: timeline.ecdsaBreakYear,
            timeUntilThreat: timeline.timeUntilThreat,
          },
          networkStats: getNetworkQuantumStats(),
        },
      });
    } catch (error) {
      handleError(error, res, next);
    }
  }
);
