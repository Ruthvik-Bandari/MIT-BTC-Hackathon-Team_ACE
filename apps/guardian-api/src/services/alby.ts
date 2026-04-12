import { z } from "zod";
import { NWCClient } from "@getalby/sdk";
import type { LightningBalance, LightningPayment } from "../utils/types.js";

// ── Validation schemas ──────────────────────────────────────────

export const PayInvoiceSchema = z.object({
  invoice: z.string().min(1),
  amount: z.number().positive().optional(),
});

// ── Alby NWC client via @getalby/sdk v7 ────────────────────────

const NWC_URL = process.env.ALBY_NWC_URL ?? "";

export class AlbyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AlbyError";
  }
}

/**
 * Parse NWC URL and construct client with explicit params.
 * @getalby/sdk v7 requires walletPubkey, relayUrl, secret separately.
 */
function getNwcClient(): NWCClient {
  if (!NWC_URL) {
    throw new AlbyError("ALBY_NWC_URL not configured");
  }

  try {
    const url = new URL(NWC_URL);
    const walletPubkey = url.hostname || url.pathname.replace("//", "");
    const relayUrls = url.searchParams.getAll("relay");
    if (relayUrls.length === 0) relayUrls.push("wss://relay.getalby.com");
    const secret = url.searchParams.get("secret") ?? "";

    return new NWCClient({ walletPubkey, relayUrls, secret });
  } catch {
    throw new AlbyError("Invalid ALBY_NWC_URL format");
  }
}

// ── Service functions ───────────────────────────────────────────

export async function payInvoice(invoice: string): Promise<LightningPayment> {
  const nwc = getNwcClient();
  const cleanInvoice = invoice.trim().replace(/\s+/g, "");
  try {
    const result = await nwc.payInvoice({ invoice: cleanInvoice });

    return {
      invoice,
      amount: 0, // parsed from invoice in production
      description: "",
      status: "settled",
      preimage: result.preimage,
      settledAt: new Date().toISOString(),
    };
  } catch (err) {
    throw new AlbyError(
      err instanceof Error ? err.message : "Lightning payment failed"
    );
  }
}

export async function getBalance(): Promise<LightningBalance> {
  const nwc = getNwcClient();
  try {
    const result = await nwc.getBalance();

    return {
      balance: result.balance,
      currency: "sats",
    };
  } catch (err) {
    throw new AlbyError(
      err instanceof Error ? err.message : "Failed to get Lightning balance"
    );
  }
}

export async function makeInvoice(
  amount: number,
  description: string
): Promise<string> {
  const nwc = getNwcClient();
  try {
    const result = await nwc.makeInvoice({ amount, description });
    return result.invoice;
  } catch (err) {
    throw new AlbyError(
      err instanceof Error ? err.message : "Failed to create invoice"
    );
  }
}
