import { Hono } from "hono";
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
import { broadcast } from "../index.js";
import type { ApiResponse, WalletInfo, WalletPolicy, Transaction } from "../utils/types.js";

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
  const tx = await approveTransaction(txId);
  broadcast("transaction:approved", tx);

  const response: ApiResponse<Transaction> = { success: true, data: tx };
  return c.json(response);
});

// POST /api/wallet/deny/:txId
walletRoutes.post("/deny/:txId", async (c) => {
  const txId = c.req.param("txId");
  const tx = await denyTransaction(txId);
  broadcast("transaction:denied", tx);

  const response: ApiResponse<Transaction> = { success: true, data: tx };
  return c.json(response);
});

// GET /api/wallet/balance
walletRoutes.get("/balance", async (c) => {
  const walletId = c.req.query("walletId");
  if (!walletId) {
    return c.json({ success: false, error: "walletId query param required" }, 400);
  }

  const balance = await getBalance(walletId);
  const response: ApiResponse<{ balance: number; walletId: string }> = {
    success: true,
    data: { balance, walletId },
  };
  return c.json(response);
});

// GET /api/wallet/transactions
walletRoutes.get("/transactions", async (c) => {
  const walletId = c.req.query("walletId");
  if (!walletId) {
    return c.json({ success: false, error: "walletId query param required" }, 400);
  }

  const transactions = await getTransactions(walletId);
  const response: ApiResponse<Transaction[]> = {
    success: true,
    data: transactions,
  };
  return c.json(response);
});
