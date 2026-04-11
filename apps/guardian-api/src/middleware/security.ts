import type { Context, Next } from "hono";

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
// Rate Limiter (in-memory, per IP) — Hono middleware
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

export async function rateLimiter(c: Context, next: Next): Promise<Response | void> {
  const clientIp =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown";
  const now = Date.now();

  const existing = rateLimitStore.get(clientIp);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
    c.header("X-RateLimit-Remaining", String(RATE_LIMIT_MAX_REQUESTS - 1));
    await next();
    return;
  }

  existing.count++;

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - existing.count);
  c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(existing.resetAt / 1000)));

  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    return c.json(
      {
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((existing.resetAt - now) / 1000),
        },
      },
      429
    );
  }

  await next();
}

// ---------------------------------------------------------------------------
// Security Headers — Hono middleware
// ---------------------------------------------------------------------------

export async function securityHeaders(c: Context, next: Next): Promise<void> {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("Content-Security-Policy", "default-src 'self'");
  await next();
}
