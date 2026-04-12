"use client";

import { useState, useEffect } from "react";
import { Timer, ShieldAlert, AlertTriangle, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QUANTUM_STATS } from "@/lib/constants";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

export function QuantumTimer() {
  const totalSeconds = QUANTUM_STATS.estimatedBreakTimeMins * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const breached = elapsed >= totalSeconds && !running && elapsed > 0;

  useEffect(() => {
    if (!running) return;
    if (elapsed >= totalSeconds) {
      setRunning(false);
      return;
    }

    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [running, elapsed, totalSeconds]);

  const remaining = Math.max(0, totalSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = (elapsed / totalSeconds) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quantum Attack Countdown</CardTitle>
        <CardDescription>
          {QUANTUM_STATS.estimatedBreakTimeMins} min to break secp256k1 with &lt;{(QUANTUM_STATS.qubitsRequired / 1000).toFixed(0)}K qubits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-mono font-bold flex items-center justify-center gap-1 ${breached ? "text-red-500" : "text-foreground"}`}>
            <SlidingNumber number={minutes} padStart />
            <span>:</span>
            <SlidingNumber number={seconds} padStart />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {running
              ? "Simulating quantum attack..."
              : breached
                ? "Private key compromised"
                : "Ready to simulate"}
          </p>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${breached ? "bg-red-500" : "bg-linear-to-r from-green-500 via-yellow-500 to-red-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {breached && (
          <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-400">
              <ShieldAlert className="size-4" />
              Simulation Complete — Key Extracted
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-400/70" />
                <p>
                  A quantum computer with &lt;{(QUANTUM_STATS.qubitsRequired / 1000).toFixed(0)}K qubits
                  extracted the private key from an exposed public key in{" "}
                  <span className="font-medium text-foreground">{QUANTUM_STATS.estimatedBreakTimeMins} minutes</span>.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400/70" />
                <p>
                  <span className="font-medium text-foreground">6.9M BTC</span> (~$690B) currently have
                  exposed public keys and are vulnerable to this attack.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-green-400/70" />
                <p>
                  <span className="font-medium text-foreground">Mitigation:</span> Move funds to fresh,
                  unspent P2WPKH addresses. Never reuse addresses. Consider BIP-360 (P2QRH)
                  post-quantum addresses when available.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Shine enableOnHover>
            <Button
              variant="outline"
              onClick={() => {
                if (running || breached) {
                  setRunning(false);
                  setElapsed(0);
                } else {
                  setElapsed(0);
                  setRunning(true);
                }
              }}
            >
              <Timer className="size-4" />
              {running ? "Reset" : breached ? "Run Again" : "Start Simulation"}
            </Button>
          </Shine>
        </div>
      </CardContent>
    </Card>
  );
}
