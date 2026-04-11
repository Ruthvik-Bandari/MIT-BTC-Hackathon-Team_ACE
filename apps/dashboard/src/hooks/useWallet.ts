"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as walletDal from "@/dal/wallet.dal";
import { useWalletStore } from "@/stores/wallet.store";

export function useWalletBalance(walletId: string | undefined) {
  return useQuery({
    queryKey: ["wallet", "balance", walletId],
    queryFn: () => walletDal.getBalance(walletId!),
    enabled: !!walletId,
    staleTime: 15_000,
  });
}

export function useWalletTransactions(walletId: string | undefined) {
  return useQuery({
    queryKey: ["wallet", "transactions", walletId],
    queryFn: () => walletDal.getTransactions(walletId!),
    enabled: !!walletId,
    staleTime: 10_000,
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  const { setActiveWallet } = useWalletStore();

  return useMutation({
    mutationFn: ({ name, requiredApprovals }: { name: string; requiredApprovals: number }) =>
      walletDal.createWallet(name, requiredApprovals),
    onSuccess: (wallet) => {
      setActiveWallet(wallet);
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useSendTransaction() {
  const queryClient = useQueryClient();
  const { addPendingTransaction } = useWalletStore();

  return useMutation({
    mutationFn: ({
      walletId,
      toAddress,
      amount,
      memo,
    }: {
      walletId: string;
      toAddress: string;
      amount: number;
      memo?: string;
    }) => walletDal.sendTransaction(walletId, toAddress, amount, memo),
    onSuccess: (tx) => {
      addPendingTransaction(tx);
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useSetPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletId,
      dailyLimit,
      perTransactionLimit,
      whitelistedAddresses,
    }: {
      walletId: string;
      dailyLimit: number;
      perTransactionLimit: number;
      whitelistedAddresses?: string[];
    }) =>
      walletDal.setPolicy(
        walletId,
        dailyLimit,
        perTransactionLimit,
        whitelistedAddresses
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useApproveTransaction() {
  const queryClient = useQueryClient();
  const { updateTransaction } = useWalletStore();

  return useMutation({
    mutationFn: (txId: string) => walletDal.approveTransaction(txId),
    onSuccess: (tx) => {
      updateTransaction(tx.id, { status: tx.status });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useDenyTransaction() {
  const queryClient = useQueryClient();
  const { updateTransaction } = useWalletStore();

  return useMutation({
    mutationFn: (txId: string) => walletDal.denyTransaction(txId),
    onSuccess: (tx) => {
      updateTransaction(tx.id, { status: "denied" });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
