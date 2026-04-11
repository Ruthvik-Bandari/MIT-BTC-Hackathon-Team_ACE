"use client";

import Link from "next/link";
import { Shield, Zap, ScanLine, Wallet } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GradientText } from "@/components/animate-ui/primitives/texts/gradient";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { Tilt, TiltContent } from "@/components/animate-ui/primitives/effects/tilt";
import { Shine } from "@/components/animate-ui/primitives/effects/shine";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";
import { CryptoIconsBackground } from "@/components/ui/crypto-icons-bg";

const features = [
  {
    icon: Shield,
    title: "AI Guardian",
    description:
      "Natural language interface to manage wallets, approve transactions, and get quantum risk assessments.",
    href: "/guardian",
    color: "text-orange-400",
  },
  {
    icon: ScanLine,
    title: "Quantum Scanner",
    description:
      "Scan Bitcoin addresses for quantum vulnerability. Detect exposed public keys before quantum computers do.",
    href: "/scanner",
    color: "text-yellow-400",
  },
  {
    icon: Wallet,
    title: "Smart Wallet",
    description:
      "Nunchuk-powered group wallet with AI-enforced spending policies and multi-sig approval flows.",
    href: "/guardian",
    color: "text-blue-400",
  },
  {
    icon: Zap,
    title: "Lightning Payments",
    description:
      "Instant Bitcoin payments via Alby NWC. Pay Lightning invoices directly from the dashboard.",
    href: "/guardian",
    color: "text-amber-400",
  },
];

export default function DashboardPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      <CryptoIconsBackground className="-z-10" count={35} />

      <div className="mx-auto max-w-7xl px-4 py-16">
        <Fade inView inViewOnce>
          <div className="mb-16 text-center">
            <h1 className="text-5xl font-bold tracking-tight">
              <GradientText
                text="SatsGuard"
                gradient="linear-gradient(90deg, #f97316 0%, #eab308 30%, #f97316 60%, #ef4444 100%)"
              />
            </h1>
            <Slide direction="up" delay={0.2}>
              <p className="mt-4 text-lg text-muted-foreground">
                AI-powered Bitcoin guardian with quantum defense
              </p>
            </Slide>
            <Slide direction="up" delay={0.4}>
              <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
                <span>MIT Bitcoin Hackathon 2026</span>
                <span>Team ACE</span>
                <span>Signet Network</span>
              </div>
            </Slide>
          </div>
        </Fade>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Slide key={feature.title} direction="up" delay={0.1 * (i + 1)}>
                <Link href={feature.href} className="block h-full">
                  <Tilt maxTilt={8} perspective={1000}>
                    <TiltContent>
                      <Shine enableOnHover color="rgba(249,115,22,0.15)">
                        <Card className="h-full transition-colors hover:bg-card/80">
                          <CardHeader>
                            <Icon className={`size-8 ${feature.color}`} />
                            <CardTitle className="mt-2">{feature.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>{feature.description}</CardDescription>
                          </CardContent>
                        </Card>
                      </Shine>
                    </TiltContent>
                  </Tilt>
                </Link>
              </Slide>
            );
          })}
        </div>

        <Fade inView inViewOnce delay={0.6}>
          <Card className="mt-16 text-center">
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">
                <CountingNumber number={6.9} decimalPlaces={1} inView inViewOnce /> million BTC have exposed public keys vulnerable to quantum attack.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Google Quantum AI estimates {"<"}500K qubits can break secp256k1 in ~
                <CountingNumber number={9} inView inViewOnce /> minutes.
              </p>
            </CardContent>
          </Card>
        </Fade>
      </div>
    </div>
  );
}
