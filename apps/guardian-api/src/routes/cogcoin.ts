import { Router, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import {
  anchorGuardianEvent,
  verifyAnchoredEvent,
  getRegisteredIdentity,
} from "../services/cogcoin.js";
import type { CogcoinEventType } from "../types/guardian.js";

const router = Router();

// ─── Request Schemas ────────────────────────────────────────────────────────

const AnchorRequestSchema = z.object({
  eventType: z.enum([
    "POLICY_CHANGE",
    "QUANTUM_SCAN",
    "TRANSACTION_APPROVED",
    "TRANSACTION_DENIED",
    "IDENTITY_REGISTERED",
  ]),
  data: z.record(z.unknown()),
});

// ─── POST /api/cogcoin/anchor ───────────────────────────────────────────────

/**
 * Anchors a guardian event on the Bitcoin blockchain via Cogcoin OP_RETURN.
 * Creates an immutable, verifiable audit trail entry for the specified event.
 *
 * @route POST /api/cogcoin/anchor
 *
 * @body {CogcoinEventType} eventType - Type of guardian event to anchor
 * @body {Record<string, unknown>} data - Event-specific data payload
 *
 * @returns {object} 200 - Anchor result with txId and confirmation status
 * @returns {object} 400 - Validation error
 * @returns {object} 503 - Cogcoin not initialized
 */
router.post("/anchor", async (req: Request, res: Response): Promise<void> => {
  try {
    const identity = getRegisteredIdentity();
    if (!identity) {
      res.status(503).json({
        success: false,
        error: "Cogcoin service not initialized. Identity registration pending.",
      });
      return;
    }

    const parsed = AnchorRequestSchema.parse(req.body);

    const result = await anchorGuardianEvent(
      parsed.eventType as CogcoinEventType,
      parsed.data,
    );

    res.json({
      success: true,
      data: {
        txId: result.txId,
        opReturnHex: result.opReturnHex,
        confirmed: result.confirmed,
        blockHeight: result.blockHeight,
        identity: {
          id: identity.id,
          name: identity.name,
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cogcoin/anchor] Error:", message);

    res.status(500).json({
      success: false,
      error: "Failed to anchor event on Bitcoin",
      details: process.env["NODE_ENV"] === "development" ? message : undefined,
    });
  }
});

// ─── GET /api/cogcoin/verify/:txId ──────────────────────────────────────────

/**
 * Verifies a previously anchored event exists on the Bitcoin blockchain.
 * Returns the event data, block height, and confirmation count.
 *
 * @route GET /api/cogcoin/verify/:txId
 *
 * @param {string} txId - Transaction ID of the anchored event
 *
 * @returns {object} 200 - Verification result
 * @returns {object} 400 - Missing txId
 * @returns {object} 503 - Cogcoin not initialized
 */
router.get("/verify/:txId", async (req: Request, res: Response): Promise<void> => {
  try {
    const identity = getRegisteredIdentity();
    if (!identity) {
      res.status(503).json({
        success: false,
        error: "Cogcoin service not initialized. Identity registration pending.",
      });
      return;
    }

    const txId = req.params["txId"];
    if (!txId || typeof txId !== "string") {
      res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
      return;
    }

    const result = await verifyAnchoredEvent(txId);

    res.json({
      success: true,
      data: {
        verified: result.verified,
        event: result.event,
        blockHeight: result.blockHeight,
        confirmations: result.confirmations,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cogcoin/verify] Error:", message);

    res.status(500).json({
      success: false,
      error: "Failed to verify anchored event",
      details: process.env["NODE_ENV"] === "development" ? message : undefined,
    });
  }
});

// ─── GET /api/cogcoin/identity ──────────────────────────────────────────────

/**
 * Returns the currently registered Cogcoin identity for SatsGuard.
 *
 * @route GET /api/cogcoin/identity
 *
 * @returns {object} 200 - Registered identity details
 * @returns {object} 503 - Cogcoin not initialized
 */
router.get("/identity", (_req: Request, res: Response): void => {
  const identity = getRegisteredIdentity();

  if (!identity) {
    res.status(503).json({
      success: false,
      error: "Cogcoin identity not registered yet.",
    });
    return;
  }

  res.json({
    success: true,
    data: identity,
  });
});

export { router as cogcoinRouter };
