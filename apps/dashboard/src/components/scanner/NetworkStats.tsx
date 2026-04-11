import { Globe, AlertTriangle, Cpu, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { QUANTUM_STATS } from "@/lib/constants";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";

const stats = [
  {
    label: "Exposed BTC",
    value: QUANTUM_STATS.exposedBtc / 1_000_000,
    suffix: "M",
    decimals: 1,
    icon: Globe,
    color: "text-red-400",
  },
  {
    label: "P2PK Outputs",
    value: QUANTUM_STATS.p2pkOutputs / 1_000_000,
    suffix: "M",
    decimals: 1,
    icon: AlertTriangle,
    color: "text-orange-400",
  },
  {
    label: "Qubits Needed",
    value: QUANTUM_STATS.qubitsRequired / 1000,
    suffix: "K",
    decimals: 0,
    icon: Cpu,
    color: "text-yellow-400",
    prefix: "<",
  },
  {
    label: "Break Time",
    value: QUANTUM_STATS.estimatedBreakTimeMins,
    suffix: " min",
    decimals: 0,
    icon: Clock,
    color: "text-green-400",
    prefix: "~",
  },
];

export function NetworkStats() {
  return (
    <Fade inView inViewOnce>
      <Card>
        <CardHeader>
          <CardTitle>Network Vulnerability</CardTitle>
          <CardDescription>Google Quantum AI whitepaper — March 30, 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center space-y-1">
                  <Icon className={`mx-auto size-5 ${stat.color}`} />
                  <p className="text-xl font-bold text-foreground">
                    {stat.prefix}
                    <CountingNumber
                      number={stat.value}
                      decimalPlaces={stat.decimals}
                      inView
                      inViewOnce
                    />
                    {stat.suffix}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Fade>
  );
}
