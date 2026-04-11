import { Hono } from "hono";
import { getResilienceStatus } from "../services/resilience.js";
import { pinScanReport, pinAuditEvent, verifyPin } from "../services/ipfs.js";
import { publishScanEvent, publishAuditEvent } from "../services/nostr.js";

export const resilienceRoutes = new Hono();

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
resilienceRoutes.post("/pin", async (c) => {
  const body = await c.req.json() as { type: string; data: unknown };

  let result;
  if (body.type === "scan_report") {
    result = await pinScanReport({
      address: (body.data as Record<string, string>).address ?? "unknown",
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
resilienceRoutes.post("/verify", async (c) => {
  const body = await c.req.json() as { cid: string; expectedHash: string };
  const verified = await verifyPin(body.cid, body.expectedHash);
  return c.json({ success: true, data: { verified, cid: body.cid } });
});

/**
 * POST /api/resilience/broadcast
 * Broadcast a guardian event to Nostr relays.
 */
resilienceRoutes.post("/broadcast", async (c) => {
  const body = await c.req.json() as { type: string; data: unknown };

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
