import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  createWallet,
  getBalance,
  getTransactions,
  sendTransaction,
  approveTransaction,
  denyTransaction,
  setPolicy,
  CreateWalletSchema,
  SetPolicySchema,
  SendTransactionSchema,
} from "../services/nunchuk.js";
import { broadcast } from "../utils/broadcast.js";
import type { ApiResponse, WalletInfo, WalletPolicy, Transaction } from "../utils/types.js";

const WalletIdParam = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/);

export const walletRoutes = new Hono();

// POST /api/wallet/create
walletRoutes.post(
  "/create",
  zValidator("json", CreateWalletSchema),
  async (c) => {
    const { name, requiredApprovals } = c.req.valid("json");
    const wallet = await createWallet(name, requiredApprovals);

    const response: ApiResponse<WalletInfo> = { success: true, data: wallet };
    return c.json(response, 201);
  }
);

// POST /api/wallet/set-policy
walletRoutes.post(
  "/set-policy",
  zValidator("json", SetPolicySchema),
  async (c) => {
    const { walletId, dailyLimit, perTransactionLimit, whitelistedAddresses } =
      c.req.valid("json");

    const policy = await setPolicy(walletId, {
      dailyLimit,
      perTransactionLimit,
      whitelistedAddresses,
    });

    const response: ApiResponse<WalletPolicy> = { success: true, data: policy };
    return c.json(response);
  }
);

// POST /api/wallet/send
walletRoutes.post(
  "/send",
  zValidator("json", SendTransactionSchema),
  async (c) => {
    const { walletId, toAddress, amount, memo } = c.req.valid("json");
    const tx = await sendTransaction(walletId, toAddress, amount, memo);
    broadcast("transaction:pending", tx);

    const response: ApiResponse<Transaction> = { success: true, data: tx };
    return c.json(response, 201);
  }
);

// POST /api/wallet/approve/:txId
walletRoutes.post("/approve/:txId", async (c) => {
  const txId = c.req.param("txId");
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(txId)) {
    return c.json({ success: false, error: "Invalid transaction ID" }, 400);
  }
  const tx = await approveTransaction(txId);
  broadcast("transaction:approved", tx);

  const response: ApiResponse<Transaction> = { success: true, data: tx };
  return c.json(response);
});

// POST /api/wallet/deny/:txId
walletRoutes.post("/deny/:txId", async (c) => {
  const txId = c.req.param("txId");
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(txId)) {
    return c.json({ success: false, error: "Invalid transaction ID" }, 400);
  }
  const tx = await denyTransaction(txId);
  broadcast("transaction:denied", tx);

  const response: ApiResponse<Transaction> = { success: true, data: tx };
  return c.json(response);
});

// GET /api/wallet/balance
walletRoutes.get("/balance", async (c) => {
  const walletId = c.req.query("walletId");
  const parsed = WalletIdParam.safeParse(walletId);
  if (!parsed.success) {
    return c.json({ success: false, error: "Valid walletId query param required" }, 400);
  }

  const balance = await getBalance(parsed.data);
  const response: ApiResponse<{ balance: number; walletId: string }> = {
    success: true,
    data: { balance, walletId: parsed.data },
  };
  return c.json(response);
});

// GET /api/wallet/transactions
walletRoutes.get("/transactions", async (c) => {
  const walletId = c.req.query("walletId");
  const parsed = WalletIdParam.safeParse(walletId);
  if (!parsed.success) {
    return c.json({ success: false, error: "Valid walletId query param required" }, 400);
  }

  const transactions = await getTransactions(parsed.data);
  const response: ApiResponse<Transaction[]> = {
    success: true,
    data: transactions,
  };
  return c.json(response);
});
