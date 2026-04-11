import { z } from "zod";

export const guardianCommandSchema = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message must be under 1000 characters"),
});

export type GuardianCommandInput = z.infer<typeof guardianCommandSchema>;
