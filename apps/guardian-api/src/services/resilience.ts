import xior from "xior";

// ── Multi-Provider Health Check & Failover ─────────────────────
// Monitors backend instances across Railway, Render, and Fly.io.
// Provides a unified health endpoint and automatic failover.

export interface ProviderStatus {
  name: string;
  url: string;
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  features: string[];
}

export interface ResilienceStatus {
  activeProvider: string;
  providers: ProviderStatus[];
  ipfsAvailable: boolean;
  nostrRelaysConnected: number;
  lastFailover: string | null;
}

const PROVIDERS = [
  {
    name: "railway",
    url: process.env.RAILWAY_API_URL ?? "",
  },
  {
    name: "render",
    url: process.env.RENDER_API_URL ?? "",
  },
  {
    name: "fly",
    url: process.env.FLY_API_URL ?? "",
  },
].filter((p) => p.url.length > 0);

let activeProvider: string = "self";
let lastFailover: string | null = null;

/**
 * Check health of a single provider.
 */
async function checkProvider(
  name: string,
  url: string,
): Promise<ProviderStatus> {
  const start = Date.now();
  try {
    const response = await xior.get(`${url}/api/health`, { timeout: 5000 });
    const latencyMs = Date.now() - start;
    const data = response.data as Record<string, unknown>;

    return {
      name,
      url,
      healthy: data.status === "ok",
      latencyMs,
      lastChecked: new Date().toISOString(),
      features: Array.isArray(data.features) ? data.features as string[] : [],
    };
  } catch {
    return {
      name,
      url,
      healthy: false,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      features: [],
    };
  }
}

/**
 * Check health of all configured providers.
 * Returns the full resilience status including IPFS and Nostr.
 */
export async function getResilienceStatus(): Promise<ResilienceStatus> {
  const providerChecks = await Promise.all(
    PROVIDERS.map((p) => checkProvider(p.name, p.url)),
  );

  // Check IPFS availability
  let ipfsAvailable = false;
  try {
    const ipfsApi = process.env.IPFS_API_URL ?? "http://localhost:5001";
    await xior.post(`${ipfsApi}/api/v0/id`, null, { timeout: 3000 });
    ipfsAvailable = true;
  } catch {
    ipfsAvailable = false;
  }

  // Count connected Nostr relays (simplified — check WebSocket connectivity)
  let nostrRelaysConnected = 0;
  const relays = [
    "wss://relay.getalby.com",
    "wss://relay.damus.io",
    "wss://nos.lol",
  ];

  const relayChecks = await Promise.allSettled(
    relays.map(async (relay) => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(relay);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error("timeout"));
        }, 3000);
        ws.addEventListener("open", () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        });
        ws.addEventListener("error", () => {
          clearTimeout(timeout);
          reject(new Error("failed"));
        });
      });
    }),
  );

  for (const result of relayChecks) {
    if (result.status === "fulfilled") nostrRelaysConnected++;
  }

  // Select best provider based on health + latency
  const healthyProviders = providerChecks.filter((p) => p.healthy);
  if (healthyProviders.length > 0) {
    const best = healthyProviders.reduce((a, b) =>
      a.latencyMs < b.latencyMs ? a : b,
    );
    if (best.name !== activeProvider) {
      lastFailover = new Date().toISOString();
      activeProvider = best.name;
    }
  }

  return {
    activeProvider,
    providers: providerChecks,
    ipfsAvailable,
    nostrRelaysConnected,
    lastFailover,
  };
}

/**
 * Get the URL of the currently active (healthiest) provider.
 * Falls back to self if no external providers are configured.
 */
export async function getActiveProviderUrl(): Promise<string> {
  if (PROVIDERS.length === 0) return "";

  const status = await getResilienceStatus();
  const active = status.providers.find((p) => p.name === status.activeProvider);
  return active?.url ?? "";
}
