/**
 * Demo seed script — populates the guardian API with sample data for demo/testing.
 * Run: bun scripts/seed-demo.ts
 *
 * Creates a wallet with mixed-risk addresses so the scanner shows
 * CRITICAL / HIGH / MEDIUM / LOW results during the live demo.
 */

const API = process.env.API_URL ?? "http://localhost:3001";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function api<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) throw new Error(json.error ?? "API error");
  return json.data;
}

// ── Demo addresses with known risk profiles ─────────────────────
// These are real address formats on signet/testnet that demonstrate
// each quantum risk level for the scanner.

const demoAddresses = [
  {
    label: "P2PKH (spent → HIGH risk)",
    address: "n1C8nsmi4sc4hjBfGf56A1dnVMjxnYSQqk",
    spent: true,
  },
  {
    label: "P2PKH (unspent → LOW risk)",
    address: "mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn",
    spent: false,
  },
  {
    label: "P2WPKH (spent → HIGH risk)",
    address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    spent: true,
  },
  {
    label: "P2WPKH (unspent → LOW risk)",
    address: "tb1qrp33g0q5b5698ahp5jnf0y5emnv573xahm9wr0",
    spent: false,
  },
  {
    label: "P2TR (Taproot → MEDIUM risk)",
    address: "tb1p5cyxnuxmeuwuvkwfem96lqzszee2456rjnmhkhl3d",
    spent: false,
  },
];

async function seed() {
  console.log("🌱 BitShield Demo Seed");
  console.log(`   API: ${API}\n`);

  // 1. Health check
  console.log("→ Checking API health...");
  const health = await api<{ status: string }>("GET", "/api/health");
  console.log(`  ✓ API status: ${health.status}\n`);

  // 2. Create demo wallet
  console.log("→ Creating demo wallet...");
  try {
    const wallet = await api<{ id: string; name: string }>("POST", "/api/wallet/create", {
      name: "BitShield Demo Wallet",
      requiredApprovals: 2,
    });
    console.log(`  ✓ Wallet created: ${wallet.name} (${wallet.id})\n`);

    // 3. Set policy
    console.log("→ Setting spending policy...");
    await api("POST", "/api/wallet/set-policy", {
      walletId: wallet.id,
      dailyLimit: 500_000,
      perTransactionLimit: 100_000,
      whitelistedAddresses: [],
    });
    console.log("  ✓ Policy: 500K sats/day, 100K sats/tx\n");
  } catch (err) {
    console.log(`  ⚠ Wallet creation skipped (Nunchuk CLI may not be available): ${(err as Error).message}\n`);
  }

  // 4. Scan demo addresses
  console.log("→ Scanning demo addresses for quantum risk...\n");
  for (const demo of demoAddresses) {
    try {
      const result = await api<{ assessment: { riskLevel: string; recommendation: string } }>(
        "GET",
        `/api/scanner/address/${demo.address}?spent=${demo.spent}`
      );
      const risk = result.assessment.riskLevel;
      const icon =
        risk === "CRITICAL" ? "🔴" :
        risk === "HIGH" ? "🟠" :
        risk === "MEDIUM" ? "🟡" : "🟢";
      console.log(`  ${icon} ${demo.label}`);
      console.log(`     ${demo.address}`);
      console.log(`     Risk: ${risk} — ${result.assessment.recommendation}\n`);
    } catch (err) {
      console.log(`  ✗ Failed: ${demo.label} — ${(err as Error).message}\n`);
    }
  }

  // 5. Batch scan
  console.log("→ Running batch wallet scan...");
  try {
    const batchResult = await api<{
      totalAddresses: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    }>("POST", "/api/scanner/analyze", {
      addresses: demoAddresses.map((d) => ({
        address: d.address,
        type: "UNKNOWN",
        balance: 50_000,
        spent: d.spent,
      })),
    });
    console.log(`  ✓ Scanned ${batchResult.totalAddresses} addresses:`);
    console.log(`    🔴 Critical: ${batchResult.critical}`);
    console.log(`    🟠 High: ${batchResult.high}`);
    console.log(`    🟡 Medium: ${batchResult.medium}`);
    console.log(`    🟢 Low: ${batchResult.low}\n`);
  } catch (err) {
    console.log(`  ✗ Batch scan failed: ${(err as Error).message}\n`);
  }

  // 6. Network stats
  console.log("→ Fetching network vulnerability stats...");
  const stats = await api<{
    exposedBtc: number;
    qubitsRequired: number;
    estimatedBreakTime: string;
  }>("GET", "/api/scanner/network-stats");
  console.log(`  ✓ ${(stats.exposedBtc / 1_000_000).toFixed(1)}M BTC exposed`);
  console.log(`  ✓ <${(stats.qubitsRequired / 1000).toFixed(0)}K qubits needed`);
  console.log(`  ✓ Break time: ${stats.estimatedBreakTime}\n`);

  console.log("✅ Demo seed complete! Ready for live demo.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
