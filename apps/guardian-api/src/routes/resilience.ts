import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getResilienceStatus } from "../services/resilience.js";
import { pinScanReport, pinAuditEvent, verifyPin } from "../services/ipfs.js";
import { publishScanEvent, publishAuditEvent } from "../services/nostr.js";

export const resilienceRoutes = new Hono();

const PinSchema = z.object({
  type: z.string().min(1).max(64),
  data: z.record(z.unknown()),
});

const VerifySchema = z.object({
  cid: z.string().min(1).max(128).regex(/^[a-zA-Z0-9]+$/),
  expectedHash: z.string().min(1).max(128).regex(/^[a-f0-9]+$/),
});

const BroadcastSchema = z.object({
  type: z.string().min(1).max(64),
  data: z.record(z.unknown()),
});

/**
 * GET /api/resilience/status
 * Multi-provider health check with IPFS and Nostr status.
 */
resilienceRoutes.get("/status", async (c) => {
  const status = await getResilienceStatus();
  return c.json({ success: true, data: status });
});

/**
 * POST /api/resilience/pin
 * Pin data to IPFS for decentralized storage.
 */
resilienceRoutes.post("/pin", zValidator("json", PinSchema), async (c) => {
  const body = c.req.valid("json");

  let result;
  if (body.type === "scan_report") {
    const data = body.data as Record<string, string>;
    result = await pinScanReport({
      address: data.address ?? "unknown",
      assessment: body.data,
      scannedAt: new Date().toISOString(),
    });
  } else {
    result = await pinAuditEvent({
      action: body.type,
      details: body.data,
      timestamp: new Date().toISOString(),
    });
  }

  return c.json({ success: true, data: result });
});

/**
 * POST /api/resilience/verify
 * Verify integrity of IPFS-pinned content.
 */
resilienceRoutes.post("/verify", zValidator("json", VerifySchema), async (c) => {
  const body = c.req.valid("json");
  const verified = await verifyPin(body.cid, body.expectedHash);
  return c.json({ success: true, data: { verified, cid: body.cid } });
});

/**
 * POST /api/resilience/broadcast
 * Broadcast a guardian event to Nostr relays.
 */
resilienceRoutes.post("/broadcast", zValidator("json", BroadcastSchema), async (c) => {
  const body = c.req.valid("json");

  let result;
  if (body.type === "scan") {
    const data = body.data as Record<string, string>;
    result = await publishScanEvent(
      data.address ?? "unknown",
      data.riskLevel ?? "UNKNOWN",
      body.data,
    );
  } else {
    result = await publishAuditEvent(body.type, body.data);
  }

  return c.json({ success: true, data: result });
});
