"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap, CheckCircle, XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLightningBalance, usePayInvoice } from "@/hooks/useLightning";
import { payLightningSchema, type PayLightningInput } from "@/schemas/transaction.schema";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";

export function PaymentDemo() {
  const { data: balance, isLoading: balanceLoading } = useLightningBalance();
  const payInvoice = usePayInvoice();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayLightningInput>({
    resolver: zodResolver(payLightningSchema),
  });

  function onSubmit(data: PayLightningInput) {
    payInvoice.mutate(data.invoice, {
      onSuccess: () => reset(),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lightning Payment</CardTitle>
        <CardDescription>Pay a Lightning invoice via Alby NWC</CardDescription>
        <CardAction>
          <div className="flex items-center gap-1.5">
            <Zap className="size-4 text-amber-400" />
            {balanceLoading ? (
              <span className="h-4 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <SlidingNumber number={balance?.balance ?? 0} /> sats
              </span>
            )}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="invoice" className="text-sm font-medium text-foreground">
              Lightning Invoice
            </label>
            <Input
              id="invoice"
              placeholder="lnbc..."
              aria-invalid={!!errors.invoice}
              {...register("invoice")}
            />
            {errors.invoice && (
              <p className="text-xs text-destructive">{errors.invoice.message}</p>
            )}
          </div>
          <Shine enableOnHover>
            <Button type="submit" disabled={payInvoice.isPending}>
              {payInvoice.isPending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Zap className="size-4" />
              )}
              Pay Invoice
            </Button>
          </Shine>
        </form>

        {payInvoice.isSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">
            <CheckCircle className="size-4" />
            Payment settled successfully
          </div>
        )}

        {payInvoice.isError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <XCircle className="size-4" />
            {payInvoice.error.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
