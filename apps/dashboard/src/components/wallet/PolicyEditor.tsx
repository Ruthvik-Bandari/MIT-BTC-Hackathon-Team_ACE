"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetPolicy } from "@/hooks/useWallet";
import { useWalletStore } from "@/stores/wallet.store";
import { setPolicySchema, type SetPolicyInput, type SetPolicyOutput } from "@/schemas/wallet.schema";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";

export function PolicyEditor() {
  const activeWallet = useWalletStore((s) => s.activeWallet);
  const setPolicy = useSetPolicy();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPolicyInput, unknown, SetPolicyOutput>({
    resolver: zodResolver(setPolicySchema),
    defaultValues: {
      walletId: activeWallet?.id ?? "",
      dailyLimit: activeWallet?.policy.dailyLimit ?? 1_000_000,
      perTransactionLimit:
        activeWallet?.policy.perTransactionLimit ?? 500_000,
      whitelistedAddresses: [],
    },
  });

  function onSubmit(data: SetPolicyOutput) {
    setPolicy.mutate(data);
  }

  if (!activeWallet) return null;

  return (
    <Fade inView inViewOnce>
      <Card>
        <CardHeader>
          <CardTitle>Policy Settings</CardTitle>
          <CardDescription>Configure spending limits and whitelisted addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("walletId")} />
            <div className="space-y-1.5">
              <label htmlFor="dailyLimit" className="text-sm font-medium text-foreground">
                Daily limit (sats)
              </label>
              <Input
                id="dailyLimit"
                type="number"
                aria-invalid={!!errors.dailyLimit}
                {...register("dailyLimit", { valueAsNumber: true })}
              />
              {errors.dailyLimit && (
                <p className="text-xs text-destructive">{errors.dailyLimit.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="perTransactionLimit" className="text-sm font-medium text-foreground">
                Per-transaction limit (sats)
              </label>
              <Input
                id="perTransactionLimit"
                type="number"
                aria-invalid={!!errors.perTransactionLimit}
                {...register("perTransactionLimit", { valueAsNumber: true })}
              />
              {errors.perTransactionLimit && (
                <p className="text-xs text-destructive">{errors.perTransactionLimit.message}</p>
              )}
            </div>
            <Button type="submit" disabled={setPolicy.isPending}>
              {setPolicy.isPending && (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Update Policy
            </Button>

            {setPolicy.isSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
                <CheckCircle className="size-4" />
                Policy updated successfully
              </div>
            )}

            {setPolicy.isError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <XCircle className="size-4" />
                {setPolicy.error.message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </Fade>
  );
}
