import { xiorInstance } from "@/lib/xior";
import type {
  ApiResponse,
  WalletInfo,
  WalletPolicy,
  Transaction,
} from "@/lib/types";

export async function createWallet(
  name: string,
  requiredApprovals: number
): Promise<WalletInfo> {
  const { data } = await xiorInstance.post<ApiResponse<WalletInfo>>(
    "/api/wallet/create",
    { name, requiredApprovals }
  );
  return data.data;
}

export async function setPolicy(
  walletId: string,
  dailyLimit: number,
  perTransactionLimit: number,
  whitelistedAddresses: string[] = []
): Promise<WalletPolicy> {
  const { data } = await xiorInstance.post<ApiResponse<WalletPolicy>>(
    "/api/wallet/set-policy",
    { walletId, dailyLimit, perTransactionLimit, whitelistedAddresses }
  );
  return data.data;
}

export async function sendTransaction(
  walletId: string,
  toAddress: string,
  amount: number,
  memo?: string
): Promise<Transaction> {
  const { data } = await xiorInstance.post<ApiResponse<Transaction>>(
    "/api/wallet/send",
    { walletId, toAddress, amount, memo }
  );
  return data.data;
}

export async function approveTransaction(
  txId: string
): Promise<Transaction> {
  const { data } = await xiorInstance.post<ApiResponse<Transaction>>(
    `/api/wallet/approve/${txId}`
  );
  return data.data;
}

export async function denyTransaction(txId: string): Promise<Transaction> {
  const { data } = await xiorInstance.post<ApiResponse<Transaction>>(
    `/api/wallet/deny/${txId}`
  );
  return data.data;
}

export async function getBalance(
  walletId: string
): Promise<{ balance: number; walletId: string }> {
  const { data } = await xiorInstance.get<
    ApiResponse<{ balance: number; walletId: string }>
  >("/api/wallet/balance", { params: { walletId } });
  return data.data;
}

export async function getTransactions(
  walletId: string
): Promise<Transaction[]> {
  const { data } = await xiorInstance.get<ApiResponse<Transaction[]>>(
    "/api/wallet/transactions",
    { params: { walletId } }
  );
  return data.data;
}
