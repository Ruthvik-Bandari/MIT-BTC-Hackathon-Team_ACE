"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QUANTUM_STATS } from "@/lib/constants";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";

export function QuantumTimer() {
  const totalSeconds = QUANTUM_STATS.estimatedBreakTimeMins * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

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
          <div className="text-4xl font-mono font-bold text-foreground flex items-center justify-center gap-1">
            <SlidingNumber number={minutes} padStart />
            <span>:</span>
            <SlidingNumber number={seconds} padStart />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {running ? "Simulating quantum attack..." : "Ready to simulate"}
          </p>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-center">
          <Shine enableOnHover>
            <Button
              variant="outline"
              onClick={() => {
                if (running) {
                  setRunning(false);
                  setElapsed(0);
                } else {
                  setElapsed(0);
                  setRunning(true);
                }
              }}
            >
              <Timer className="size-4" />
              {running ? "Reset" : "Start Simulation"}
            </Button>
          </Shine>
        </div>
      </CardContent>
    </Card>
  );
}
