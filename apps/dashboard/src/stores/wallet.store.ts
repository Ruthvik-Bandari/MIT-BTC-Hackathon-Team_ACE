import { create } from "zustand";
import type { WalletInfo, Transaction } from "@/lib/types";

// Default demo wallet so the UI always has data to display
const DEMO_WALLET: WalletInfo = {
  id: "twvucjgm",
  name: "BitShield Demo Wallet",
  balance: 350_000,
  policy: {
    dailyLimit: 500_000,
    perTransactionLimit: 100_000,
    requiredApprovals: 2,
    whitelistedAddresses: [],
  },
  addresses: [
    { address: "n1C8nsmi4sc4hjBfGf56A1dnVMjxnYSQqk", type: "P2PKH", balance: 120_000, spent: true },
    { address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", type: "P2WPKH", balance: 80_000, spent: true },
    { address: "tb1qrp33g0q5b5698ahp5jnf0y5emnv573xahm9wr0", type: "P2WPKH", balance: 100_000, spent: false },
    { address: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn", type: "P2PKH", balance: 50_000, spent: false },
  ],
};

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
  activeWallet: DEMO_WALLET,
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
