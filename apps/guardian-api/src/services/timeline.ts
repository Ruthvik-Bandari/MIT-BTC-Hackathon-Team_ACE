/**
 * Quantum Attack Timeline Projection
 *
 * Projects the quantum threat to Bitcoin's ECDSA over time based on:
 * - Google Quantum AI roadmap (Willow processor, 105 qubits in 2024)
 * - Industry projections for qubit scaling (roughly doubling every 1-2 years)
 * - Threshold: ~500,000 physical qubits to break secp256k1 in ~9 minutes
 *
 * All projections are based on publicly available data from:
 * - Google Quantum AI whitepaper (March 30, 2026)
 * - IBM Quantum Development Roadmap
 * - Published quantum computing scaling forecasts
 */

import type { QuantumTimeline, TimelinePoint } from "../types/quantum.js";

/**
 * Quantum qubit scaling projections.
 *
 * Based on Google's Willow chip (105 qubits, Dec 2024) and industry roadmaps.
 * Scaling follows an aggressive-but-realistic doubling rate.
 *
 * NOTE: These are projections, not guarantees. Actual progress depends on
 * error correction breakthroughs, funding, and physics constraints.
 */
const PROJECTIONS: TimelinePoint[] = [
  {
    year: 2024,
    estimatedQubits: 1_100,
    threatLevel: "NONE",
    canBreakECDSA: false,
    estimatedAttackTime: null,
    description:
      "Google Willow (105 physical qubits). IBM Heron (1,121 qubits). Error correction still experimental. No threat to cryptographic systems.",
  },
  {
    year: 2025,
    estimatedQubits: 4_000,
    threatLevel: "NONE",
    canBreakECDSA: false,
    estimatedAttackTime: null,
    description:
      "Focus on error correction and logical qubit demonstration. Physical qubit counts growing but far from cryptographic relevance.",
  },
  {
    year: 2026,
    estimatedQubits: 10_000,
    threatLevel: "THEORETICAL",
    canBreakECDSA: false,
    estimatedAttackTime: null,
    description:
      "Google Quantum AI publishes whitepaper confirming <500K qubits sufficient for secp256k1. Threat is now theoretically mapped but not yet realizable. Community begins BIP-360 discussion.",
  },
  {
    year: 2027,
    estimatedQubits: 25_000,
    threatLevel: "THEORETICAL",
    canBreakECDSA: false,
    estimatedAttackTime: null,
    description:
      "Logical qubit demonstrations at scale. Post-quantum signature research accelerates. BIP-360 in draft stage.",
  },
  {
    year: 2028,
    estimatedQubits: 50_000,
    threatLevel: "THEORETICAL",
    canBreakECDSA: false,
    estimatedAttackTime: null,
    description:
      "10% of required qubits reached. Error rates improving. Serious planning for quantum-safe migration in financial systems.",
  },
  {
    year: 2029,
    estimatedQubits: 100_000,
    threatLevel: "EMERGING",
    canBreakECDSA: false,
    estimatedAttackTime: null,
    description:
      "20% of threshold. Quantum advantage demonstrated for optimization problems. NIST post-quantum standards widely adopted in traditional systems. Bitcoin migration urgency increases.",
  },
  {
    year: 2030,
    estimatedQubits: 200_000,
    threatLevel: "EMERGING",
    canBreakECDSA: false,
    estimatedAttackTime: null,
    description:
      "40% of threshold. Nation-state quantum programs could be ahead of public estimates. P2PK holders should have migrated by now.",
  },
  {
    year: 2031,
    estimatedQubits: 350_000,
    threatLevel: "IMMINENT",
    canBreakECDSA: false,
    estimatedAttackTime: "~45 minutes (suboptimal qubit count)",
    description:
      "70% of threshold. Attack theoretically possible but slow. Well-funded adversaries may attempt targeted attacks on high-value P2PK UTXOs. Bitcoin soft fork for quantum resistance should be activated.",
  },
  {
    year: 2032,
    estimatedQubits: 500_000,
    threatLevel: "CRITICAL",
    canBreakECDSA: true,
    estimatedAttackTime: "~9 minutes",
    description:
      "THRESHOLD REACHED. 500K physical qubits can break secp256k1 in ~9 minutes using Shor's algorithm. All exposed public keys are vulnerable. 6.9 million BTC at immediate risk if not migrated.",
  },
  {
    year: 2033,
    estimatedQubits: 750_000,
    threatLevel: "CRITICAL",
    canBreakECDSA: true,
    estimatedAttackTime: "~4 minutes",
    description:
      "Beyond threshold. Attack time decreasing with more qubits. Race between quantum attackers and blockchain migration. Satoshi's coins (if unmoved) are vulnerable.",
  },
  {
    year: 2035,
    estimatedQubits: 1_500_000,
    threatLevel: "CRITICAL",
    canBreakECDSA: true,
    estimatedAttackTime: "~1 minute",
    description:
      "3x threshold. ECDSA effectively broken for all practical purposes. Any transaction broadcasting a public key can be front-run within a block time.",
  },
];

/**
 * Get the full quantum threat timeline projection.
 */
export function getQuantumTimeline(): QuantumTimeline {
  const currentYear = new Date().getFullYear();
  const ecdsaBreakYear = 2032;
  const yearsUntilThreat = ecdsaBreakYear - currentYear;

  return {
    currentYear,
    projections: PROJECTIONS,
    ecdsaBreakYear,
    timeUntilThreat:
      yearsUntilThreat > 0
        ? `~${yearsUntilThreat} years (projected ${ecdsaBreakYear})`
        : "NOW — quantum threat is active",
    source:
      "Projections based on Google Quantum AI whitepaper (March 2026), IBM Quantum Roadmap, and published qubit scaling models",
  };
}

/**
 * Get threat level for a specific year.
 */
export function getThreatLevelForYear(
  year: number
): TimelinePoint | null {
  return PROJECTIONS.find((p) => p.year === year) ?? null;
}

/**
 * Calculate how many years until a given address type becomes critically vulnerable.
 */
export function yearsUntilCritical(
  publicKeyExposed: boolean
): { years: number; targetYear: number; message: string } {
  const currentYear = new Date().getFullYear();

  if (!publicKeyExposed) {
    return {
      years: -1,
      targetYear: -1,
      message:
        "Address is hash-protected. Not directly vulnerable to quantum attack unless spent from.",
    };
  }

  const ecdsaBreakYear = 2032;
  const years = Math.max(0, ecdsaBreakYear - currentYear);

  return {
    years,
    targetYear: ecdsaBreakYear,
    message:
      years > 0
        ? `Estimated ${years} years until quantum computers can break this key (~${ecdsaBreakYear})`
        : "Quantum threat window has arrived — migrate immediately",
  };
}
