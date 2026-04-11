import { xiorInstance } from "@/lib/xior";
import type { ApiResponse, LightningPayment, LightningBalance } from "@/lib/types";

export async function payInvoice(
  invoice: string
): Promise<LightningPayment> {
  const { data } = await xiorInstance.post<ApiResponse<LightningPayment>>(
    "/api/lightning/pay",
    { invoice }
  );
  return data.data;
}

export async function getBalance(): Promise<LightningBalance> {
  const { data } = await xiorInstance.get<ApiResponse<LightningBalance>>(
    "/api/lightning/balance"
  );
  return data.data;
}
