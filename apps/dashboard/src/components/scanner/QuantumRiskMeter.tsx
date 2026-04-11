"use client";

import { ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import type { WalletScanResult, RiskLevel } from "@/lib/types";

interface QuantumRiskMeterProps {
  result: WalletScanResult | undefined;
  isLoading: boolean;
}

const riskVariant: Record<RiskLevel, "destructive" | "outline" | "secondary" | "default"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "outline",
  LOW: "default",
};

export function QuantumRiskMeter({ result, isLoading }: QuantumRiskMeterProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quantum Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Run a scan to see risk assessment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = result.totalAddresses;

  return (
    <Fade inView inViewOnce>
      <Card>
        <CardHeader>
          <CardTitle>Quantum Risk Assessment</CardTitle>
          <CardDescription>
            {total} address{total !== 1 ? "es" : ""} scanned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <RiskCount label="Critical" count={result.critical} />
            <RiskCount label="High" count={result.high} />
            <RiskCount label="Medium" count={result.medium} />
            <RiskCount label="Low" count={result.low} />
          </div>
          {result.assessments.length > 0 && (
            <div className="space-y-2">
              {result.assessments.map((a) => (
                <div
                  key={a.address}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-50">
                    {a.address}
                  </span>
                  <Badge variant={riskVariant[a.riskLevel]}>
                    {a.riskLevel}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
}

function RiskCount({ label, count }: { label: string; count: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-foreground">
        <CountingNumber number={count} inView inViewOnce />
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
