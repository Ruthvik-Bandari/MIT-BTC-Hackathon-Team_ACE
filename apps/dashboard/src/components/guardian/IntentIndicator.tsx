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
  { label: string; icon: typeof Send; color: string }
> = {
  send: { label: "Send Transaction", icon: Send, color: "text-orange-400" },
  check_balance: { label: "Check Balance", icon: Wallet, color: "text-blue-400" },
  set_policy: { label: "Set Policy", icon: Settings, color: "text-purple-400" },
  scan_address: { label: "Scan Address", icon: Search, color: "text-yellow-400" },
  scan_wallet: { label: "Scan Wallet", icon: ScanLine, color: "text-yellow-400" },
  pay_lightning: { label: "Lightning Payment", icon: Zap, color: "text-amber-400" },
  explain_risk: { label: "Risk Explanation", icon: Shield, color: "text-red-400" },
  unknown: { label: "Processing", icon: HelpCircle, color: "text-muted-foreground" },
};

export function IntentIndicator({ intent }: IntentIndicatorProps) {
  const config = intentConfig[intent];
  const Icon = config.icon;

  return (
    <div className="mt-1 ml-2 flex items-center gap-1.5">
      <Icon className={`h-3 w-3 ${config.color}`} />
      <span className={`text-xs ${config.color}`}>{config.label}</span>
    </div>
  );
}
