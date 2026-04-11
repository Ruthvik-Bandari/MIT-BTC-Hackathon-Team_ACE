/**
 * Real-time UTXO Monitor
 *
 * Watches Bitcoin addresses and alerts via WebSocket when:
 * - A previously-safe address gets spent from (public key now exposed)
 * - New transactions are detected on watched addresses
 * - Risk level changes due to on-chain activity
 *
 * Uses mempool.space polling. Broadcasts alerts via the broadcast() helper
 * from index.ts (Bun native WebSocket).
 */

import type { WatchedAddress } from "../types/quantum.js";
import { getAddressStats } from "./mempool.js";
import { assessQuantumRisk } from "./quantum.js";

const watchedAddresses = new Map<string, WatchedAddress>();
let broadcastFn: ((type: string, payload: unknown) => void) | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

const POLL_INTERVAL_MS = 30_000;

export function initMonitor(
  broadcastCallback: (type: string, payload: unknown) => void
): void {
  broadcastFn = broadcastCallback;
  startPolling();
}

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

export function unwatchAddress(address: string): boolean {
  return watchedAddresses.delete(address);
}

export function getWatchedAddresses(): WatchedAddress[] {
  return Array.from(watchedAddresses.values());
}

function emitEvent(
  type: string,
  address: string,
  data: Record<string, unknown>
): void {
  if (!broadcastFn) return;
  broadcastFn(type, { address, ...data });
}

async function pollAddresses(): Promise<void> {
  for (const [address, watched] of watchedAddresses) {
    try {
      const stats = await getAddressStats(address);
      const currentTxCount =
        stats.chain_stats.tx_count + stats.mempool_stats.tx_count;
      const hasSpent = stats.chain_stats.spent_txo_count > 0;

      if (currentTxCount > watched.lastTxCount && watched.lastTxCount > 0) {
        emitEvent("scanner:tx_detected", address, {
          newTxCount: currentTxCount - watched.lastTxCount,
          totalTxCount: currentTxCount,
          timestamp: new Date().toISOString(),
        });
      }

      if (hasSpent && !watched.publicKeyExposed) {
        const newAssessment = assessQuantumRisk(address, true);

        emitEvent("scanner:risk_changed", address, {
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
      // Mempool API failure — skip this cycle
    }
  }
}

function startPolling(): void {
  if (pollInterval) return;

  pollInterval = setInterval(() => {
    if (watchedAddresses.size > 0) {
      void pollAddresses();
    }
  }, POLL_INTERVAL_MS);
}

export function stopMonitor(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  watchedAddresses.clear();
}
