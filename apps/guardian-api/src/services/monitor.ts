/**
 * Real-time UTXO Monitor
 *
 * Watches Bitcoin addresses and alerts via WebSocket when:
 * - A previously-safe address gets spent from (public key now exposed)
 * - New transactions are detected on watched addresses
 * - Risk level changes due to on-chain activity
 *
 * Uses mempool.space polling. Broadcasts alerts via Bun native WebSocket
 * through the broadcast() function exported from index.ts.
 */

import type { WatchedAddress } from "../types/quantum.js";
import { getAddressStats } from "./mempool.js";
import { assessQuantumRisk } from "./quantum.js";
import { broadcast } from "../index.js";

const watchedAddresses = new Map<string, WatchedAddress>();
let pollInterval: ReturnType<typeof setInterval> | null = null;

const POLL_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Initialize the monitor and start polling.
 */
export function initMonitor(): void {
  startPolling();
}

/**
 * Add an address to the watch list.
 */
export function watchAddress(address: string): WatchedAddress {
  if (watchedAddresses.has(address)) {
    return watchedAddresses.get(address)!;
  }

  const assessment = assessQuantumRisk(address, false);

  const watched: WatchedAddress = {
    address,
    lastChecked: new Date().toISOString(),
    lastTxCount: 0,
    riskLevel: assessment.riskLevel,
    publicKeyExposed: assessment.publicKeyExposed,
  };

  watchedAddresses.set(address, watched);
  return watched;
}

/**
 * Remove an address from the watch list.
 */
export function unwatchAddress(address: string): boolean {
  return watchedAddresses.delete(address);
}

/**
 * Get all currently watched addresses.
 */
export function getWatchedAddresses(): WatchedAddress[] {
  return Array.from(watchedAddresses.values());
}

/**
 * Poll all watched addresses for changes.
 */
async function pollAddresses(): Promise<void> {
  for (const [address, watched] of watchedAddresses) {
    try {
      const stats = await getAddressStats(address);
      const currentTxCount =
        stats.chain_stats.tx_count + stats.mempool_stats.tx_count;
      const hasSpent = stats.chain_stats.spent_txo_count > 0;

      // Detect new transactions
      if (currentTxCount > watched.lastTxCount && watched.lastTxCount > 0) {
        broadcast("scanner:complete", {
          type: "scanner:tx_detected",
          address,
          newTxCount: currentTxCount - watched.lastTxCount,
          totalTxCount: currentTxCount,
          timestamp: new Date().toISOString(),
        });
      }

      // Detect risk level change (key exposure)
      if (hasSpent && !watched.publicKeyExposed) {
        const newAssessment = assessQuantumRisk(address, true);

        broadcast("scanner:complete", {
          type: "scanner:risk_changed",
          address,
          previousRisk: watched.riskLevel,
          newRisk: newAssessment.riskLevel,
          publicKeyExposed: true,
          message: `PUBLIC KEY EXPOSED! Address ${address} was spent from. Risk elevated from ${watched.riskLevel} to ${newAssessment.riskLevel}.`,
          recommendation: newAssessment.recommendation,
          timestamp: new Date().toISOString(),
        });

        watched.riskLevel = newAssessment.riskLevel;
        watched.publicKeyExposed = true;
      }

      watched.lastTxCount = currentTxCount;
      watched.lastChecked = new Date().toISOString();
    } catch {
      // Mempool API failure — skip this cycle, try again next poll
    }
  }
}

/**
 * Start the polling loop.
 */
function startPolling(): void {
  if (pollInterval) return;

  pollInterval = setInterval(() => {
    if (watchedAddresses.size > 0) {
      pollAddresses();
    }
  }, POLL_INTERVAL_MS);
}

/**
 * Stop monitoring (for cleanup).
 */
export function stopMonitor(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  watchedAddresses.clear();
}
