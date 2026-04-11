import { Hono } from "hono";
import { broadcast } from "../index.js";
import { anchorGuardianEvent } from "../services/cogcoin.js";
import type {
  ApiResponse,
  NunchukWebhookPayload,
  NunchukWebhookEventType,
} from "../utils/types.js";

export const webhookRoutes = new Hono();

// ── Nunchuk Portal Webhook Receiver ─────────────────────────────
// Nunchuk sends POST requests here when wallet events happen.
// Configure this URL in the Nunchuk Developer Portal → Webhooks.

webhookRoutes.post("/nunchuk", async (c) => {
  const eventType = c.req.header("Nunchuk-Event-Type") as
    | NunchukWebhookEventType
    | undefined;
  const eventId = c.req.header("Nunchuk-Event-Id");
  const deliveryId = c.req.header("Nunchuk-Delivery-Id");

  let payload: NunchukWebhookPayload;
  try {
    payload = await c.req.json<NunchukWebhookPayload>();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const resolvedType = eventType ?? payload.type;

  console.log(
    `[webhook] Nunchuk event=${resolvedType} id=${eventId ?? payload.id} delivery=${deliveryId ?? "n/a"}`
  );

  // Route event to the appropriate WebSocket broadcast channel
  const wsEvent = mapWebhookToWsEvent(resolvedType);
  if (wsEvent) {
    broadcast(wsEvent, {
      source: "nunchuk",
      eventType: resolvedType,
      eventId: eventId ?? payload.id,
      data: payload.data,
      receivedAt: new Date().toISOString(),
    });
  }

  // Anchor significant events on-chain via Cogcoin (non-blocking)
  if (shouldAnchor(resolvedType)) {
    anchorGuardianEvent("TRANSACTION_APPROVED", {
      source: "nunchuk_webhook",
      nunchukEventType: resolvedType,
      nunchukEventId: eventId ?? payload.id,
      data: payload.data,
    }).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[webhook] Cogcoin anchor skipped: ${msg}`);
    });
  }

  const response: ApiResponse<{ received: true; eventType: string }> = {
    success: true,
    data: { received: true, eventType: resolvedType },
  };
  return c.json(response);
});

// GET endpoint for webhook health / verification
webhookRoutes.get("/nunchuk", (c) => {
  return c.json({
    success: true,
    data: {
      status: "active",
      endpoint: "/api/webhook/nunchuk",
      accepts: "POST",
      source: "Nunchuk Portal Webhooks",
    },
  });
});

// ── Helpers ─────────────────────────────────────────────────────

function mapWebhookToWsEvent(
  eventType: NunchukWebhookEventType | undefined
): "webhook:transaction" | "webhook:policy" | "webhook:wallet" | null {
  if (!eventType) return null;

  if (
    eventType === "wallet.transaction.updated" ||
    eventType === "wallet.transaction.deleted" ||
    eventType === "wallet.dummy_transaction.updated"
  ) {
    return "webhook:transaction";
  }

  if (eventType === "wallet.platform_key.policy_changed") {
    return "webhook:policy";
  }

  if (
    eventType === "wallet.replacement_created" ||
    eventType === "wallet.downgraded" ||
    eventType.startsWith("group.")
  ) {
    return "webhook:wallet";
  }

  return null;
}

function shouldAnchor(eventType: NunchukWebhookEventType | undefined): boolean {
  // Only anchor transaction and policy events on-chain
  return (
    eventType === "wallet.transaction.updated" ||
    eventType === "wallet.platform_key.policy_changed"
  );
}
