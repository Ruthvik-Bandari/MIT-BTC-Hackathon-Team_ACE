import { z } from "zod";

export const sendTransactionSchema = z.object({
  walletId: z.string().min(1, "Wallet ID is required"),
  toAddress: z
    .string()
    .min(26, "Invalid Bitcoin address")
    .max(90, "Invalid Bitcoin address"),
  amount: z.number().positive("Amount must be positive"),
  memo: z.string().max(256, "Memo must be under 256 characters").optional(),
});

export type SendTransactionInput = z.infer<typeof sendTransactionSchema>;

export const payLightningSchema = z.object({
  invoice: z.string().min(1, "Lightning invoice is required"),
});

export type PayLightningInput = z.infer<typeof payLightningSchema>;
