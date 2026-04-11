import type { Request, Response, NextFunction } from "express";
import cors from "cors";

// ---------------------------------------------------------------------------
// Typed Error Classes
// ---------------------------------------------------------------------------

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly details?: unknown) {
    super("VALIDATION_ERROR", message, 400);
    this.name = "ValidationError";
  }
}

export class ScanError extends AppError {
  constructor(message: string) {
    super("SCAN_ERROR", message, 422);
    this.name = "ScanError";
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429);
    this.name = "RateLimitError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

// ---------------------------------------------------------------------------
// CORS Configuration
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = [
  process.env["FRONTEND_URL"] ?? "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
];

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new AppError("CORS_ERROR", `Origin ${origin} not allowed`, 403));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
});

// ---------------------------------------------------------------------------
// Rate Limiter (in-memory, per IP)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP

/** Clean up expired entries periodically to prevent memory leak */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();

  const existing = rateLimitStore.get(clientIp);

  if (!existing || now > existing.resetAt) {
    // New window
    rateLimitStore.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", RATE_LIMIT_MAX_REQUESTS - 1);
    next();
    return;
  }

  existing.count++;

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - existing.count);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(existing.resetAt / 1000));

  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((existing.resetAt - now) / 1000),
      },
    });
    return;
  }

  next();
}

// ---------------------------------------------------------------------------
// Request Body Size Guard
// ---------------------------------------------------------------------------

export function bodySizeGuard(maxSizeKb: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers["content-length"] ?? "0", 10);
    if (contentLength > maxSizeKb * 1024) {
      res.status(413).json({
        success: false,
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: `Request body exceeds ${maxSizeKb}KB limit`,
        },
      });
      return;
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Centralized Error Handler
// ---------------------------------------------------------------------------

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && err.details
          ? { details: err.details }
          : {}),
      },
    });
    return;
  }

  // Unknown errors — don't leak internals
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.removeHeader("X-Powered-By");
  next();
}
