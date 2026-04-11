import { z } from "zod";
import type {
  QuantumRiskAssessment,
  WalletScanResult,
  NetworkStats,
  AddressType,
  RiskLevel,
  WalletAddress,
} from "../utils/types.js";

// ── Validation schemas ──────────────────────────────────────────

const AddressTypeEnum = z.enum([
  "P2PK",
  "P2PKH",
  "P2WPKH",
  "P2TR",
  "P2SH",
  "P2WSH",
  "UNKNOWN",
]);

export const ScanWalletSchema = z.object({
  addresses: z.array(
    z.object({
      address: z.string().min(1),
      type: AddressTypeEnum,
      balance: z.number(),
      spent: z.boolean(),
    })
  ),
});

// ── Address type detection ──────────────────────────────────────
// Based on TRD §4: Quantum scanner technical specification

function detectAddressType(address: string): AddressType {
  // Bech32/Bech32m (bc1 / tb1 / sb1)
  const bech32Prefix = address.toLowerCase();
  if (
    bech32Prefix.startsWith("bc1") ||
    bech32Prefix.startsWith("tb1") ||
    bech32Prefix.startsWith("sb1")
  ) {
    // Segwit v0: bc1q... (P2WPKH = 42 chars, P2WSH = 62 chars)
    if (bech32Prefix.startsWith("bc1q") || bech32Prefix.startsWith("tb1q") || bech32Prefix.startsWith("sb1q")) {
      return address.length <= 44 ? "P2WPKH" : "P2WSH";
    }
    // Segwit v1 (Taproot): bc1p...
    if (bech32Prefix.startsWith("bc1p") || bech32Prefix.startsWith("tb1p") || bech32Prefix.startsWith("sb1p")) {
      return "P2TR";
    }
    return "P2WPKH";
  }

  // Base58: P2PKH starts with 1 (mainnet) or m/n (testnet)
  if (address.startsWith("1") || address.startsWith("m") || address.startsWith("n")) {
    return "P2PKH";
  }

  // Base58: P2SH starts with 3 (mainnet) or 2 (testnet)
  if (address.startsWith("3") || address.startsWith("2")) {
    return "P2SH";
  }

  return "UNKNOWN";
}

// ── Risk assessment (TRD §4 algorithm) ──────────────────────────

function assessRisk(addressType: AddressType, spent: boolean): {
  riskLevel: RiskLevel;
  publicKeyExposed: boolean;
  recommendation: string;
  estimatedAttackTime: string;
} {
  switch (addressType) {
    case "P2PK":
      return {
        riskLevel: "CRITICAL",
        publicKeyExposed: true,
        recommendation: "Migrate to fresh P2WPKH immediately. Public key is directly exposed in the output script.",
        estimatedAttackTime: "~9 minutes with <500K qubits",
      };

    case "P2PKH":
      if (spent) {
        return {
          riskLevel: "HIGH",
          publicKeyExposed: true,
          recommendation: "Migrate to fresh P2WPKH immediately. Public key was exposed in scriptSig when spent.",
          estimatedAttackTime: "~9 minutes with <500K qubits",
        };
      }
      return {
        riskLevel: "LOW",
        publicKeyExposed: false,
        recommendation: "Safe at rest. Avoid address reuse to prevent public key exposure.",
        estimatedAttackTime: "Protected by hash (2^160 pre-image)",
      };

    case "P2WPKH":
      if (spent) {
        return {
          riskLevel: "HIGH",
          publicKeyExposed: true,
          recommendation: "Migrate to fresh P2WPKH immediately. Public key was exposed in witness data.",
          estimatedAttackTime: "~9 minutes with <500K qubits",
        };
      }
      return {
        riskLevel: "LOW",
        publicKeyExposed: false,
        recommendation: "Safe at rest. Avoid address reuse to prevent public key exposure.",
        estimatedAttackTime: "Protected by hash (2^160 pre-image)",
      };

    case "P2TR":
      return {
        riskLevel: "MEDIUM",
        publicKeyExposed: true,
        recommendation: "Consider script-path only spending. Tweaked key is visible in output. Await BIP-360 for post-quantum migration.",
        estimatedAttackTime: "~9 minutes with <500K qubits (tweaked key exposed)",
      };

    case "P2SH":
    case "P2WSH":
      return {
        riskLevel: spent ? "MEDIUM" : "LOW",
        publicKeyExposed: spent,
        recommendation: spent
          ? "Script was revealed when spent. Risk depends on specific script contents."
          : "Safe at rest behind script hash. Risk depends on redeem script.",
        estimatedAttackTime: spent ? "Depends on script contents" : "Protected by hash",
      };

    default:
      return {
        riskLevel: "MEDIUM",
        publicKeyExposed: false,
        recommendation: "Unknown address type. Manual review recommended.",
        estimatedAttackTime: "Unknown",
      };
  }
}

// ── Service functions ───────────────────────────────────────────

export function scanAddress(address: string, spent: boolean): QuantumRiskAssessment {
  const addressType = detectAddressType(address);
  const risk = assessRisk(addressType, spent);

  return {
    address,
    addressType,
    riskLevel: risk.riskLevel,
    publicKeyExposed: risk.publicKeyExposed,
    hasBeenSpent: spent,
    recommendation: risk.recommendation,
    estimatedAttackTime: risk.estimatedAttackTime,
  };
}

export function scanWallet(addresses: WalletAddress[]): WalletScanResult {
  const assessments = addresses.map((addr) =>
    scanAddress(addr.address, addr.spent)
  );

  return {
    totalAddresses: assessments.length,
    critical: assessments.filter((a) => a.riskLevel === "CRITICAL").length,
    high: assessments.filter((a) => a.riskLevel === "HIGH").length,
    medium: assessments.filter((a) => a.riskLevel === "MEDIUM").length,
    low: assessments.filter((a) => a.riskLevel === "LOW").length,
    assessments,
  };
}

export function getNetworkStats(): NetworkStats {
  // Hardcoded from Google Quantum AI whitepaper (March 30, 2026)
  // and blockchain analysis data
  return {
    exposedBtc: 6_900_000,
    p2pkOutputs: 1_700_000,
    totalVulnerable: 6_900_000,
    qubitsRequired: 500_000,
    estimatedBreakTime: "~9 minutes",
  };
}
