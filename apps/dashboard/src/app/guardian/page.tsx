"use client";

import { GuardianChat } from "@/components/guardian/GuardianChat";
import { WalletOverview } from "@/components/wallet/WalletOverview";
import { PolicyEditor } from "@/components/wallet/PolicyEditor";
import { TransactionList } from "@/components/wallet/TransactionList";
import { PaymentDemo } from "@/components/lightning/PaymentDemo";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Card } from "@/components/ui/card";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";

export default function GuardianPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Slide direction="left">
          <ErrorBoundary fallbackTitle="Guardian chat failed to load">
            <Card className="min-h-150">
              <GuardianChat />
            </Card>
          </ErrorBoundary>
        </Slide>

        <Fade inView inViewOnce>
          <div className="space-y-6">
            <ErrorBoundary fallbackTitle="Wallet overview failed">
              <WalletOverview />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Transaction list failed">
              <TransactionList />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Policy editor failed">
              <PolicyEditor />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Lightning payment failed">
              <PaymentDemo />
            </ErrorBoundary>
          </div>
        </Fade>
      </div>
    </div>
  );
}
