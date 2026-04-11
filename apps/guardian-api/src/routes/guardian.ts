import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { parseIntent } from "../services/claude.js";
import type { ApiResponse, GuardianParseResult } from "../utils/types.js";

const ParseCommandSchema = z.object({
  message: z.string().min(1).max(1000),
});

export const guardianRoutes = new Hono();

// POST /api/guardian/parse — Claude intent parsing
guardianRoutes.post(
  "/parse",
  zValidator("json", ParseCommandSchema),
  async (c) => {
    const { message } = c.req.valid("json");
    const result = await parseIntent(message);

    const response: ApiResponse<GuardianParseResult> = {
      success: true,
      data: result,
    };
    return c.json(response);
  }
);
