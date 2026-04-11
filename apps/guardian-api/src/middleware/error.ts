import type { Context } from "hono";
import { NunchukError } from "../services/nunchuk.js";
import { AlbyError } from "../services/alby.js";
import { ClaudeError } from "../services/claude.js";

export function errorHandler(err: Error, c: Context): Response {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof NunchukError) {
    return c.json(
      {
        success: false,
        error: err.message,
        code: "NUNCHUK_ERROR",
        statusCode: 502,
      },
      502
    );
  }

  if (err instanceof AlbyError) {
    return c.json(
      {
        success: false,
        error: err.message,
        code: "ALBY_ERROR",
        statusCode: 502,
      },
      502
    );
  }

  if (err instanceof ClaudeError) {
    return c.json(
      {
        success: false,
        error: err.message,
        code: "CLAUDE_ERROR",
        statusCode: 502,
      },
      502
    );
  }

  return c.json(
    {
      success: false,
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      statusCode: 500,
    },
    500
  );
}
