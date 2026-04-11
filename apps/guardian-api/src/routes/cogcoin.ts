import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  anchorGuardianEvent,
  verifyAnchoredEvent,
  getRegisteredIdentity,
} from "../services/cogcoin.js";
import type { CogcoinEventType } from "../types/guardian.js";

export const cogcoinRoutes = new Hono();

// ─── Request Schemas ────────────────────────────────────────────

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

// ─── POST /api/cogcoin/anchor ───────────────────────────────────

/**
 * Anchors a guardian event on the Bitcoin blockchain via Cogcoin OP_RETURN.
 */
cogcoinRoutes.post(
  "/anchor",
  zValidator("json", AnchorRequestSchema),
  async (c) => {
    const identity = getRegisteredIdentity();
    if (!identity) {
      return c.json(
        { success: false, error: "Cogcoin service not initialized." } as const,
        503,
      );
    }

    const { eventType, data } = c.req.valid("json");

    const result = await anchorGuardianEvent(
      eventType as CogcoinEventType,
      data,
    );

    return c.json({
      success: true,
      data: {
        txId: result.txId,
        opReturnHex: result.opReturnHex,
        confirmed: result.confirmed,
        blockHeight: result.blockHeight,
        identity: { id: identity.id, name: identity.name },
      },
    });
  },
);

// ─── GET /api/cogcoin/verify/:txId ──────────────────────────────

/**
 * Verifies a previously anchored event on the Bitcoin blockchain.
 */
cogcoinRoutes.get("/verify/:txId", async (c) => {
  const identity = getRegisteredIdentity();
  if (!identity) {
    return c.json(
      { success: false, error: "Cogcoin service not initialized." } as const,
      503,
    );
  }

  const txId = c.req.param("txId");

  const result = await verifyAnchoredEvent(txId);

  return c.json({
    success: true,
    data: {
      verified: result.verified,
      event: result.event,
      blockHeight: result.blockHeight,
      confirmations: result.confirmations,
    },
  });
});

// ─── GET /api/cogcoin/identity ──────────────────────────────────

/**
 * Returns the registered Cogcoin identity for SatsGuard.
 */
cogcoinRoutes.get("/identity", (c) => {
  const identity = getRegisteredIdentity();

  if (!identity) {
    return c.json(
      { success: false, error: "Cogcoin identity not registered yet." } as const,
      503,
    );
  }

  return c.json({ success: true, data: identity });
});
