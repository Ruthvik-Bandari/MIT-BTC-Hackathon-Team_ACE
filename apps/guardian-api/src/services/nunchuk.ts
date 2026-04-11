import { z } from "zod";
import type {
  WalletInfo,
  WalletPolicy,
  Transaction,
  WalletAddress,
} from "../utils/types.js";

// ── Validation schemas ──────────────────────────────────────────

export const CreateWalletSchema = z.object({
  name: z.string().min(1).max(64),
  requiredApprovals: z.number().int().min(1).max(5).default(2),
});

export const SetPolicySchema = z.object({
  walletId: z.string().min(1),
  dailyLimit: z.number().positive(),
  perTransactionLimit: z.number().positive(),
  whitelistedAddresses: z.array(z.string()).default([]),
});

export const SendTransactionSchema = z.object({
  walletId: z.string().min(1),
  toAddress: z.string().min(26).max(90),
  amount: z.number().positive(),
  memo: z.string().max(256).optional(),
});

// ── Nunchuk CLI wrapper ─────────────────────────────────────────

const NUNCHUK_CLI = process.env.NUNCHUK_CLI_PATH ?? "nunchuk-cli";
const NETWORK = process.env.BITCOIN_NETWORK ?? "signet";

async function execNunchuk(args: string[]): Promise<string> {
  const proc = Bun.spawn([NUNCHUK_CLI, "--chain", NETWORK, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new NunchukError(`Nunchuk CLI failed: ${stderr.trim()}`, exitCode);
  }

  return stdout.trim();
}

export class NunchukError extends Error {
  constructor(
    message: string,
    public exitCode: number
  ) {
    super(message);
    this.name = "NunchukError";
  }
}

// ── Service functions ───────────────────────────────────────────

export async function createWallet(
  name: string,
  requiredApprovals: number
): Promise<WalletInfo> {
  const output = await execNunchuk([
    "createwallet",
    "--name",
    name,
    "--n",
    String(requiredApprovals),
  ]);

  // Parse CLI output into WalletInfo
  const walletId = extractField(output, "wallet_id");

  return {
    id: walletId,
    name,
    balance: 0,
    policy: {
      dailyLimit: 1_000_000, // default 0.01 BTC in sats
      perTransactionLimit: 500_000,
      requiredApprovals,
      whitelistedAddresses: [],
    },
    addresses: [],
  };
}

export async function getBalance(walletId: string): Promise<number> {
  const output = await execNunchuk(["getbalance", "--wallet", walletId]);
  const balance = parseInt(extractField(output, "balance"), 10);
  return isNaN(balance) ? 0 : balance;
}

export async function getTransactions(
  walletId: string
): Promise<Transaction[]> {
  const output = await execNunchuk([
    "gettransactions",
    "--wallet",
    walletId,
  ]);

  try {
    const parsed: Array<{
      txid: string;
      amount: number;
      fee: number;
      to_address: string;
      status: string;
      created_at: string;
      confirmed_at?: string;
    }> = JSON.parse(output);
    return parsed.map((tx) => ({
      id: tx.txid,
      walletId,
      amount: tx.amount,
      fee: tx.fee,
      toAddress: tx.to_address,
      status: mapTxStatus(tx.status),
      createdAt: tx.created_at,
      confirmedAt: tx.confirmed_at,
    }));
  } catch {
    return [];
  }
}

export async function sendTransaction(
  walletId: string,
  toAddress: string,
  amount: number,
  memo?: string
): Promise<Transaction> {
  const args = [
    "send",
    "--wallet",
    walletId,
    "--to",
    toAddress,
    "--amount",
    String(amount),
  ];
  if (memo) args.push("--memo", memo);

  const output = await execNunchuk(args);
  const txId = extractField(output, "txid");

  return {
    id: txId,
    walletId,
    amount,
    fee: 0,
    toAddress,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export async function approveTransaction(txId: string): Promise<Transaction> {
  const output = await execNunchuk(["approve", "--txid", txId]);
  const status = extractField(output, "status");

  return {
    id: txId,
    walletId: "",
    amount: 0,
    fee: 0,
    toAddress: "",
    status: mapTxStatus(status),
    createdAt: new Date().toISOString(),
  };
}

export async function denyTransaction(txId: string): Promise<Transaction> {
  const output = await execNunchuk(["deny", "--txid", txId]);
  void output;

  return {
    id: txId,
    walletId: "",
    amount: 0,
    fee: 0,
    toAddress: "",
    status: "denied",
    createdAt: new Date().toISOString(),
  };
}

export async function setPolicy(
  walletId: string,
  policy: Omit<WalletPolicy, "requiredApprovals">
): Promise<WalletPolicy> {
  await execNunchuk([
    "setpolicy",
    "--wallet",
    walletId,
    "--daily-limit",
    String(policy.dailyLimit),
    "--per-tx-limit",
    String(policy.perTransactionLimit),
  ]);

  return {
    ...policy,
    requiredApprovals: 2, // preserved from wallet config
  };
}

export async function getAddresses(
  walletId: string
): Promise<WalletAddress[]> {
  const output = await execNunchuk([
    "getaddresses",
    "--wallet",
    walletId,
  ]);

  try {
    const parsed: Array<{
      address: string;
      type: string;
      balance: number;
      used: boolean;
    }> = JSON.parse(output);
    return parsed.map((addr) => ({
      address: addr.address,
      type: mapAddressType(addr.type),
      balance: addr.balance,
      spent: addr.used,
    }));
  } catch {
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function extractField(output: string, field: string): string {
  const regex = new RegExp(`${field}[:\\s]+(.+)`, "i");
  const match = output.match(regex);
  return match?.[1]?.trim() ?? "";
}

function mapTxStatus(
  status: string
): "pending" | "approved" | "denied" | "executed" | "failed" {
  const map: Record<
    string,
    "pending" | "approved" | "denied" | "executed" | "failed"
  > = {
    pending: "pending",
    approved: "approved",
    denied: "denied",
    confirmed: "executed",
    executed: "executed",
    failed: "failed",
  };
  return map[status.toLowerCase()] ?? "pending";
}

function mapAddressType(
  type: string
): "P2PK" | "P2PKH" | "P2WPKH" | "P2TR" | "P2SH" | "P2WSH" | "UNKNOWN" {
  const upper = type.toUpperCase();
  const valid = ["P2PK", "P2PKH", "P2WPKH", "P2TR", "P2SH", "P2WSH"] as const;
  return (valid as readonly string[]).includes(upper)
    ? (upper as (typeof valid)[number])
    : "UNKNOWN";
}
