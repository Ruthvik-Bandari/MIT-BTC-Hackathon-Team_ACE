"use client";

import Link from "next/link";
import { Shield, Zap, ScanLine, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { Tilt, TiltContent } from "@/components/animate-ui/primitives/effects/tilt";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { CryptoIconsBackground } from "@/components/ui/crypto-icons-bg";

const features = [
  {
    icon: Shield,
    title: "AI Guardian",
    description:
      "Natural language interface to manage wallets, approve transactions, and assess quantum risk.",
    href: "/guardian",
    color: "text-orange-400/80",
    bgColor: "bg-orange-500/8",
    ringColor: "ring-orange-500/10",
  },
  {
    icon: ScanLine,
    title: "Quantum Scanner",
    description:
      "Scan Bitcoin addresses for quantum vulnerability. Detect exposed public keys proactively.",
    href: "/scanner",
    color: "text-amber-400/80",
    bgColor: "bg-amber-500/8",
    ringColor: "ring-amber-500/10",
  },
  {
    icon: Wallet,
    title: "Smart Wallet",
    description:
      "Nunchuk-powered group wallet with AI-enforced spending policies and multi-sig approvals.",
    href: "/guardian",
    color: "text-blue-400/80",
    bgColor: "bg-blue-500/8",
    ringColor: "ring-blue-500/10",
  },
  {
    icon: Zap,
    title: "Lightning Payments",
    description:
      "Instant Bitcoin payments via Alby NWC. Pay Lightning invoices directly from the dashboard.",
    href: "/guardian",
    color: "text-emerald-400/80",
    bgColor: "bg-emerald-500/8",
    ringColor: "ring-emerald-500/10",
  },
];

export default function DashboardPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <CryptoIconsBackground className="-z-10" count={30} />

      <div className="mx-auto max-w-7xl px-6 py-20">
        <Fade inView inViewOnce>
          <div className="mb-20 text-center">
            <h1 className="text-5xl font-bold tracking-[-0.03em]">
              <GradientText
                text="SatsGuard"
                gradient="linear-gradient(90deg, #f97316 0%, #eab308 35%, #f97316 65%, #ef4444 100%)"
              />
            </h1>
            <Slide direction="up" delay={0.2}>
              <p className="mt-5 text-lg font-normal tracking-[-0.01em] text-muted-foreground/70">
                AI-powered Bitcoin guardian with quantum defense
              </p>
            </Slide>
            <Slide direction="up" delay={0.4}>
              <div className="mt-4 flex justify-center gap-1.5 text-[11px] text-muted-foreground/40">
                <span className="rounded-full bg-muted/40 px-2.5 py-1 ring-1 ring-border/30">
                  MIT Bitcoin Hackathon 2026
                </span>
                <span className="rounded-full bg-muted/40 px-2.5 py-1 ring-1 ring-border/30">
                  Team ACE
                </span>
                <span className="rounded-full bg-muted/40 px-2.5 py-1 ring-1 ring-border/30">
                  Signet Network
                </span>
              </div>
            </Slide>
          </div>
        </Fade>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Slide key={feature.title} direction="up" delay={0.1 * (i + 1)}>
                <Link href={feature.href} className="block h-full">
                  <Tilt maxTilt={6} perspective={1200}>
                    <TiltContent>
                      <Card className="h-full transition-all duration-300 hover:ring-white/12">
                        <CardHeader>
                          <div className={`flex size-9 items-center justify-center rounded-xl ${feature.bgColor} ring-1 ${feature.ringColor}`}>
                            <Icon className={`size-4.5 ${feature.color}`} />
                          </div>
                          <CardTitle className="mt-3">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{feature.description}</CardDescription>
                        </CardContent>
                      </Card>
                    </TiltContent>
                  </Tilt>
                </Link>
              </Slide>
            );
          })}
        </div>

        <Fade inView inViewOnce delay={0.6}>
          <Card className="mt-20 text-center">
            <CardContent className="py-8">
              <p className="text-[13px] leading-relaxed text-muted-foreground/60">
                <span className="text-foreground/80 font-medium tabular-nums">
                  <CountingNumber number={6.9} decimalPlaces={1} inView inViewOnce />M
                </span>
                {" "}BTC have exposed public keys vulnerable to quantum attack.
                <br />
                Google Quantum AI estimates {"<"}500K qubits can break secp256k1 in{" "}
                <span className="text-foreground/80 font-medium tabular-nums">
                  ~<CountingNumber number={9} inView inViewOnce /> min
                </span>.
              </p>
            </CardContent>
          </Card>
        </Fade>
      </div>
    </div>
  );
}
