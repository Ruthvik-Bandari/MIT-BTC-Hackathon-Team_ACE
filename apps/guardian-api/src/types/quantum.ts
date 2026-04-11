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
