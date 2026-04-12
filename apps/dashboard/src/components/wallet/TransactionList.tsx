"use client";

import { ArrowUpRight, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWalletTransactions, useApproveTransaction, useDenyTransaction } from "@/hooks/useWallet";
import { useWalletStore } from "@/stores/wallet.store";
import { formatSats, truncateAddress, formatRelativeTime } from "@/lib/formatters";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import type { Transaction, TransactionStatus } from "@/lib/types";

const statusConfig: Record<
  TransactionStatus,
  { icon: typeof Clock; variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  pending: { icon: Clock, variant: "outline", label: "Pending" },
  approved: { icon: CheckCircle, variant: "secondary", label: "Approved" },
  executed: { icon: CheckCircle, variant: "default", label: "Executed" },
  denied: { icon: XCircle, variant: "destructive", label: "Denied" },
  failed: { icon: AlertTriangle, variant: "destructive", label: "Failed" },
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const approve = useApproveTransaction();
  const deny = useDenyTransaction();
  const config = statusConfig[tx.status];
  const StatusIcon = config.icon;

  return (
    <Slide direction="left" delay={0.05}>
      <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
        <div className="flex items-center gap-3">
          <ArrowUpRight className="size-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-foreground">{formatSats(tx.amount)} sats</p>
            <p className="text-xs text-muted-foreground">to {truncateAddress(tx.toAddress)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={config.variant}>
            <StatusIcon className="size-3" />
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(tx.createdAt)}</span>
          {tx.status === "pending" && (
            <div className="flex gap-1">
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => approve.mutate(tx.id)}
                disabled={approve.isPending}
              >
                <CheckCircle className="size-3.5 text-green-400" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => deny.mutate(tx.id)}
                disabled={deny.isPending}
              >
                <XCircle className="size-3.5 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Slide>
  );
}

export function TransactionList() {
  const activeWallet = useWalletStore((s) => s.activeWallet);
  const { data: transactions, isLoading, error } = useWalletTransactions(activeWallet?.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Recent activity</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground py-4">No transactions yet</p>
        ) : !transactions?.length ? (
          <p className="text-sm text-muted-foreground py-4">No transactions yet</p>
        ) : (
          <div>
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
