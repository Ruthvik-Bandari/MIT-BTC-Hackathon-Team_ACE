import { xiorInstance } from "@/lib/xior";
import type {
  ApiResponse,
  QuantumRiskAssessment,
  WalletScanResult,
  WalletAddress,
  NetworkStats,
} from "@/lib/types";

export async function scanAddress(
  address: string,
  spent: boolean
): Promise<QuantumRiskAssessment> {
  const { data } = await xiorInstance.get<
    ApiResponse<{ assessment: QuantumRiskAssessment }>
  >(`/api/scanner/address/${address}`, {
    params: { spent: String(spent) },
  });
  return data.data.assessment;
}

export async function scanWallet(
  addresses: WalletAddress[]
): Promise<WalletScanResult> {
  const { data } = await xiorInstance.post<ApiResponse<WalletScanResult>>(
    "/api/scanner/analyze",
    { addresses }
  );
  return data.data;
}

export async function getNetworkStats(): Promise<NetworkStats> {
  const { data } = await xiorInstance.get<ApiResponse<NetworkStats>>(
    "/api/scanner/network-stats"
  );
  return data.data;
}
