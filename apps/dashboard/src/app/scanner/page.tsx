"use client";

import { useState } from "react";
import { Search, ScanLine, AlertCircle, XCircle } from "lucide-react";
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

export default function ScannerPage() {
  const [address, setAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState<string | undefined>();
  const activeWallet = useWalletStore((s) => s.activeWallet);

  const {
    data: singleScan,
    isLoading: singleLoading,
    error: singleError,
  } = useScanAddress(searchAddress);

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
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
      <Slide direction="down">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              id="scan-address"
              placeholder="Enter a Bitcoin address to scan... (bc1q... / tb1q... / 1A1z...)"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                // Clear previous error when user types a new address
                if (singleError && searchAddress) setSearchAddress(undefined);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleScanAddress()}
              className="h-10"
              aria-invalid={!!singleError}
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              onClick={handleScanAddress}
              disabled={singleLoading || !address.trim()}
              size="lg"
            >
              {singleLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Search className="size-4" />
              )}
              Scan Address
            </Button>
            {activeWallet && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleScanWallet}
                disabled={walletScan.isPending}
              >
                {walletScan.isPending ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ScanLine className="size-4" />
                )}
                Scan Wallet
              </Button>
            )}
          </div>
        </div>

        {singleError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{singleError.message}</span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setSearchAddress(undefined)}
              className="ml-auto rounded p-0.5 hover:bg-destructive/10"
            >
              <XCircle className="size-3.5" />
            </button>
          </div>
        )}

        {walletScan.isError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>Wallet scan failed: {walletScan.error.message}</span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => walletScan.reset()}
              className="ml-auto rounded p-0.5 hover:bg-destructive/10"
            >
              <XCircle className="size-3.5" />
            </button>
          </div>
        )}
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
