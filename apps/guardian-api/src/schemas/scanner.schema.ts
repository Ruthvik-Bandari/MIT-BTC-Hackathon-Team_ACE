import { z } from "zod";

/**
 * Zod schema for a single wallet address input.
 * Validates address format and requires spending history flag.
 */
const walletAddressSchema = z.object({
  address: z
    .string()
    .min(20, "Bitcoin address too short")
    .max(90, "Bitcoin address too long")
    .refine(
      (addr) =>
        // bech32/bech32m: tb1 (testnet/signet) or bc1 (mainnet)
        addr.startsWith("tb1") ||
        addr.startsWith("bc1") ||
        addr.startsWith("bcrt1") ||
        // base58: testnet P2PKH starts with m/n, P2SH starts with 2
        // mainnet P2PKH starts with 1, P2SH starts with 3
        /^[123mn]/.test(addr),
      "Invalid Bitcoin address prefix. Expected tb1/bc1/bcrt1 (bech32) or 1/3/m/n/2 (base58)"
    ),
  hasBeenSpentFrom: z.boolean(),
});

/**
 * POST /api/scanner/analyze — batch scan request body
 */
export const analyzeRequestSchema = z.object({
  addresses: z
    .array(walletAddressSchema)
    .min(1, "At least one address is required")
    .max(100, "Maximum 100 addresses per batch scan"),
});

/**
 * GET /api/scanner/address/:addr — query parameters
 */
export const addressParamsSchema = z.object({
  addr: z
    .string()
    .min(20, "Bitcoin address too short")
    .max(90, "Bitcoin address too long"),
});

export const addressQuerySchema = z.object({
  spent: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
});

/**
 * POST /api/scanner/monitor/watch — add address to watch list
 */
export const watchRequestSchema = z.object({
  address: z
    .string()
    .min(20, "Bitcoin address too short")
    .max(90, "Bitcoin address too long")
    .refine(
      (addr) =>
        addr.startsWith("tb1") ||
        addr.startsWith("bc1") ||
        addr.startsWith("bcrt1") ||
        /^[123mn]/.test(addr),
      "Invalid Bitcoin address prefix"
    ),
});

/**
 * GET /api/scanner/timeline/year/:year — single year lookup
 */
export const yearParamsSchema = z.object({
  year: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 2024 && val <= 2040, "Year must be between 2024 and 2040"),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type AddressParams = z.infer<typeof addressParamsSchema>;
export type AddressQuery = z.infer<typeof addressQuerySchema>;
export type WatchRequest = z.infer<typeof watchRequestSchema>;
export type YearParams = z.infer<typeof yearParamsSchema>;
