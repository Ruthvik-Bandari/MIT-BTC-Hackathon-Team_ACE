import express from "express";
import {
  corsMiddleware,
  rateLimiter,
  bodySizeGuard,
  errorHandler,
  securityHeaders,
} from "./middleware/security.js";
import { scannerRouter } from "./routes/scanner.js";
import { healthRouter } from "./routes/health.js";

const app = express();
const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(bodySizeGuard(256)); // 256KB max body
app.use(express.json({ limit: "256kb" }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use("/api/health", healthRouter);
app.use("/api/scanner", scannerRouter);

// ---------------------------------------------------------------------------
// 404 Catch-all
// ---------------------------------------------------------------------------

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
    },
  });
});

// ---------------------------------------------------------------------------
// Error Handler (must be last)
// ---------------------------------------------------------------------------

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`🛡️  SatsGuard Guardian API running on http://localhost:${PORT}`);
  console.log(`📡 Scanner:  http://localhost:${PORT}/api/scanner`);
  console.log(`💚 Health:   http://localhost:${PORT}/api/health`);
});

export default app;
