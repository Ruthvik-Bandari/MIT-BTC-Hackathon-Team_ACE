"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { QuantumRiskMeter } from "@/components/scanner/QuantumRiskMeter";
import { AddressCard } from "@/components/scanner/AddressCard";
import { QuantumTimer } from "@/components/scanner/QuantumTimer";
import { NetworkStats } from "@/components/scanner/NetworkStats";
import { useScanAddress, useScanWallet } from "@/hooks/useQuantumScan";
import { useWalletStore } from "@/stores/wallet.store";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { RippleButton } from "@/components/animate-ui/primitives/buttons/ripple";

export default function ScannerPage() {
  const [address, setAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState<string | undefined>();
  const activeWallet = useWalletStore((s) => s.activeWallet);

  const { data: singleScan, isLoading: singleLoading } = useScanAddress(
    searchAddress,
    false
  );

  const walletScan = useScanWallet();

  function handleScanAddress() {
    if (address.trim()) {
      setSearchAddress(address.trim());
    }
  }

  function handleScanWallet() {
    if (activeWallet?.addresses.length) {
      walletScan.mutate(activeWallet.addresses);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <Slide direction="down">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="scan-address" className="text-sm font-medium text-foreground">
              Scan Bitcoin Address
            </label>
            <Input
              id="scan-address"
              placeholder="bc1q... / 1A1z... / 3J98..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <RippleButton onClick={handleScanAddress} disabled={singleLoading}>
              {singleLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search className="size-4" />
              )}
              Scan Address
            </RippleButton>
            {activeWallet && (
              <Button
                variant="secondary"
                onClick={handleScanWallet}
                disabled={walletScan.isPending}
              >
                {walletScan.isPending && (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                Scan Wallet
              </Button>
            )}
          </div>
        </div>
      </Slide>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ErrorBoundary fallbackTitle="Risk meter failed">
            <QuantumRiskMeter
              result={walletScan.data}
              isLoading={walletScan.isPending}
            />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="Network stats failed">
            <NetworkStats />
          </ErrorBoundary>
        </div>
        <div className="space-y-6">
          <ErrorBoundary fallbackTitle="Quantum timer failed">
            <QuantumTimer />
          </ErrorBoundary>
          {singleScan && (
            <ErrorBoundary fallbackTitle="Address card failed">
              <AddressCard assessment={singleScan} />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
}
