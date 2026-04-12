import xior from "xior";
import { createHash } from "crypto";

// ── IPFS Pinning Service ────────────────────────────────────────
// Pins scan reports and audit trails to IPFS for data resilience.
// Uses local Kubo node (Docker Compose) or public pinning gateway.

const IPFS_API = process.env.IPFS_API_URL ?? "http://localhost:5001";
const IPFS_GATEWAY = process.env.IPFS_GATEWAY_URL ?? "https://ipfs.io";

const ipfsClient = xior.create({
  baseURL: `${IPFS_API}/api/v0`,
  timeout: 30_000,
});

export interface IpfsPin {
  cid: string;
  gatewayUrl: string;
  contentHash: string;
  pinnedAt: string;
}

/**
 * Pin JSON data to IPFS. Returns the CID and a gateway URL.
 * Content hash (SHA-256) is included for client-side verification.
 */
export async function pinJson(data: unknown): Promise<IpfsPin> {
  const jsonStr = JSON.stringify(data, null, 2);
  const contentHash = createHash("sha256").update(jsonStr).digest("hex");

  try {
    const formData = new FormData();
    formData.append("file", new Blob([jsonStr], { type: "application/json" }));

    const response = await ipfsClient.post("/add", formData, {
      params: { pin: "true" },
    });

    const cid = response.data.Hash as string;

    return {
      cid,
      gatewayUrl: `${IPFS_GATEWAY}/ipfs/${cid}`,
      contentHash,
      pinnedAt: new Date().toISOString(),
    };
  } catch {
    // Fallback: return content hash without IPFS if node unavailable
    return {
      cid: `local:${contentHash.slice(0, 16)}`,
      gatewayUrl: "",
      contentHash,
      pinnedAt: new Date().toISOString(),
    };
  }
}

/**
 * Pin a quantum scan report to IPFS.
 */
export async function pinScanReport(report: {
  address: string;
  assessment: unknown;
  scannedAt: string;
}): Promise<IpfsPin> {
  return pinJson({
    type: "bitshield:scan_report",
    version: "1.0",
    ...report,
  });
}

/**
 * Pin a guardian audit trail event to IPFS.
 */
export async function pinAuditEvent(event: {
  action: string;
  details: unknown;
  timestamp: string;
}): Promise<IpfsPin> {
  return pinJson({
    type: "bitshield:audit_trail",
    version: "1.0",
    ...event,
  });
}

/**
 * Retrieve pinned content by CID and verify its integrity.
 */
export async function verifyPin(cid: string, expectedHash: string): Promise<boolean> {
  try {
    const response = await xior.get(`${IPFS_GATEWAY}/ipfs/${cid}`, {
      responseType: "text",
    });

    const actualHash = createHash("sha256")
      .update(response.data as string)
      .digest("hex");

    return actualHash === expectedHash;
  } catch {
    return false;
  }
}
