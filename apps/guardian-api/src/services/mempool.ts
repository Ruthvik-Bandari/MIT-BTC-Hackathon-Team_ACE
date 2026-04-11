/**
 * Mempool.space API Integration
 *
 * Auto-detects whether a Bitcoin address has been spent from by querying
 * the mempool.space signet API. Uses native fetch (backend doesn't need xior).
 *
 * API: https://mempool.space/signet/api/
 * No authentication required (public API).
 */

import type {
  MempoolAddressStats,
  MempoolUtxo,
} from "../types/quantum.js";

const MEMPOOL_BASE =
  process.env["MEMPOOL_API_URL"] ?? "https://mempool.space/signet/api";

async function mempoolGet<T>(path: string): Promise<T> {
  const res = await fetch(`${MEMPOOL_BASE}${path}`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Mempool API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getAddressStats(
  address: string
): Promise<MempoolAddressStats> {
  return mempoolGet<MempoolAddressStats>(`/address/${address}`);
}

export async function getAddressUtxos(
  address: string
): Promise<MempoolUtxo[]> {
  return mempoolGet<MempoolUtxo[]>(`/address/${address}/utxo`);
}

export async function hasBeenSpentFrom(address: string): Promise<boolean> {
  const stats = await getAddressStats(address);
  return stats.chain_stats.spent_txo_count > 0;
}

export async function getAddressBalance(address: string): Promise<number> {
  const stats = await getAddressStats(address);
  const funded =
    stats.chain_stats.funded_txo_sum + stats.mempool_stats.funded_txo_sum;
  const spent =
    stats.chain_stats.spent_txo_sum + stats.mempool_stats.spent_txo_sum;
  return funded - spent;
}

export async function getFullAddressInfo(address: string): Promise<{
  hasBeenSpentFrom: boolean;
  balanceSats: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  utxoCount: number;
}> {
  const [stats, utxos] = await Promise.all([
    getAddressStats(address),
    getAddressUtxos(address),
  ]);

  const totalReceived =
    stats.chain_stats.funded_txo_sum + stats.mempool_stats.funded_txo_sum;
  const totalSent =
    stats.chain_stats.spent_txo_sum + stats.mempool_stats.spent_txo_sum;

  return {
    hasBeenSpentFrom: stats.chain_stats.spent_txo_count > 0,
    balanceSats: totalReceived - totalSent,
    totalReceived,
    totalSent,
    txCount:
      stats.chain_stats.tx_count + stats.mempool_stats.tx_count,
    utxoCount: utxos.length,
  };
}
