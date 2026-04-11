/**
 * Quantum Vulnerability Scanner Types
 *
 * Risk classifications based on Google Quantum AI whitepaper (March 30, 2026):
 * - <500,000 physical qubits can break secp256k1 in ~9 minutes
 * - 6.9 million BTC have exposed public keys
 * - 1.7 million BTC from P2PK (Satoshi era)
 */

/** Bitcoin address types supported by the scanner */
export type AddressType = "P2PK" | "P2PKH" | "P2WPKH" | "P2TR" | "P2SH" | "P2WSH";

/** Quantum risk severity levels */
export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";

/** Full quantum risk assessment for a single address */
export interface QuantumRiskAssessment {
  address: string;
  addressType: AddressType;
  riskLevel: RiskLevel;
  publicKeyExposed: boolean;
  estimatedAttackTime: string;
  vulnerability: string;
  recommendation: string;
}

/** Input for batch wallet scanning */
export interface WalletAddress {
  address: string;
  hasBeenSpentFrom: boolean;
}

/** Result of a batch wallet scan */
export interface WalletScanResult {
  totalAddresses: number;
  riskBreakdown: Record<RiskLevel, number>;
  assessments: QuantumRiskAssessment[];
  overallRisk: RiskLevel;
  scanTimestamp: string;
}

/** Network-wide quantum threat statistics (hardcoded from Google whitepaper) */
export interface NetworkQuantumStats {
  totalBtcAtRisk: number;
  btcFromP2PK: number;
  estimatedAttackWindow: string;
  requiredQubits: number;
  exposedAddressCount: string;
  lastUpdated: string;
  source: string;
}

/** Typed API error response */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Mempool API types (auto-detect spent status)
// ---------------------------------------------------------------------------

/** UTXO returned by mempool.space API */
export interface MempoolUtxo {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
}

/** Address stats from mempool.space API */
export interface MempoolAddressStats {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

/** Enhanced assessment with auto-detected on-chain data */
export interface EnhancedQuantumAssessment extends QuantumRiskAssessment {
  balanceSats: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  utxoCount: number;
  autoDetected: true;
}

// ---------------------------------------------------------------------------
// Quantum Timeline Projection types
// ---------------------------------------------------------------------------

/** A single point in the quantum threat timeline */
export interface TimelinePoint {
  year: number;
  estimatedQubits: number;
  threatLevel: "NONE" | "THEORETICAL" | "EMERGING" | "IMMINENT" | "CRITICAL";
  canBreakECDSA: boolean;
  estimatedAttackTime: string | null;
  description: string;
}

/** Full quantum threat timeline projection */
export interface QuantumTimeline {
  currentYear: number;
  projections: TimelinePoint[];
  ecdsaBreakYear: number;
  timeUntilThreat: string;
  source: string;
}

// ---------------------------------------------------------------------------
// Migration Transaction Builder types
// ---------------------------------------------------------------------------

/** Migration recommendation with transaction details */
export interface MigrationPlan {
  sourceAddress: string;
  sourceType: AddressType;
  currentRisk: RiskLevel;
  recommendedType: "P2WPKH" | "P2TR_SCRIPT_ONLY";
  reason: string;
  steps: string[];
  urgency: "IMMEDIATE" | "HIGH" | "MODERATE" | "LOW" | "NONE";
  estimatedFeeSats: number | null;
  balanceSats: number | null;
}

// ---------------------------------------------------------------------------
// BIP-360 Compatibility types
// ---------------------------------------------------------------------------

/** BIP-360 (QuBit) post-quantum compatibility assessment */
export interface Bip360Assessment {
  address: string;
  addressType: AddressType;
  currentRisk: RiskLevel;
  bip360Compatible: boolean;
  migrationRequired: boolean;
  postQuantumScheme: string;
  readiness: "READY" | "NEEDS_MIGRATION" | "NOT_APPLICABLE";
  details: string;
}

// ---------------------------------------------------------------------------
// UTXO Monitor types
// ---------------------------------------------------------------------------

/** UTXO watch subscription */
export interface WatchedAddress {
  address: string;
  lastChecked: string;
  lastTxCount: number;
  riskLevel: RiskLevel;
  publicKeyExposed: boolean;
}
