import { z } from "zod";

export const createWalletSchema = z.object({
  name: z
    .string()
    .min(1, "Wallet name is required")
    .max(64, "Name must be under 64 characters"),
  requiredApprovals: z
    .number()
    .int()
    .min(1, "At least 1 approval required")
    .max(5, "Maximum 5 approvals")
    .default(2),
});

export type CreateWalletInput = z.infer<typeof createWalletSchema>;

export const setPolicySchema = z.object({
  walletId: z.string().min(1, "Wallet ID is required"),
  dailyLimit: z.number().positive("Daily limit must be positive"),
  perTransactionLimit: z
    .number()
    .positive("Per-transaction limit must be positive"),
  whitelistedAddresses: z.array(z.string()).default([]),
});

export type SetPolicyInput = z.input<typeof setPolicySchema>;
export type SetPolicyOutput = z.output<typeof setPolicySchema>;
