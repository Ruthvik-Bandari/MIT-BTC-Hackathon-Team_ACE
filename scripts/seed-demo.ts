/**
 * SatsGuard Demo Seed Script
 *
 * Pre-populates the guardian API with a realistic wallet context containing
 * addresses of mixed quantum risk levels. Used before the live demo to
 * ensure judges see meaningful data immediately.
 *
 * Run with: bun scripts/seed-demo.ts
 */

const API_URL = process.env["API_URL"] ?? "http://localhost:3001";

/**
 * Demo wallet context with 5 addresses at varying quantum risk levels.
 * Uses signet addresses to ensure no real funds are ever at risk.
 */
const DEMO_WALLET_CONTEXT = {
  balanceSats: 1_500_000,
  policy: {
    dailyLimitSats: 100_000,
    spentTodaySats: 0,
    requireApprovalAboveSats: 50_000,
    coSignerEnabled: true,
  },
  addresses: [
    {
      address: "04b0bd634234abbb1ba1e986e884185c61cf43e001f9137f23c2c409273eb16e6537a576782eba668a7ef8bd3b3cfb1edb7117ab65129b8a2e681f3c1e0908ef7b",
      type: "P2PK" as const,
      hasBeenSpent: true,
      balanceSats: 500_000,
      quantumRisk: "CRITICAL" as const,
    },
    {
      address: "n1wgm6kkzMcNfAtJmes8YhpvtDzdNhDY5a",
      type: "P2PKH" as const,
      hasBeenSpent: true,
      balanceSats: 250_000,
      quantumRisk: "HIGH" as const,
    },
    {
      address: "tb1p5cyxnuxmeuwuvkwfem96lqzszee2456jdluchavfklg0k5gg70hsrmq0hx",
      type: "P2TR" as const,
      hasBeenSpent: false,
      balanceSats: 300_000,
      quantumRisk: "MEDIUM" as const,
    },
    {
      address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
      type: "P2WPKH" as const,
      hasBeenSpent: false,
      balanceSats: 350_000,
      quantumRisk: "LOW" as const,
    },
    {
      address: "tb1qrp33g0q5b5698ahp5jnf5yzjmgcem8tlc7us37",
      type: "P2WPKH" as const,
      hasBeenSpent: false,
      balanceSats: 100_000,
      quantumRisk: "SAFE" as const,
    },
  ],
  pendingTransactions: [
    {
      txId: "demo_tx_001",
      toAddress: "tb1qrp33g0q5b5698ahp5jnf5yzjmgcem8tlc7us37",
      amountSats: 25_000,
      createdAt: new Date().toISOString(),
      status: "pending" as const,
    },
  ],
  network: "signet" as const,
};

/**
 * Demo conversation flow that showcases all guardian capabilities.
 * Each step is designed to show a different feature to judges.
 */
const DEMO_FLOW = [
  {
    step: 1,
    label: "Check balance",
    message: "What's my balance?",
  },
  {
    step: 2,
    label: "Quantum scan",
    message: "Scan my wallet for quantum vulnerabilities",
  },
  {
    step: 3,
    label: "Set policy",
    message: "Let my AI spend up to 100000 sats per day, but ask me first for anything over 50000",
  },
  {
    step: 4,
    label: "Send to safe address",
    message: "Send 15000 sats to tb1qrp33g0q5b5698ahp5jnf5yzjmgcem8tlc7us37",
  },
  {
    step: 5,
    label: "Send to risky address (should warn)",
    message: "Send 5000 sats to n1wgm6kkzMcNfAtJmes8YhpvtDzdNhDY5a",
  },
  {
    step: 6,
    label: "Approve pending",
    message: "Approve that pending transaction",
  },
  {
    step: 7,
    label: "General question",
    message: "How many bitcoins are vulnerable to quantum attacks?",
  },
];

async function runDemoStep(step: typeof DEMO_FLOW[number]): Promise<void> {
  console.log(`\n--- Step ${step.step}: ${step.label} ---`);
  console.log(`User: "${step.message}"`);

  const start = performance.now();

  const res = await fetch(`${API_URL}/api/guardian/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage: step.message,
      walletContext: DEMO_WALLET_CONTEXT,
    }),
  });

  const latency = Math.round(performance.now() - start);
  const json = await res.json() as {
    success: boolean;
    data?: {
      action: string;
      params: Record<string, unknown>;
      message: string;
      warnings: string[];
    };
    error?: string;
  };

  if (!json.success || !json.data) {
    console.log(`  ERROR: ${json.error ?? "Unknown"} (${latency}ms)`);
    return;
  }

  console.log(`  Action:   ${json.data.action} (${latency}ms)`);
  console.log(`  Guardian: ${json.data.message}`);

  if (Object.keys(json.data.params).length > 0) {
    console.log(`  Params:   ${JSON.stringify(json.data.params)}`);
  }

  if (json.data.warnings.length > 0) {
    for (const w of json.data.warnings) {
      console.log(`  WARNING:  ${w}`);
    }
  }
}

async function main(): Promise<void> {
  console.log("=== SatsGuard Demo Seed & Walkthrough ===");
  console.log(`API: ${API_URL}`);
  console.log(`Wallet: ${DEMO_WALLET_CONTEXT.balanceSats.toLocaleString()} sats`);
  console.log(`Addresses: ${DEMO_WALLET_CONTEXT.addresses.length} (mixed risk levels)`);

  // Check health first
  try {
    const health = await fetch(`${API_URL}/api/health`);
    const healthJson = await health.json() as { status: string };
    console.log(`Health: ${healthJson.status}`);
  } catch {
    console.error("ERROR: Cannot reach API at", API_URL);
    console.error("Start the server first: cd apps/guardian-api && bun run dev");
    process.exit(1);
  }

  for (const step of DEMO_FLOW) {
    await runDemoStep(step);
  }

  console.log("\n=== Demo Complete ===");
}

main().catch(console.error);
