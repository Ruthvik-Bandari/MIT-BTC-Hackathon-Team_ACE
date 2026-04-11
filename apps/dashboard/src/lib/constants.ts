import type { RiskLevel } from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";

export const RISK_COLORS: Record<RiskLevel, string> = {
  CRITICAL: "#ef4444", // red-500
  HIGH: "#f97316",     // orange-500
  MEDIUM: "#eab308",   // yellow-500
  LOW: "#22c55e",      // green-500
};

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  CRITICAL: "bg-red-500/20",
  HIGH: "bg-orange-500/20",
  MEDIUM: "bg-yellow-500/20",
  LOW: "bg-green-500/20",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  CRITICAL: "Critical — Migrate immediately",
  HIGH: "High — Public key exposed",
  MEDIUM: "Medium — Tweaked key visible",
  LOW: "Low — Hash-protected",
};

// Google Quantum AI whitepaper stats (March 30, 2026)
export const QUANTUM_STATS = {
  exposedBtc: 6_900_000,
  p2pkOutputs: 1_700_000,
  qubitsRequired: 500_000,
  estimatedBreakTimeMins: 9,
} as const;

export const SATS_PER_BTC = 100_000_000;
