/**
 * BitShield Guardian Test Harness
 *
 * Tests all 7 guardian intents against the Claude API with a realistic
 * wallet context. Run with: bun scripts/test-guardian.ts
 *
 * Requires ANTHROPIC_API_KEY in environment.
 */

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";
const API_URL = process.env["API_URL"] ?? "http://localhost:3001";

// ─── Test Wallet Context ────────────────────────────────────────────────────

const TEST_WALLET_CONTEXT = {
  balanceSats: 500000,
  policy: {
    dailyLimitSats: 50000,
    spentTodaySats: 12000,
    requireApprovalAboveSats: 25000,
    coSignerEnabled: true,
  },
  addresses: [
    {
      address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
      type: "P2WPKH" as const,
      hasBeenSpent: false,
      balanceSats: 300000,
      quantumRisk: "LOW" as const,
    },
    {
      address: "tb1p5cyxnuxmeuwuvkwfem96lqzszee2456jdluchavfklg0k5gg70hsrmq0hx",
      type: "P2TR" as const,
      hasBeenSpent: false,
      balanceSats: 150000,
      quantumRisk: "MEDIUM" as const,
    },
    {
      address: "n1wgm6kkzMcNfAtJmes8YhpvtDzdNhDY5a",
      type: "P2PKH" as const,
      hasBeenSpent: true,
      balanceSats: 50000,
      quantumRisk: "HIGH" as const,
    },
  ],
  pendingTransactions: [
    {
      txId: "abc123def456",
      toAddress: "tb1qrp33g0q5b5698ahp5jnf5yzjmgcem8tlc7us37",
      amountSats: 15000,
      createdAt: "2026-04-11T10:30:00Z",
      status: "pending" as const,
    },
  ],
  network: "signet" as const,
};

// ─── Test Cases ─────────────────────────────────────────────────────────────

const TEST_CASES = [
  {
    name: "SET_POLICY",
    message: "Let my AI spend up to 5000 sats per day",
    expectedAction: "SET_POLICY",
  },
  {
    name: "SEND_PAYMENT (basic)",
    message: "Send 10000 sats to tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
    expectedAction: "SEND_PAYMENT",
  },
  {
    name: "SEND_PAYMENT (exceeds budget)",
    message: "Send 100000 sats to tb1qrp33g0q5b5698ahp5jnf5yzjmgcem8tlc7us37",
    expectedAction: "SEND_PAYMENT",
  },
  {
    name: "SEND_PAYMENT (to high-risk address)",
    message: "Send 5000 sats to n1wgm6kkzMcNfAtJmes8YhpvtDzdNhDY5a",
    expectedAction: "SEND_PAYMENT",
  },
  {
    name: "CHECK_BALANCE",
    message: "What's my balance?",
    expectedAction: "CHECK_BALANCE",
  },
  {
    name: "SCAN_QUANTUM",
    message: "Scan my wallet for quantum risk",
    expectedAction: "SCAN_QUANTUM",
  },
  {
    name: "APPROVE_TRANSACTION",
    message: "Approve that transaction",
    expectedAction: "APPROVE_TRANSACTION",
  },
  {
    name: "DENY_TRANSACTION",
    message: "Deny that pending transaction",
    expectedAction: "DENY_TRANSACTION",
  },
  {
    name: "CHAT (general)",
    message: "What can you do?",
    expectedAction: "CHAT",
  },
  {
    name: "CHAT (quantum question)",
    message: "How many bitcoins are at risk from quantum computers?",
    expectedAction: "CHAT",
  },
  {
    name: "Edge: ambiguous approve",
    message: "Yeah go ahead and send it",
    expectedAction: "APPROVE_TRANSACTION",
  },
  {
    name: "Edge: natural language policy",
    message: "Don't let the AI spend more than ten thousand sats without asking me first",
    expectedAction: "SET_POLICY",
  },
];

// ─── Runner ─────────────────────────────────────────────────────────────────

type TestResult = {
  name: string;
  passed: boolean;
  expectedAction: string;
  actualAction: string;
  message: string;
  warnings: string[];
  latencyMs: number;
};

async function runViaAPI(testCase: typeof TEST_CASES[number]): Promise<TestResult> {
  const start = performance.now();

  try {
    const response = await fetch(`${API_URL}/api/guardian/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: testCase.message,
        walletContext: TEST_WALLET_CONTEXT,
      }),
    });

    const latencyMs = Math.round(performance.now() - start);
    const json = await response.json() as {
      success: boolean;
      data?: { action: string; message: string; warnings: string[] };
      error?: string;
    };

    if (!json.success || !json.data) {
      return {
        name: testCase.name,
        passed: false,
        expectedAction: testCase.expectedAction,
        actualAction: "ERROR",
        message: json.error ?? "Unknown error",
        warnings: [],
        latencyMs,
      };
    }

    return {
      name: testCase.name,
      passed: json.data.action === testCase.expectedAction,
      expectedAction: testCase.expectedAction,
      actualAction: json.data.action,
      message: json.data.message,
      warnings: json.data.warnings,
      latencyMs,
    };
  } catch (error: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: testCase.name,
      passed: false,
      expectedAction: testCase.expectedAction,
      actualAction: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Connection failed",
      warnings: [],
      latencyMs,
    };
  }
}

async function main(): Promise<void> {
  console.log("=== BitShield Guardian Test Harness ===\n");
  console.log(`Target: ${API_URL}`);
  console.log(`Tests:  ${TEST_CASES.length}`);
  console.log("");

  const results: TestResult[] = [];

  for (const testCase of TEST_CASES) {
    process.stdout.write(`  Testing: ${testCase.name}... `);
    const result = await runViaAPI(testCase);
    results.push(result);

    const status = result.passed ? "PASS" : "FAIL";
    const icon = result.passed ? "[OK]" : "[XX]";
    console.log(
      `${icon} ${status} (${result.latencyMs}ms) → ${result.actualAction}`,
    );

    if (!result.passed) {
      console.log(`       Expected: ${result.expectedAction}`);
      console.log(`       Got:      ${result.actualAction}`);
    }

    if (result.warnings.length > 0) {
      console.log(`       Warnings: ${result.warnings.join("; ")}`);
    }
  }

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const avgLatency = Math.round(
    results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length,
  );

  console.log("\n=== Summary ===");
  console.log(`  Passed: ${passed}/${results.length}`);
  console.log(`  Failed: ${failed}/${results.length}`);
  console.log(`  Avg latency: ${avgLatency}ms`);
  console.log(`  Target: <3000ms`);

  if (avgLatency > 3000) {
    console.log("  WARNING: Average latency exceeds 3s target!");
  }

  if (failed > 0) {
    console.log("\n  FAILED TESTS:");
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`    - ${r.name}: expected ${r.expectedAction}, got ${r.actualAction}`);
    }
    process.exit(1);
  }

  console.log("\n  All tests passed!");
}

main().catch(console.error);
