/**
 * Migration Transaction Builder
 *
 * Generates actionable migration plans for quantum-vulnerable addresses.
 * Instead of just saying "migrate to P2WPKH," this service provides:
 * - Step-by-step migration instructions
 * - Recommended destination address type
 * - Urgency classification
 * - Fee estimation based on current mempool conditions
 *
 * Uses mempool.space API for balance and fee data.
 */

import type {
  AddressType,
  RiskLevel,
  MigrationPlan,
} from "../types/quantum.js";
import { detectAddressType, isPublicKeyExposed } from "./quantum.js";
import { getFullAddressInfo } from "./mempool.js";

/**
 * Determine the recommended destination address type for migration.
 *
 * - For CRITICAL/HIGH risk: P2WPKH (native segwit, hash-protected, widely supported)
 * - For MEDIUM risk (Taproot): P2TR with script-path-only (no key-path spend)
 * - For LOW risk: no migration needed
 */
function getRecommendedType(
  sourceType: AddressType,
  _riskLevel: RiskLevel
): "P2WPKH" | "P2TR_SCRIPT_ONLY" {
  if (sourceType === "P2TR") {
    return "P2TR_SCRIPT_ONLY";
  }
  return "P2WPKH";
}

/**
 * Map risk level to migration urgency.
 */
function getUrgency(
  riskLevel: RiskLevel
): MigrationPlan["urgency"] {
  switch (riskLevel) {
    case "CRITICAL":
      return "IMMEDIATE";
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MODERATE";
    case "LOW":
      return "LOW";
    case "SAFE":
      return "NONE";
  }
}

/**
 * Generate step-by-step migration instructions.
 */
function getMigrationSteps(
  sourceType: AddressType,
  recommendedType: "P2WPKH" | "P2TR_SCRIPT_ONLY",
  riskLevel: RiskLevel,
  balanceSats: number | null
): string[] {
  const steps: string[] = [];

  if (riskLevel === "LOW" || riskLevel === "SAFE") {
    steps.push("No immediate migration needed.");
    steps.push("Do NOT spend from this address — spending exposes your public key.");
    steps.push("When you need to move funds, send the ENTIRE balance in one transaction to a fresh address.");
    return steps;
  }

  steps.push(
    `Generate a new ${recommendedType === "P2WPKH" ? "P2WPKH (bc1q...)" : "P2TR script-path-only (bc1p...)"} address in your wallet. Ensure this address has NEVER been used before.`
  );

  if (sourceType === "P2PK") {
    steps.push(
      "WARNING: P2PK addresses cannot be directly imported into most modern wallets. You may need to use Bitcoin Core or a specialized tool to sweep the funds."
    );
  }

  steps.push(
    "Create a transaction sending the ENTIRE balance to the new address. Do not leave any change behind — change outputs may reuse the vulnerable key."
  );

  if (balanceSats !== null && balanceSats > 0) {
    steps.push(
      `Current balance: ${balanceSats.toLocaleString()} sats (${(balanceSats / 100_000_000).toFixed(8)} BTC). Send all of this minus the transaction fee.`
    );
  }

  steps.push(
    "Use a reasonable fee rate to ensure confirmation within 1-2 blocks. Do not use a low fee that could leave the transaction unconfirmed for hours — during that time, the public key is exposed in the mempool."
  );

  steps.push(
    "After confirmation, verify the old address has a zero balance. Mark it as deprecated in your wallet."
  );

  if (recommendedType === "P2TR_SCRIPT_ONLY") {
    steps.push(
      "For the new P2TR address, configure script-path-only spending (disable key-path). This prevents the tweaked public key from being used directly, adding quantum resistance."
    );
  }

  steps.push(
    "IMPORTANT: Never reuse the old address. Any future deposits to it will be at risk."
  );

  return steps;
}

/**
 * Generate a migration plan for a single address.
 *
 * @param address - Bitcoin address to assess
 * @param hasBeenSpentFrom - Whether the address has been spent from (optional: auto-detected if not provided)
 * @param balanceSats - Address balance in sats (optional: fetched from mempool if not provided)
 */
export function buildMigrationPlan(
  address: string,
  riskLevel: RiskLevel,
  addressType: AddressType,
  balanceSats: number | null
): MigrationPlan {
  const recommendedType = getRecommendedType(addressType, riskLevel);
  const urgency = getUrgency(riskLevel);

  const reasonMap: Record<RiskLevel, string> = {
    CRITICAL:
      "Public key is permanently exposed in the output script. Quantum attack possible as soon as sufficient hardware exists.",
    HIGH:
      "Public key was exposed when the address was spent from. Key hash no longer provides protection.",
    MEDIUM:
      "Taproot exposes a tweaked public key by design. While not as direct as P2PK, the curve point is visible on-chain.",
    LOW:
      "Address is currently hash-protected. No migration needed unless you plan to spend from it.",
    SAFE:
      "Address has no known quantum vulnerability.",
  };

  return {
    sourceAddress: address,
    sourceType: addressType,
    currentRisk: riskLevel,
    recommendedType,
    reason: reasonMap[riskLevel],
    steps: getMigrationSteps(addressType, recommendedType, riskLevel, balanceSats),
    urgency,
    estimatedFeeSats: balanceSats !== null && balanceSats > 0 ? estimateFee(addressType) : null,
    balanceSats,
  };
}

/**
 * Estimate transaction fee in sats for a simple 1-input-1-output migration.
 *
 * Uses typical vbyte sizes per address type at 10 sat/vbyte (moderate fee).
 * These are estimates — actual fees depend on mempool conditions.
 */
function estimateFee(sourceType: AddressType): number {
  const FEE_RATE = 10; // sat/vbyte (moderate)

  // Typical transaction sizes (1 input, 1 output, no change)
  const vbytesByType: Record<AddressType, number> = {
    P2PK: 192,     // Legacy, large scriptSig
    P2PKH: 192,    // Legacy
    P2WPKH: 110,   // Native segwit (witness discount)
    P2TR: 111,     // Taproot (similar to segwit)
    P2SH: 180,     // Wrapped segwit typical
    P2WSH: 140,    // Native segwit multisig typical
  };

  return vbytesByType[sourceType] * FEE_RATE;
}

/**
 * Build migration plan with auto-detected on-chain data.
 */
export async function buildMigrationPlanWithLookup(
  address: string
): Promise<MigrationPlan> {
  const addressType = detectAddressType(address);

  let balanceSats: number | null = null;
  let hasSpent = false;

  try {
    const info = await getFullAddressInfo(address);
    balanceSats = info.balanceSats;
    hasSpent = info.hasBeenSpentFrom;
  } catch {
    // Mempool lookup failed — proceed without on-chain data
  }

  const publicKeyExposed = isPublicKeyExposed(addressType, hasSpent);

  // Determine risk level from address type and exposure
  let riskLevel: RiskLevel;
  if (addressType === "P2PK") riskLevel = "CRITICAL";
  else if (publicKeyExposed && (addressType === "P2PKH" || addressType === "P2WPKH")) riskLevel = "HIGH";
  else if (addressType === "P2TR") riskLevel = "MEDIUM";
  else riskLevel = "LOW";

  return buildMigrationPlan(address, riskLevel, addressType, balanceSats);
}
