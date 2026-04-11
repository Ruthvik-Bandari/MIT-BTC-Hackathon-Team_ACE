// ── Quantum Risk ────────────────────────────────────────────────

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type AddressType =
  | "P2PK"
  | "P2PKH"
  | "P2WPKH"
  | "P2TR"
  | "P2SH"
  | "P2WSH"
  | "UNKNOWN";

export interface QuantumRiskAssessment {
  address: string;
  addressType: AddressType;
  riskLevel: RiskLevel;
  publicKeyExposed: boolean;
  hasBeenSpent: boolean;
  recommendation: string;
  estimatedAttackTime: string;
}

export interface WalletScanResult {
  totalAddresses: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  assessments: QuantumRiskAssessment[];
}

export interface NetworkStats {
  exposedBtc: number;
  p2pkOutputs: number;
  totalVulnerable: number;
  qubitsRequired: number;
  estimatedBreakTime: string;
}

// ── Wallet ──────────────────────────────────────────────────────

export interface WalletInfo {
  id: string;
  name: string;
  balance: number;
  policy: WalletPolicy;
  addresses: WalletAddress[];
}

export interface WalletAddress {
  address: string;
  type: AddressType;
  balance: number;
  spent: boolean;
}

export interface WalletPolicy {
  dailyLimit: number;
  perTransactionLimit: number;
  requiredApprovals: number;
  whitelistedAddresses: string[];
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  fee: number;
  toAddress: string;
  status: TransactionStatus;
  createdAt: string;
  confirmedAt?: string;
}

export type TransactionStatus =
  | "pending"
  | "approved"
  | "denied"
  | "executed"
  | "failed";

// ── Guardian ────────────────────────────────────────────────────

export type GuardianIntent =
  | "send"
  | "check_balance"
  | "set_policy"
  | "scan_address"
  | "scan_wallet"
  | "pay_lightning"
  | "explain_risk"
  | "unknown";

export interface GuardianParseResult {
  intent: GuardianIntent;
  confidence: number;
  parameters: Record<string, string>;
  explanation: string;
}

// ── Lightning ───────────────────────────────────────────────────

export interface LightningPayment {
  invoice: string;
  amount: number;
  description: string;
  status: "pending" | "settled" | "failed";
  preimage?: string;
  settledAt?: string;
}

export interface LightningBalance {
  balance: number;
  currency: string;
}

// ── Nunchuk Webhook Events ──────────────────────────────────────

export type NunchukWebhookEventType =
  | "wallet.transaction.updated"
  | "wallet.transaction.deleted"
  | "wallet.platform_key.policy_changed"
  | "wallet.replacement_created"
  | "wallet.downgraded"
  | "wallet.dummy_transaction.updated"
  | "group.sandbox.updated"
  | "group.sandbox.finalized"
  | "group.deleted"
  | "group.invitation.created"
  | "group.invitation.accepted"
  | "group.invitation.removed"
  | "group.invitation.denied";

export interface NunchukWebhookPayload {
  id: string;
  type: NunchukWebhookEventType;
  api_version: string;
  created_at: string;
  data: Record<string, unknown>;
}

// ── WebSocket Events ────────────────────────────────────────────

export type WsEventType =
  | "transaction:pending"
  | "transaction:approved"
  | "transaction:executed"
  | "transaction:denied"
  | "guardian:response"
  | "scanner:complete"
  | "lightning:settled"
  | "webhook:transaction"
  | "webhook:policy"
  | "webhook:wallet";

export interface WsMessage {
  type: WsEventType;
  payload: unknown;
  timestamp: string;
}

// ── API Responses ───────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  statusCode: number;
}
