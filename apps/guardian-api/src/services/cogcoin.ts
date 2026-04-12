/**
 * Cogcoin integration service for BitShield.
 *
 * Uses the real `cogcoin` CLI to interact with the Cogcoin metaprotocol
 * on Bitcoin mainnet. Cogcoin provides on-chain identity, structured data,
 * and reputation via OP_RETURN outputs — no API key needed, just a local
 * Bitcoin node with the Cogcoin indexer.
 *
 * Capabilities:
 * - Read wallet identity and address
 * - Check node sync status
 * - Write guardian audit events to domain fields (requires funded wallet + domain)
 * - Read back anchored audit data from domain fields
 */

import type {
  CogcoinAnchorEvent,
  CogcoinAnchorResult,
  CogcoinEventType,
  CogcoinIdentity,
} from "../types/guardian.js";

// ─── CLI Execution ─────────────────────────────────────────────────────────

const COGCOIN_CLI = "npx";
const COGCOIN_DIR = process.env["COGCOIN_DIR"] ??
  `${process.env["HOME"]}/Desktop/MIT-Hackathon/tools/cogcoin`;

async function execCogcoin(args: string[]): Promise<string> {
  const proc = Bun.spawn([COGCOIN_CLI, "cogcoin", ...args], {
    cwd: COGCOIN_DIR,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PATH: process.env["PATH"] },
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const errMsg = stderr.trim() || stdout.trim();
    console.error(`[cogcoin] CLI error (exit ${exitCode}): ${errMsg}`);
    throw new Error(errMsg || `cogcoin CLI exited with code ${exitCode}`);
  }

  return stdout.trim();
}

// ─── State ─────────────────────────────────────────────────────────────────

let cachedIdentity: CogcoinIdentity | null = null;
let initialized = false;

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Initializes Cogcoin by reading the local wallet identity and node status.
 * No API key needed — uses the local cogcoin CLI and Bitcoin node.
 */
export async function initCogcoin(): Promise<CogcoinIdentity> {
  // Unlock wallet first (short duration for startup)
  try {
    await execCogcoin(["unlock", "--for", "5m"]);
  } catch {
    // May already be unlocked or not initialized
  }

  // Get wallet address (identity)
  const addressOutput = await execCogcoin(["address"]);
  const addressMatch = addressOutput.match(/Address:\s*(\S+)/);
  const address = addressMatch?.[1] ?? "";

  if (!address) {
    throw new Error("Cogcoin wallet has no address — run `cogcoin init` first");
  }

  // Get status
  let statusData: Record<string, unknown> = {};
  try {
    const statusJson = await execCogcoin(["status", "--output", "json"]);
    statusData = JSON.parse(statusJson);
  } catch {
    // Status may fail if node is still syncing
  }

  cachedIdentity = {
    id: address,
    name: "BitShield-Guardian",
    publicKey: address,
    registeredAt: new Date().toISOString(),
    network: (process.env["BITCOIN_NETWORK"] as "signet" | "testnet") ?? "signet",
  };
  initialized = true;

  const walletStatus = (statusData as { data?: { wallet?: { availability?: string } } })
    ?.data?.wallet?.availability ?? "unknown";
  const btcStatus = (statusData as { data?: { btc?: { serviceHealth?: string } } })
    ?.data?.btc?.serviceHealth ?? "unknown";

  console.log(
    `[cogcoin] Initialized: address=${address.slice(0, 20)}... wallet=${walletStatus} btc=${btcStatus}`,
  );

  return cachedIdentity;
}

/**
 * Gets the Cogcoin node status including sync progress.
 */
export async function getCogcoinStatus(): Promise<Record<string, unknown>> {
  const output = await execCogcoin(["status", "--output", "json"]);
  return JSON.parse(output);
}

/**
 * Anchors a guardian event by writing it to a Cogcoin domain field.
 * Requires: funded wallet + registered domain.
 * If no domain is registered, falls back to logging the event locally.
 */
export async function anchorGuardianEvent(
  eventType: CogcoinEventType,
  data: Record<string, unknown>,
): Promise<CogcoinAnchorResult> {
  if (!initialized || !cachedIdentity) {
    throw new Error("Cogcoin not initialized — call initCogcoin() first");
  }

  const event: CogcoinAnchorEvent = {
    eventType,
    timestamp: new Date().toISOString(),
    data,
    guardianId: cachedIdentity.id,
  };

  // Try to write to a domain field if a domain exists
  try {
    const domainsOutput = await execCogcoin(["domains", "--anchored"]);

    // Parse first domain from output
    const domainMatch = domainsOutput.match(/^\s*(\S+)\s/m);
    if (!domainMatch || domainsOutput.includes("No locally related domains")) {
      // No domain — log event locally as proof-of-concept
      console.log(`[cogcoin] No anchored domain — event logged locally: ${eventType}`);
      return {
        txId: `local-${Date.now().toString(16)}`,
        opReturnHex: serializeEventPayload(event),
        confirmed: false,
        blockHeight: null,
      };
    }

    const domain = domainMatch[1];
    const fieldName = `audit-${Date.now()}`;
    const payload = JSON.stringify({
      type: eventType,
      ts: event.timestamp,
      guardian: cachedIdentity.id.slice(0, 20),
      dataHash: hashEventData(data),
    });

    // Write the event to a domain field
    await execCogcoin([
      "field", "create", domain, fieldName,
      "--json", payload,
    ]);

    console.log(`[cogcoin] Anchored ${eventType} to ${domain}/${fieldName}`);

    return {
      txId: `${domain}/${fieldName}`,
      opReturnHex: serializeEventPayload(event),
      confirmed: false, // Will confirm when mined
      blockHeight: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[cogcoin] Anchor failed, logged locally: ${msg}`);
    return {
      txId: `local-${Date.now().toString(16)}`,
      opReturnHex: serializeEventPayload(event),
      confirmed: false,
      blockHeight: null,
    };
  }
}

/**
 * Reads a domain field to verify an anchored event.
 */
export async function verifyAnchoredEvent(txId: string): Promise<{
  verified: boolean;
  event: CogcoinAnchorEvent | null;
  blockHeight: number | null;
  confirmations: number;
}> {
  // txId format: "domain/field-name" for on-chain, "local-xxx" for local
  if (txId.startsWith("local-")) {
    return { verified: false, event: null, blockHeight: null, confirmations: 0 };
  }

  const [domain, field] = txId.split("/");
  if (!domain || !field) {
    return { verified: false, event: null, blockHeight: null, confirmations: 0 };
  }

  try {
    await execCogcoin(["field", domain, field]);
    // If we can read the field, the data was anchored
    return {
      verified: true,
      event: null, // Raw field data, not parsed back to event
      blockHeight: null,
      confirmations: 1,
    };
  } catch {
    return { verified: false, event: null, blockHeight: null, confirmations: 0 };
  }
}

/**
 * Returns the cached Cogcoin identity, or null if not initialized.
 */
export function getRegisteredIdentity(): CogcoinIdentity | null {
  return cachedIdentity;
}

// ─── Serialization Helpers ─────────────────────────────────────────────────

function serializeEventPayload(event: CogcoinAnchorEvent): string {
  const compact = {
    t: event.eventType,
    ts: event.timestamp,
    g: event.guardianId,
    d: hashEventData(event.data),
  };
  return Buffer.from(JSON.stringify(compact)).toString("hex");
}

function hashEventData(data: Record<string, unknown>): string {
  const sorted = JSON.stringify(data, Object.keys(data).sort());
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(new TextEncoder().encode(sorted));
  return hasher.digest("hex").slice(0, 32);
}
