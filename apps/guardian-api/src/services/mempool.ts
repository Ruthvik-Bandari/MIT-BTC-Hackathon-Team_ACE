/**
 * Mempool.space API Integration
 *
 * Auto-detects whether a Bitcoin address has been spent from by querying
 * the mempool.space signet API. This eliminates the need for callers to
 * manually pass the `spent` flag — the scanner becomes a one-input tool.
 *
 * API: https://mempool.space/signet/api/
 * No authentication required (public API).
 */

import xior from "xior";
import type {
  MempoolAddressStats,
  MempoolUtxo,
} from "../types/quantum.js";

const MEMPOOL_BASE =
  process.env["MEMPOOL_API_URL"] ?? "https://mempool.space/signet/api";

const mempoolClient = xior.create({
  baseURL: MEMPOOL_BASE,
  timeout: 10_000,
});

/**
 * Fetch address statistics from mempool.space.
 * Returns funded/spent txo counts to determine if address has been spent from.
 */
export async function getAddressStats(
  address: string
): Promise<MempoolAddressStats> {
  const { data } = await mempoolClient.get<MempoolAddressStats>(
    `/address/${address}`
  );
  return data;
}

/**
 * Fetch UTXOs for an address from mempool.space.
 */
export async function getAddressUtxos(
  address: string
): Promise<MempoolUtxo[]> {
  const { data } = await mempoolClient.get<MempoolUtxo[]>(
    `/address/${address}/utxo`
  );
  return data;
}

/**
 * Auto-detect whether an address has been spent from.
 *
 * An address has been spent from if its spent_txo_count > 0.
 * This means the public key was revealed in a transaction input.
 */
export async function hasBeenSpentFrom(address: string): Promise<boolean> {
  const stats = await getAddressStats(address);
  return stats.chain_stats.spent_txo_count > 0;
}

/**
 * Get the balance (in sats) for an address.
 */
export async function getAddressBalance(address: string): Promise<number> {
  const stats = await getAddressStats(address);
  const funded =
    stats.chain_stats.funded_txo_sum + stats.mempool_stats.funded_txo_sum;
  const spent =
    stats.chain_stats.spent_txo_sum + stats.mempool_stats.spent_txo_sum;
  return funded - spent;
}

/**
 * Full on-chain lookup: stats + UTXOs in parallel.
 * Returns everything needed for an enhanced quantum assessment.
 */
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
