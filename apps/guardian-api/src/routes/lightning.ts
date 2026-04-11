import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { payInvoice, getBalance, PayInvoiceSchema } from "../services/alby.js";
import { broadcast } from "../index.js";
import type { ApiResponse, LightningPayment, LightningBalance } from "../utils/types.js";

export const lightningRoutes = new Hono();

// POST /api/lightning/pay
lightningRoutes.post(
  "/pay",
  zValidator("json", PayInvoiceSchema),
  async (c) => {
    const { invoice } = c.req.valid("json");
    const payment = await payInvoice(invoice);
    broadcast("lightning:settled", payment);

    const response: ApiResponse<LightningPayment> = { success: true, data: payment };
    return c.json(response);
  }
);

// GET /api/lightning/balance
lightningRoutes.get("/balance", async (c) => {
  const balance = await getBalance();

  const response: ApiResponse<LightningBalance> = { success: true, data: balance };
  return c.json(response);
});
