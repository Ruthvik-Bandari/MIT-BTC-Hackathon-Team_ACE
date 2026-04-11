import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateAddress } from "@/lib/formatters";
import { Tilt, TiltContent } from "@/components/animate-ui/primitives/effects/tilt";
import type { QuantumRiskAssessment, RiskLevel } from "@/lib/types";

interface AddressCardProps {
  assessment: QuantumRiskAssessment;
}

const riskVariant: Record<RiskLevel, "destructive" | "outline" | "secondary" | "default"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "outline",
  LOW: "default",
};

export function AddressCard({ assessment }: AddressCardProps) {
  return (
    <Tilt maxTilt={6} perspective={1000}>
      <TiltContent>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <span className="font-mono text-sm">
                {truncateAddress(assessment.address, 12)}
              </span>
            </CardTitle>
            <CardAction>
              <Badge variant={riskVariant[assessment.riskLevel]}>
                {assessment.riskLevel}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="text-foreground">{assessment.addressType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Key exposed</p>
                <p className="text-foreground">
                  {assessment.publicKeyExposed ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Spent</p>
                <p className="text-foreground">
                  {assessment.hasBeenSpent ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Attack time</p>
                <p className="text-foreground">{assessment.estimatedAttackTime}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{assessment.recommendation}</p>
          </CardContent>
        </Card>
      </TiltContent>
    </Tilt>
  );
}
