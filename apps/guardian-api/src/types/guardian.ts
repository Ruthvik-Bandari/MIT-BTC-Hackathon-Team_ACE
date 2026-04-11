import { z } from "zod";

// ─── Guardian Intent Actions ────────────────────────────────────────────────

export const GuardianAction = {
  SET_POLICY: "SET_POLICY",
  SEND_PAYMENT: "SEND_PAYMENT",
  CHECK_BALANCE: "CHECK_BALANCE",
  SCAN_QUANTUM: "SCAN_QUANTUM",
  APPROVE_TRANSACTION: "APPROVE_TRANSACTION",
  DENY_TRANSACTION: "DENY_TRANSACTION",
  CHAT: "CHAT",
} as const;

export type GuardianAction = (typeof GuardianAction)[keyof typeof GuardianAction];

// ─── Quantum Risk Levels ────────────────────────────────────────────────────

export const QuantumRiskLevel = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  SAFE: "SAFE",
} as const;

export type QuantumRiskLevel = (typeof QuantumRiskLevel)[keyof typeof QuantumRiskLevel];

// ─── Address Types ──────────────────────────────────────────────────────────

export const AddressType = {
  P2PK: "P2PK",
  P2PKH: "P2PKH",
  P2WPKH: "P2WPKH",
  P2TR: "P2TR",
  P2SH: "P2SH",
  P2WSH: "P2WSH",
  UNKNOWN: "UNKNOWN",
} as const;

export type AddressType = (typeof AddressType)[keyof typeof AddressType];

// ─── Guardian Response Schema ───────────────────────────────────────────────

export const GuardianResponseSchema = z.object({
  action: z.enum([
    "SET_POLICY",
    "SEND_PAYMENT",
    "CHECK_BALANCE",
    "SCAN_QUANTUM",
    "APPROVE_TRANSACTION",
    "DENY_TRANSACTION",
    "CHAT",
  ]),
  params: z.record(z.string(), z.unknown()).default({}),
  message: z.string(),
  warnings: z.array(z.string()).default([]),
});

export type GuardianResponse = z.infer<typeof GuardianResponseSchema>;

// ─── Wallet Context (sent from frontend) ────────────────────────────────────

export interface WalletAddress {
  address: string;
  type: AddressType;
  hasBeenSpent: boolean;
  balanceSats: number;
  quantumRisk: QuantumRiskLevel;
}

export interface WalletPolicy {
  dailyLimitSats: number;
  spentTodaySats: number;
  requireApprovalAboveSats: number;
  coSignerEnabled: boolean;
}

export interface PendingTransaction {
  txId: string;
  toAddress: string;
  amountSats: number;
  createdAt: string;
  status: "pending" | "approved" | "denied" | "executed";
}

export interface WalletContext {
  balanceSats: number;
  policy: WalletPolicy;
  addresses: WalletAddress[];
  pendingTransactions: PendingTransaction[];
  network: "signet" | "testnet";
}

// ─── Request/Response Schemas ───────────────────────────────────────────────

export const GuardianParseRequestSchema = z.object({
  userMessage: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  walletContext: z.object({
    balanceSats: z.number().nonnegative(),
    policy: z.object({
      dailyLimitSats: z.number().nonnegative(),
      spentTodaySats: z.number().nonnegative(),
      requireApprovalAboveSats: z.number().nonnegative(),
      coSignerEnabled: z.boolean(),
    }),
    addresses: z.array(
      z.object({
        address: z.string(),
        type: z.enum(["P2PK", "P2PKH", "P2WPKH", "P2TR", "P2SH", "P2WSH", "UNKNOWN"]),
        hasBeenSpent: z.boolean(),
        balanceSats: z.number().nonnegative(),
        quantumRisk: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "SAFE"]),
      })
    ).default([]),
    pendingTransactions: z.array(
      z.object({
        txId: z.string(),
        toAddress: z.string(),
        amountSats: z.number().nonnegative(),
        createdAt: z.string(),
        status: z.enum(["pending", "approved", "denied", "executed"]),
      })
    ).default([]),
    network: z.enum(["signet", "testnet"]).default("signet"),
  }),
});

export type GuardianParseRequest = z.infer<typeof GuardianParseRequestSchema>;

// ─── Cogcoin Types ──────────────────────────────────────────────────────────

export const CogcoinEventType = {
  POLICY_CHANGE: "POLICY_CHANGE",
  QUANTUM_SCAN: "QUANTUM_SCAN",
  TRANSACTION_APPROVED: "TRANSACTION_APPROVED",
  TRANSACTION_DENIED: "TRANSACTION_DENIED",
  IDENTITY_REGISTERED: "IDENTITY_REGISTERED",
} as const;

export type CogcoinEventType = (typeof CogcoinEventType)[keyof typeof CogcoinEventType];

export interface CogcoinAnchorEvent {
  eventType: CogcoinEventType;
  timestamp: string;
  data: Record<string, unknown>;
  guardianId: string;
}

export interface CogcoinAnchorResult {
  txId: string;
  opReturnHex: string;
  confirmed: boolean;
  blockHeight: number | null;
}

export interface CogcoinIdentity {
  id: string;
  name: string;
  publicKey: string;
  registeredAt: string;
  network: "signet" | "testnet";
}
