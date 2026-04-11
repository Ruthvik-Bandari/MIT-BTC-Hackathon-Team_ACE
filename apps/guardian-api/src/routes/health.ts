import { Hono } from "hono";
import type { ApiResponse } from "../utils/types.js";

interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
  services: {
    nunchuk: boolean;
    alby: boolean;
    claude: boolean;
  };
}

export const healthRoutes = new Hono();

healthRoutes.get("/", (c) => {
  const health: ApiResponse<HealthData> = {
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      services: {
        nunchuk: !!process.env.NUNCHUK_CLI_PATH,
        alby: !!process.env.ALBY_NWC_URL,
        claude: !!process.env.ANTHROPIC_API_KEY,
      },
    },
  };

  return c.json(health);
});
