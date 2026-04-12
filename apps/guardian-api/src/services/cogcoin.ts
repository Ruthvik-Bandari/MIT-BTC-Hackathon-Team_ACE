/**
 * Cogcoin integration service for BitShield.
 *
 * Anchors guardian events (policy changes, quantum scan results, transaction
 * approvals/denials) on the Bitcoin blockchain via Cogcoin's OP_RETURN mechanism.
 * This creates a verifiable, immutable audit trail of all AI guardian actions.
 *
 * Uses @cogcoin/client for identity registration and event anchoring.
 *
 * NOTE: The @cogcoin/client package is provided via team access from the
 * Cogcoin sponsor. If the actual API surface differs from what's implemented
 * here, only this adapter layer needs to change — all consumers use our
 * typed interfaces from types/guardian.ts.
 */

import type {
  CogcoinAnchorEvent,
  CogcoinAnchorResult,
  CogcoinEventType,
  CogcoinIdentity,
} from "../types/guardian.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const SATSGUARD_IDENTITY_NAME = "BitShield-Guardian";
const COGCOIN_PREFIX = "BITSHIELD";

// ─── Client State ───────────────────────────────────────────────────────────

let cogcoinClient: CogcoinClientAdapter | null = null;
let registeredIdentity: CogcoinIdentity | null = null;

// ─── Adapter Interface ──────────────────────────────────────────────────────

/**
 * Adapter wrapping @cogcoin/client to isolate external API surface.
 * If the actual Cogcoin SDK differs, only this class needs adjustment.
 */
class CogcoinClientAdapter {
  private apiKey: string;
  private network: "signet" | "testnet";

  constructor(apiKey: string, network: "signet" | "testnet" = "signet") {
    this.apiKey = apiKey;
    this.network = network;
  }

  /**
   * Registers BitShield as a Cogcoin identity on the Bitcoin network.
   * This creates a unique on-chain identity that all anchored events
   * are attributed to.
   *
   * @returns The registered Cogcoin identity with ID and public key
   * @throws Error if registration fails or API key is invalid
   */
  async registerIdentity(): Promise<CogcoinIdentity> {
    // Dynamic import to handle cases where @cogcoin/client isn't installed yet
    const { CogcoinClient } = await import("@cogcoin/client");

    const client = new CogcoinClient({
      apiKey: this.apiKey,
      network: this.network,
    });

    const identity = await client.identity.register({
      name: SATSGUARD_IDENTITY_NAME,
      metadata: {
        application: "BitShield",
        version: "0.1.0",
        description: "AI-powered Bitcoin guardian with quantum defense",
        capabilities: ["policy-enforcement", "quantum-scanning", "transaction-approval"],
      },
    });

    return {
      id: identity.id,
      name: identity.name,
      publicKey: identity.publicKey,
      registeredAt: identity.registeredAt ?? new Date().toISOString(),
      network: this.network,
    };
  }

  /**
   * Anchors an event on the Bitcoin blockchain via OP_RETURN.
   * The event data is serialized, prefixed with SATSGUARD identifier,
   * and embedded in an OP_RETURN output.
   *
   * @param event - The guardian event to anchor
   * @param identityId - The Cogcoin identity ID to sign with
   * @returns Anchor result with transaction ID and confirmation status
   * @throws Error if anchoring fails
   */
  async anchorEvent(
    event: CogcoinAnchorEvent,
    identityId: string,
  ): Promise<CogcoinAnchorResult> {
    const { CogcoinClient } = await import("@cogcoin/client");

    const client = new CogcoinClient({
      apiKey: this.apiKey,
      network: this.network,
    });

    const payload = serializeEventPayload(event);

    const result = await client.anchor.create({
      identityId,
      prefix: COGCOIN_PREFIX,
      data: payload,
      metadata: {
        eventType: event.eventType,
        timestamp: event.timestamp,
        guardianId: event.guardianId,
      },
    });

    return {
      txId: result.txId,
      opReturnHex: result.opReturnHex,
      confirmed: result.confirmed ?? false,
      blockHeight: result.blockHeight ?? null,
    };
  }

  /**
   * Verifies that a previously anchored event exists on-chain and
   * matches the expected data.
   *
   * @param txId - The transaction ID of the anchored event
   * @returns Verification result with event data if found
   * @throws Error if verification fails
   */
  async verifyAnchor(txId: string): Promise<{
    verified: boolean;
    event: CogcoinAnchorEvent | null;
    blockHeight: number | null;
    confirmations: number;
  }> {
    const { CogcoinClient } = await import("@cogcoin/client");

    const client = new CogcoinClient({
      apiKey: this.apiKey,
      network: this.network,
    });

    const result = await client.anchor.verify({
      txId,
      prefix: COGCOIN_PREFIX,
    });

    let event: CogcoinAnchorEvent | null = null;
    if (result.verified && result.data) {
      event = deserializeEventPayload(result.data);
    }

    return {
      verified: result.verified,
      event,
      blockHeight: result.blockHeight ?? null,
      confirmations: result.confirmations ?? 0,
    };
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Initializes the Cogcoin client and registers the BitShield identity.
 * Must be called once at server startup before anchoring events.
 *
 * @returns The registered Cogcoin identity
 * @throws Error if COGCOIN_API_KEY is not set or registration fails
 */
export async function initCogcoin(): Promise<CogcoinIdentity> {
  const apiKey = process.env["COGCOIN_API_KEY"];
  if (!apiKey) {
    throw new Error("COGCOIN_API_KEY environment variable is required");
  }

  const network = (process.env["BITCOIN_NETWORK"] as "signet" | "testnet") ?? "signet";

  cogcoinClient = new CogcoinClientAdapter(apiKey, network);
  registeredIdentity = await cogcoinClient.registerIdentity();

  console.log(
    `[cogcoin] Registered identity: ${registeredIdentity.id} (${registeredIdentity.name}) on ${network}`,
  );

  return registeredIdentity;
}

/**
 * Anchors a guardian event on the Bitcoin blockchain via Cogcoin OP_RETURN.
 * Creates an immutable audit trail entry for the specified event.
 *
 * @param eventType - The type of guardian event to anchor
 * @param data - Event-specific data to include in the anchor
 * @returns Anchor result with transaction ID and confirmation status
 * @throws Error if Cogcoin is not initialized or anchoring fails
 *
 * @example
 * ```ts
 * const result = await anchorGuardianEvent("POLICY_CHANGE", {
 *   previousLimit: 5000,
 *   newLimit: 10000,
 *   changedBy: "user",
 * });
 * console.log(`Anchored in tx: ${result.txId}`);
 * ```
 */
export async function anchorGuardianEvent(
  eventType: CogcoinEventType,
  data: Record<string, unknown>,
): Promise<CogcoinAnchorResult> {
  if (!cogcoinClient || !registeredIdentity) {
    throw new Error("Cogcoin not initialized — call initCogcoin() first");
  }

  const event: CogcoinAnchorEvent = {
    eventType,
    timestamp: new Date().toISOString(),
    data,
    guardianId: registeredIdentity.id,
  };

  const result = await cogcoinClient.anchorEvent(event, registeredIdentity.id);

  console.log(
    `[cogcoin] Anchored ${eventType} event in tx: ${result.txId}`,
  );

  return result;
}

/**
 * Verifies a previously anchored event on the Bitcoin blockchain.
 * Checks that the OP_RETURN data matches and the transaction exists.
 *
 * @param txId - The transaction ID to verify
 * @returns Verification result with event data and confirmation count
 * @throws Error if Cogcoin is not initialized or verification fails
 */
export async function verifyAnchoredEvent(txId: string): Promise<{
  verified: boolean;
  event: CogcoinAnchorEvent | null;
  blockHeight: number | null;
  confirmations: number;
}> {
  if (!cogcoinClient) {
    throw new Error("Cogcoin not initialized — call initCogcoin() first");
  }

  return cogcoinClient.verifyAnchor(txId);
}

/**
 * Returns the currently registered Cogcoin identity, or null if not initialized.
 */
export function getRegisteredIdentity(): CogcoinIdentity | null {
  return registeredIdentity;
}

// ─── Serialization Helpers ──────────────────────────────────────────────────

/**
 * Serializes a guardian event into a compact hex string for OP_RETURN embedding.
 * OP_RETURN has an 80-byte limit, so we use a compact format:
 * [prefix:8][type:2][timestamp:8][hash:32] = 50 bytes
 *
 * @param event - The event to serialize
 * @returns Hex-encoded payload string
 */
function serializeEventPayload(event: CogcoinAnchorEvent): string {
  const compact = {
    t: event.eventType,
    ts: event.timestamp,
    g: event.guardianId,
    d: hashEventData(event.data),
  };

  return Buffer.from(JSON.stringify(compact)).toString("hex");
}

/**
 * Deserializes a hex-encoded event payload back into a CogcoinAnchorEvent.
 *
 * @param hex - The hex-encoded payload from an OP_RETURN
 * @returns The deserialized event, or throws if invalid
 */
function deserializeEventPayload(hex: string): CogcoinAnchorEvent {
  const json = Buffer.from(hex, "hex").toString("utf-8");
  const compact = JSON.parse(json) as {
    t: CogcoinEventType;
    ts: string;
    g: string;
    d: string;
  };

  return {
    eventType: compact.t,
    timestamp: compact.ts,
    guardianId: compact.g,
    data: { hash: compact.d },
  };
}

/**
 * Creates a deterministic hash of event data for compact OP_RETURN storage.
 * Uses SHA-256 truncated to 32 hex chars (16 bytes) to fit OP_RETURN limits.
 *
 * @param data - Arbitrary event data to hash
 * @returns Truncated SHA-256 hex string (32 chars)
 */
function hashEventData(data: Record<string, unknown>): string {
  const sorted = JSON.stringify(data, Object.keys(data).sort());
  const encoder = new TextEncoder();
  const bytes = encoder.encode(sorted);

  // Use Bun's built-in crypto for SHA-256
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(bytes);
  const hex = hasher.digest("hex");

  // Truncate to 32 hex chars (16 bytes) for OP_RETURN compactness
  return hex.slice(0, 32);
}
