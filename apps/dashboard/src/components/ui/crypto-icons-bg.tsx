"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Bitcoin,
  Shield,
  Zap,
  Lock,
  KeyRound,
  Blocks,
  Cpu,
  Fingerprint,
  CircleDollarSign,
  Wallet,
  ArrowLeftRight,
  Hash,
  Link,
  Database,
  ShieldCheck,
  Binary,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = [
  Bitcoin,
  Shield,
  Zap,
  Lock,
  KeyRound,
  Blocks,
  Cpu,
  Fingerprint,
  CircleDollarSign,
  Wallet,
  ArrowLeftRight,
  Hash,
  Link,
  Database,
  ShieldCheck,
  Binary,
];

const COLORS = [
  "text-orange-500/15",
  "text-amber-500/15",
  "text-yellow-500/12",
  "text-red-500/10",
  "text-blue-500/10",
  "text-purple-500/10",
  "text-green-500/10",
  "text-cyan-500/10",
  "text-orange-400/20",
  "text-amber-400/12",
];

interface FloatingIcon {
  id: number;
  Icon: (typeof ICONS)[number];
  color: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

function generateIcons(count: number): FloatingIcon[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    Icon: ICONS[i % ICONS.length],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 16 + Math.random() * 32,
    duration: 15 + Math.random() * 25,
    delay: Math.random() * -20,
    rotation: Math.random() * 360,
  }));
}

interface CryptoIconsBackgroundProps {
  className?: string;
  count?: number;
}

export function CryptoIconsBackground({
  className,
  count = 30,
}: CryptoIconsBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const icons = useMemo(() => generateIcons(count), [count]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={cn("absolute inset-0", className)} />;

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      {icons.map((item) => {
        const IconComp = item.Icon;
        return (
          <motion.div
            key={item.id}
            className={`absolute ${item.color}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: item.size,
              height: item.size,
            }}
            initial={{ opacity: 0, rotate: item.rotation }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, -30, 0, 30, 0],
              x: [0, 15, -15, 10, 0],
              rotate: [
                item.rotation,
                item.rotation + 20,
                item.rotation - 10,
                item.rotation,
              ],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              delay: item.delay,
              ease: "easeInOut",
              opacity: {
                duration: item.duration,
                times: [0, 0.1, 0.9, 1],
              },
            }}
          >
            <IconComp className="size-full" strokeWidth={1} />
          </motion.div>
        );
      })}
    </div>
  );
}
