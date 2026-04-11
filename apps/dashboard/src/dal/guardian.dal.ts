import { xiorInstance } from "@/lib/xior";
import type { ApiResponse, GuardianParseResult } from "@/lib/types";

export async function parseCommand(
  message: string
): Promise<GuardianParseResult> {
  const { data } = await xiorInstance.post<ApiResponse<GuardianParseResult>>(
    "/api/guardian/parse",
    { message }
  );
  return data.data;
}
