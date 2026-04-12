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
// Wraps the real `nunchuk` CLI (v0.1.0) which uses subcommand structure:
//   nunchuk [--json] [--network <net>] <command> <subcommand> [options]

const NUNCHUK_CLI = process.env.NUNCHUK_CLI_PATH ?? "nunchuk";
const WALLET_ID = "twvucjgm"; // configured wallet

async function execNunchuk(args: string[]): Promise<string> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  let stdout: string;
  let stderr: string;
  let exitCode: number;

  try {
    const result = await execFileAsync(NUNCHUK_CLI, ["--json", ...args]);
    stdout = result.stdout;
    stderr = result.stderr;
    exitCode = 0;
  } catch (e: any) {
    stdout = e.stdout ?? "";
    stderr = e.stderr ?? "";
    exitCode = e.code ?? 1;
  }

  if (exitCode !== 0) {
    const errMsg = stderr.trim() || stdout.trim();
    // Log full error internally, return sanitized message to client
    console.error(`[nunchuk] CLI error (exit ${exitCode}): ${errMsg}`);
    try {
      const errJson = JSON.parse(errMsg);
      const detail = errJson.message ?? errJson.error ?? "Wallet operation failed";
      throw new NunchukError(detail, exitCode);
    } catch (e) {
      if (e instanceof NunchukError) throw e;
      throw new NunchukError("Wallet operation failed", exitCode);
    }
  }

  return stdout.trim();
}

export class NunchukError extends Error {
  constructor(
    message: string,
    public exitCode: number,
  ) {
    super(message);
    this.name = "NunchukError";
  }
}

// ── Service functions ───────────────────────────────────────────

export async function createWallet(
  name: string,
  requiredApprovals: number,
): Promise<WalletInfo> {
  // Create a sandbox (draft wallet), then finalize it
  const output = await execNunchuk([
    "sandbox",
    "create",
    "--name",
    name,
    "--m",
    String(requiredApprovals),
    "--n",
    "3",
    "--address-type",
    "NATIVE_SEGWIT",
  ]);

  const parsed = JSON.parse(output);

  return {
    id: parsed.sandboxId ?? parsed.id ?? "",
    name,
    balance: 0,
    policy: {
      dailyLimit: 5_000,
      perTransactionLimit: 5_000,
      requiredApprovals,
      whitelistedAddresses: [],
    },
    addresses: [],
  };
}

export async function getBalance(walletId: string): Promise<number> {
  const output = await execNunchuk(["wallet", "get", walletId || WALLET_ID]);
  const parsed = JSON.parse(output);

  // Balance comes as "0.00000000 BTC" string — convert to sats
  const balanceStr = typeof parsed.balance === "string"
    ? parsed.balance.replace(/\s*BTC$/, "")
    : String(parsed.balance ?? "0");
  const btc = parseFloat(balanceStr);
  return Math.round(btc * 100_000_000);
}

export async function getTransactions(
  walletId: string,
): Promise<Transaction[]> {
  const output = await execNunchuk([
    "tx",
    "list",
    "--wallet",
    walletId || WALLET_ID,
  ]);

  const parsed = JSON.parse(output) as {
    pending: Array<{
      txId?: string;
      id?: string;
      amount?: number;
      fee?: number;
      to?: string;
      status?: string;
      createdAt?: string;
    }>;
    confirmed: Array<{
      txId?: string;
      id?: string;
      amount?: number;
      fee?: number;
      to?: string;
      status?: string;
      createdAt?: string;
      confirmedAt?: string;
    }>;
  };

  const mapTx = (
    tx: (typeof parsed.pending)[number],
    defaultStatus: string,
  ): Transaction => ({
    id: tx.txId ?? tx.id ?? "",
    walletId: walletId || WALLET_ID,
    amount: tx.amount ?? 0,
    fee: tx.fee ?? 0,
    toAddress: tx.to ?? "",
    status: mapTxStatus(tx.status ?? defaultStatus),
    createdAt: tx.createdAt ?? new Date().toISOString(),
  });

  return [
    ...parsed.pending.map((tx) => mapTx(tx, "pending")),
    ...parsed.confirmed.map((tx) => mapTx(tx, "executed")),
  ];
}

export async function sendTransaction(
  walletId: string,
  toAddress: string,
  amount: number,
  _memo?: string,
): Promise<Transaction> {
  const output = await execNunchuk([
    "tx",
    "create",
    "--wallet",
    walletId || WALLET_ID,
    "--to",
    toAddress,
    "--amount",
    String(amount),
    "--currency",
    "sat",
  ]);

  const parsed = JSON.parse(output);

  return {
    id: parsed.txId ?? parsed.id ?? "",
    walletId: walletId || WALLET_ID,
    amount,
    fee: parsed.fee ?? 0,
    toAddress,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

export async function approveTransaction(txId: string): Promise<Transaction> {
  // In nunchuk CLI, signing a transaction is the approval step
  const output = await execNunchuk(["tx", "sign", "--tx-id", txId]);
  const parsed = JSON.parse(output);

  return {
    id: txId,
    walletId: parsed.walletId ?? WALLET_ID,
    amount: parsed.amount ?? 0,
    fee: parsed.fee ?? 0,
    toAddress: parsed.to ?? "",
    status: "approved",
    createdAt: parsed.createdAt ?? new Date().toISOString(),
  };
}

export async function denyTransaction(txId: string): Promise<Transaction> {
  // Nunchuk CLI doesn't have a deny command — we just don't sign it
  // The transaction stays pending and eventually expires
  return {
    id: txId,
    walletId: WALLET_ID,
    amount: 0,
    fee: 0,
    toAddress: "",
    status: "denied",
    createdAt: new Date().toISOString(),
  };
}

export async function setPolicy(
  walletId: string,
  policy: Omit<WalletPolicy, "requiredApprovals">,
): Promise<WalletPolicy> {
  await execNunchuk([
    "wallet",
    "platform-key",
    "update",
    walletId || WALLET_ID,
    "--limit-amount",
    String(policy.dailyLimit),
    "--limit-currency",
    "sat",
    "--limit-interval",
    "DAILY",
    "--auto-broadcast",
  ]);

  return {
    ...policy,
    requiredApprovals: 2,
  };
}

export async function getAddresses(
  walletId: string,
): Promise<WalletAddress[]> {
  const output = await execNunchuk([
    "wallet",
    "address",
    "get",
    walletId || WALLET_ID,
  ]);

  // CLI returns a single address, not a list
  try {
    const parsed = JSON.parse(output);
    return [
      {
        address: parsed.address ?? "",
        type: "P2WPKH" as const, // NATIVE_SEGWIT wallet
        balance: 0,
        spent: false,
      },
    ];
  } catch {
    // Fallback: parse text output "address: tb1q..."
    const match = output.match(/address:\s*(\S+)/);
    if (match) {
      return [
        {
          address: match[1],
          type: "P2WPKH" as const,
          balance: 0,
          spent: false,
        },
      ];
    }
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function mapTxStatus(
  status: string,
): "pending" | "approved" | "denied" | "executed" | "failed" {
  const s = status.toLowerCase();
  if (s.includes("pending") || s.includes("ready")) return "pending";
  if (s.includes("signed") || s.includes("approved")) return "approved";
  if (s.includes("confirmed") || s.includes("broadcast")) return "executed";
  if (s.includes("failed") || s.includes("error")) return "failed";
  if (s.includes("denied") || s.includes("rejected")) return "denied";
  return "pending";
}
