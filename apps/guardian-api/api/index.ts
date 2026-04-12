import { handle } from "hono/vercel";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { healthRoutes } from "../src/routes/health.js";
import { guardianRoutes } from "../src/routes/guardian.js";
import { scannerRoutes } from "../src/routes/scanner.js";
import { cogcoinRoutes } from "../src/routes/cogcoin.js";
import { walletRoutes } from "../src/routes/wallet.js";
import { lightningRoutes } from "../src/routes/lightning.js";
import { resilienceRoutes } from "../src/routes/resilience.js";
import { webhookRoutes } from "../src/routes/webhook.js";
import { errorHandler } from "../src/middleware/error.js";
import { securityHeaders, rateLimiter } from "../src/middleware/security.js";

const app = new Hono();

app.use("*", cors({ origin: "*" }));
app.use("*", logger());
app.use("*", securityHeaders);
app.use("*", rateLimiter);
app.onError(errorHandler);

app.route("/api/health", healthRoutes);
app.route("/api/guardian", guardianRoutes);
app.route("/api/scanner", scannerRoutes);
app.route("/api/cogcoin", cogcoinRoutes);
app.route("/api/wallet", walletRoutes);
app.route("/api/lightning", lightningRoutes);
app.route("/api/resilience", resilienceRoutes);
app.route("/api/webhook", webhookRoutes);

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
