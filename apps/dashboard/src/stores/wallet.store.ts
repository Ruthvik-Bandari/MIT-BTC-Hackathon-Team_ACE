import { create } from "zustand";
import type { WalletInfo, Transaction } from "@/lib/types";

interface WalletState {
  activeWallet: WalletInfo | null;
  pendingTransactions: Transaction[];
  setActiveWallet: (wallet: WalletInfo | null) => void;
  addPendingTransaction: (tx: Transaction) => void;
  updateTransaction: (txId: string, updates: Partial<Transaction>) => void;
  removePendingTransaction: (txId: string) => void;
  clearPending: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  activeWallet: null,
  pendingTransactions: [],

  setActiveWallet: (activeWallet) => set({ activeWallet }),

  addPendingTransaction: (tx) =>
    set((state) => ({
      pendingTransactions: [...state.pendingTransactions, tx],
    })),

  updateTransaction: (txId, updates) =>
    set((state) => ({
      pendingTransactions: state.pendingTransactions.map((tx) =>
        tx.id === txId ? { ...tx, ...updates } : tx
      ),
    })),

  removePendingTransaction: (txId) =>
    set((state) => ({
      pendingTransactions: state.pendingTransactions.filter(
        (tx) => tx.id !== txId
      ),
    })),

  clearPending: () => set({ pendingTransactions: [] }),
}));
