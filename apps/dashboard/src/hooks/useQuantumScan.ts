"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import * as scannerDal from "@/dal/scanner.dal";
import type { WalletAddress } from "@/lib/types";

export function useScanAddress(address: string | undefined, spent: boolean) {
  return useQuery({
    queryKey: ["scanner", "address", address, spent],
    queryFn: () => scannerDal.scanAddress(address!, spent),
    enabled: !!address,
    staleTime: 60_000,
  });
}

export function useScanWallet() {
  return useMutation({
    mutationFn: (addresses: WalletAddress[]) =>
      scannerDal.scanWallet(addresses),
  });
}

export function useNetworkStats() {
  return useQuery({
    queryKey: ["scanner", "network-stats"],
    queryFn: scannerDal.getNetworkStats,
    staleTime: 5 * 60_000,
  });
}
