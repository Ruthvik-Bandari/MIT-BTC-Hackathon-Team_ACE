import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import {
  parseGuardianIntent,
  enrichWithQuantumWarnings,
  streamGuardianIntent,
} from "../services/claude.js";
import { GuardianParseRequestSchema } from "../types/guardian.js";

const router = Router();

// ─── POST /api/guardian/parse ───────────────────────────────────────────────

/**
 * Parses a natural language user message into a structured guardian action.
 *
 * Accepts a user message and wallet context, sends them to Claude for intent
 * parsing, and returns a structured response with the detected action,
 * parameters, a user-facing message, and any risk warnings. Server-side
 * quantum risk enrichment is applied as defense-in-depth.
 *
 * @route POST /api/guardian/parse
 *
 * @body {string} userMessage - Natural language command from the user
 * @body {WalletContext} walletContext - Current wallet state for context
 *
 * @returns {object} 200 - Parsed guardian response
 * @returns {object} 400 - Validation error
 * @returns {object} 500 - Internal server error
 */
router.post("/parse", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = GuardianParseRequestSchema.parse(req.body);

    const guardianResponse = await parseGuardianIntent(
      parsed.userMessage,
      parsed.walletContext,
    );

    // Server-side quantum risk enrichment (defense-in-depth)
    const enriched = enrichWithQuantumWarnings(guardianResponse, parsed.walletContext);

    res.json({
      success: true,
      data: enriched,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    const isClaudeError = message.includes("anthropic") || message.includes("Claude");

    console.error("[guardian/parse] Error:", message);

    res.status(isClaudeError ? 502 : 500).json({
      success: false,
      error: isClaudeError
        ? "AI guardian service temporarily unavailable"
        : "Failed to parse guardian intent",
      details: process.env["NODE_ENV"] === "development" ? message : undefined,
    });
  }
});

// ─── POST /api/guardian/stream ──────────────────────────────────────────────

/**
 * Streams a guardian response via Server-Sent Events (SSE).
 *
 * Tokens stream in real-time as Claude generates them, giving the frontend
 * a ChatGPT-style typing experience. The final parsed action is emitted
 * as a structured `action` event once the stream completes.
 *
 * SSE event types emitted:
 * - `token` — individual text tokens as they arrive
 * - `action` — final parsed GuardianResponse (JSON)
 * - `error` — error message if parsing/streaming fails
 * - `done` — stream complete, client should close connection
 *
 * @route POST /api/guardian/stream
 *
 * @body {string} userMessage - Natural language command from the user
 * @body {WalletContext} walletContext - Current wallet state for context
 */
router.post("/stream", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = GuardianParseRequestSchema.parse(req.body);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    await streamGuardianIntent(
      parsed.userMessage,
      parsed.walletContext,
      (token) => {
        res.write(`event: token\ndata: ${JSON.stringify(token)}\n\n`);
      },
      (response) => {
        res.write(`event: action\ndata: ${JSON.stringify(response)}\n\n`);
        res.write("event: done\ndata: {}\n\n");
        res.end();
      },
      (error) => {
        res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
        res.end();
      },
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[guardian/stream] Error:", message);

    // If headers already sent (SSE started), send error event
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to start guardian stream",
      });
    }
  }
});

export { router as guardianRouter };
