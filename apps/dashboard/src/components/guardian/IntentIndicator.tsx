import {
  Send,
  Wallet,
  Shield,
  Search,
  Zap,
  HelpCircle,
  ScanLine,
  Settings,
} from "lucide-react";
import type { GuardianIntent } from "@/lib/types";

interface IntentIndicatorProps {
  intent: GuardianIntent;
}

const intentConfig: Record<
  GuardianIntent,
  { label: string; icon: typeof Send; color: string; bg: string; border: string }
> = {
  send: { label: "Send Transaction", icon: Send, color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/15" },
  check_balance: { label: "Check Balance", icon: Wallet, color: "text-blue-400", bg: "bg-blue-500/8", border: "border-blue-500/15" },
  set_policy: { label: "Set Policy", icon: Settings, color: "text-purple-400", bg: "bg-purple-500/8", border: "border-purple-500/15" },
  scan_address: { label: "Scan Address", icon: Search, color: "text-yellow-400", bg: "bg-yellow-500/8", border: "border-yellow-500/15" },
  scan_wallet: { label: "Scan Wallet", icon: ScanLine, color: "text-yellow-400", bg: "bg-yellow-500/8", border: "border-yellow-500/15" },
  pay_lightning: { label: "Lightning Payment", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/15" },
  explain_risk: { label: "Risk Explanation", icon: Shield, color: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/15" },
  unknown: { label: "Processing", icon: HelpCircle, color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border/30" },
};

export function IntentIndicator({ intent }: IntentIndicatorProps) {
  const config = intentConfig[intent];
  const Icon = config.icon;

  return (
    <div className="mt-1.5 ml-2">
      <span className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} border ${config.border} px-2.5 py-1 text-[10px] font-medium tracking-wide ${config.color} select-none`}>
        <Icon className="size-2.5" />
        {config.label}
      </span>
    </div>
  );
}
