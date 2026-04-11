"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as lightningDal from "@/dal/lightning.dal";

export function useLightningBalance() {
  return useQuery({
    queryKey: ["lightning", "balance"],
    queryFn: lightningDal.getBalance,
    staleTime: 30_000,
  });
}

export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoice: string) => lightningDal.payInvoice(invoice),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lightning"] });
    },
  });
}
