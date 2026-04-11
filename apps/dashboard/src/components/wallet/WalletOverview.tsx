"use client";

import { Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useWalletStore } from "@/stores/wallet.store";
import { useWalletBalance } from "@/hooks/useWallet";
import { formatBtc, formatSats } from "@/lib/formatters";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";

export function WalletOverview() {
  const activeWallet = useWalletStore((s) => s.activeWallet);
  const { data, isLoading } = useWalletBalance(activeWallet?.id);

  if (!activeWallet) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Wallet className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No wallet connected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const balance = data?.balance ?? activeWallet.balance;

  return (
    <Fade inView inViewOnce>
      <Card>
        <CardHeader>
          <CardTitle>{activeWallet.name}</CardTitle>
          <CardDescription>
            Policy: {activeWallet.policy.requiredApprovals} approvals required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            {isLoading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {formatBtc(balance)}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <SlidingNumber number={balance} /> sats
                </p>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Daily limit</p>
              <p className="text-foreground">
                {formatSats(activeWallet.policy.dailyLimit)} sats
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Per-tx limit</p>
              <p className="text-foreground">
                {formatSats(activeWallet.policy.perTransactionLimit)} sats
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Fade>
  );
}
