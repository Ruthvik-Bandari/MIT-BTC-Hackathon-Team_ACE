import { createHash, randomBytes } from "crypto";

// ── Nostr Event Propagation ────────────────────────────────────
// Broadcasts guardian events over the Nostr network for
// decentralized event propagation. Uses NIP-01 events with
// custom kind for BitShield guardian actions.

const NOSTR_RELAYS = [
  process.env.NOSTR_RELAY_1 ?? "wss://relay.getalby.com",
  process.env.NOSTR_RELAY_2 ?? "wss://relay.damus.io",
  process.env.NOSTR_RELAY_3 ?? "wss://nos.lol",
];

// BitShield custom Nostr event kind (30078 = parameterized replaceable)
const SATSGUARD_EVENT_KIND = 30078;

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NostrPublishResult {
  relays: string[];
  eventId: string;
  publishedAt: string;
  successCount: number;
  failCount: number;
}

/**
 * Generate a deterministic event ID per NIP-01.
 */
function generateEventId(event: Omit<NostrEvent, "id" | "sig">): string {
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
  return createHash("sha256").update(serialized).digest("hex");
}

/**
 * Publish a guardian event to Nostr relays.
 * Events are tagged with the BitShield namespace for discoverability.
 */
export async function publishGuardianEvent(
  eventType: string,
  payload: unknown,
): Promise<NostrPublishResult> {
  // Use a deterministic pubkey derived from server identity
  const serverSeed = process.env.NOSTR_PRIVATE_KEY ?? randomBytes(32).toString("hex");
  const pubkey = createHash("sha256").update(serverSeed).digest("hex");

  const content = JSON.stringify({
    app: "bitshield",
    version: "1.0",
    type: eventType,
    payload,
  });

  const eventTemplate: Omit<NostrEvent, "id" | "sig"> = {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: SATSGUARD_EVENT_KIND,
    tags: [
      ["d", `bitshield:${eventType}`],
      ["t", "bitshield"],
      ["t", "bitcoin-security"],
      ["t", "quantum-defense"],
      ["network", process.env.BITCOIN_NETWORK ?? "signet"],
    ],
    content,
  };

  const eventId = generateEventId(eventTemplate);

  // Simplified signature (in production, sign with secp256k1 private key)
  const sig = createHash("sha256")
    .update(eventId + serverSeed)
    .digest("hex");

  const event: NostrEvent = { ...eventTemplate, id: eventId, sig };

  let successCount = 0;
  let failCount = 0;

  // Publish to all relays concurrently
  const results = await Promise.allSettled(
    NOSTR_RELAYS.map(async (relay) => {
      try {
        const ws = new WebSocket(relay);

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("Connection timeout"));
          }, 5000);

          ws.addEventListener("open", () => {
            ws.send(JSON.stringify(["EVENT", event]));
            clearTimeout(timeout);

            // Wait for OK response
            ws.addEventListener("message", (_msg) => {
              ws.close();
              resolve();
            });

            // Auto-close after 3s if no response
            setTimeout(() => {
              ws.close();
              resolve();
            }, 3000);
          });

          ws.addEventListener("error", () => {
            clearTimeout(timeout);
            reject(new Error(`Failed to connect to ${relay}`));
          });
        });

        return relay;
      } catch {
        throw new Error(`Failed: ${relay}`);
      }
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") successCount++;
    else failCount++;
  }

  return {
    relays: NOSTR_RELAYS,
    eventId,
    publishedAt: new Date().toISOString(),
    successCount,
    failCount,
  };
}

/**
 * Publish a quantum scan result to Nostr.
 */
export async function publishScanEvent(
  address: string,
  riskLevel: string,
  assessment: unknown,
): Promise<NostrPublishResult> {
  return publishGuardianEvent("quantum_scan", {
    address,
    riskLevel,
    assessment,
    scannedAt: new Date().toISOString(),
  });
}

/**
 * Publish a guardian action audit event to Nostr.
 */
export async function publishAuditEvent(
  action: string,
  details: unknown,
): Promise<NostrPublishResult> {
  return publishGuardianEvent("audit_trail", {
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}
