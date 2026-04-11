// ── Client-Side Verification ────────────────────────────────────
// Verifies quantum scanner results locally in the browser.
// Don't trust the server — verify everything client-side.

import type { QuantumRiskAssessment } from "./types";

type AddressType =
  | "P2PK"
  | "P2PKH"
  | "P2WPKH"
  | "P2TR"
  | "P2SH"
  | "P2WSH"
  | "UNKNOWN";

type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/**
 * Client-side address type detection.
 * Mirrors the server-side logic so the client can independently verify.
 */
export function detectAddressType(address: string): AddressType {
  const lower = address.toLowerCase();

  // Bech32/Bech32m
  if (lower.startsWith("bc1") || lower.startsWith("tb1") || lower.startsWith("sb1")) {
    if (lower.startsWith("bc1q") || lower.startsWith("tb1q") || lower.startsWith("sb1q")) {
      return address.length <= 44 ? "P2WPKH" : "P2WSH";
    }
    if (lower.startsWith("bc1p") || lower.startsWith("tb1p") || lower.startsWith("sb1p")) {
      return "P2TR";
    }
    return "P2WPKH";
  }

  // Base58 P2PKH
  if (address.startsWith("1") || address.startsWith("m") || address.startsWith("n")) {
    return "P2PKH";
  }

  // Base58 P2SH
  if (address.startsWith("3") || address.startsWith("2")) {
    return "P2SH";
  }

  return "UNKNOWN";
}

/**
 * Client-side risk assessment.
 * Implements the same algorithm as the server (TRD §4).
 */
export function assessRiskLocally(
  addressType: AddressType,
  spent: boolean,
): { riskLevel: RiskLevel; publicKeyExposed: boolean } {
  switch (addressType) {
    case "P2PK":
      return { riskLevel: "CRITICAL", publicKeyExposed: true };
    case "P2PKH":
      return spent
        ? { riskLevel: "HIGH", publicKeyExposed: true }
        : { riskLevel: "LOW", publicKeyExposed: false };
    case "P2WPKH":
      return spent
        ? { riskLevel: "HIGH", publicKeyExposed: true }
        : { riskLevel: "LOW", publicKeyExposed: false };
    case "P2TR":
      return { riskLevel: "MEDIUM", publicKeyExposed: true };
    case "P2SH":
    case "P2WSH":
      return {
        riskLevel: spent ? "MEDIUM" : "LOW",
        publicKeyExposed: spent,
      };
    default:
      return { riskLevel: "MEDIUM", publicKeyExposed: false };
  }
}

export interface VerificationResult {
  verified: boolean;
  serverResult: QuantumRiskAssessment;
  clientResult: {
    addressType: AddressType;
    riskLevel: RiskLevel;
    publicKeyExposed: boolean;
  };
  discrepancies: string[];
}

/**
 * Verify a server-provided scan result against client-side computation.
 * Returns detailed discrepancy report if results don't match.
 */
export function verifyServerResult(
  serverResult: QuantumRiskAssessment,
): VerificationResult {
  const clientAddressType = detectAddressType(serverResult.address);
  const clientRisk = assessRiskLocally(
    clientAddressType,
    serverResult.hasBeenSpent,
  );

  const discrepancies: string[] = [];

  if (serverResult.addressType !== clientAddressType) {
    discrepancies.push(
      `Address type mismatch: server=${serverResult.addressType}, client=${clientAddressType}`,
    );
  }

  if (serverResult.riskLevel !== clientRisk.riskLevel) {
    discrepancies.push(
      `Risk level mismatch: server=${serverResult.riskLevel}, client=${clientRisk.riskLevel}`,
    );
  }

  if (serverResult.publicKeyExposed !== clientRisk.publicKeyExposed) {
    discrepancies.push(
      `Public key exposure mismatch: server=${serverResult.publicKeyExposed}, client=${clientRisk.publicKeyExposed}`,
    );
  }

  return {
    verified: discrepancies.length === 0,
    serverResult,
    clientResult: {
      addressType: clientAddressType,
      riskLevel: clientRisk.riskLevel,
      publicKeyExposed: clientRisk.publicKeyExposed,
    },
    discrepancies,
  };
}

/**
 * Verify an IPFS content hash using the Web Crypto API.
 * Runs entirely in the browser — no server trust needed.
 */
export async function verifyContentHash(
  content: string,
  expectedHash: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}

/**
 * Verify network stats against known Google whitepaper values.
 * These are hardcoded constants — any deviation means tampering.
 */
export function verifyNetworkStats(stats: {
  exposedBtc: number;
  qubitsRequired: number;
}): { verified: boolean; reason: string } {
  // From Google Quantum AI whitepaper (March 30, 2026)
  const EXPECTED_EXPOSED_BTC = 6_900_000;
  const EXPECTED_QUBITS = 500_000;

  if (stats.exposedBtc !== EXPECTED_EXPOSED_BTC) {
    return {
      verified: false,
      reason: `exposedBtc should be ${EXPECTED_EXPOSED_BTC}, got ${stats.exposedBtc}`,
    };
  }

  if (stats.qubitsRequired !== EXPECTED_QUBITS) {
    return {
      verified: false,
      reason: `qubitsRequired should be ${EXPECTED_QUBITS}, got ${stats.qubitsRequired}`,
    };
  }

  return { verified: true, reason: "Matches Google Quantum AI whitepaper" };
}
