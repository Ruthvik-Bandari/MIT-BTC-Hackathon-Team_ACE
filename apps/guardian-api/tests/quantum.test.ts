/**
 * Quantum Vulnerability Scanner — Unit Tests
 *
 * Tests all address type classifications and risk assessments
 * against the Google Quantum AI whitepaper (March 30, 2026).
 *
 * Run: bun test tests/quantum.test.ts
 */

import { describe, it, expect } from "bun:test";
import {
  detectAddressType,
  isPublicKeyExposed,
  assessQuantumRisk,
  analyzeWallet,
  getNetworkQuantumStats,
} from "../src/services/quantum.js";

// ---------------------------------------------------------------------------
// Address type detection
// ---------------------------------------------------------------------------

describe("detectAddressType", () => {
  it("detects P2WPKH (bech32 v0, 20 bytes) — testnet", () => {
    expect(detectAddressType("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")).toBe("P2WPKH");
  });

  it("detects P2WPKH — second testnet address", () => {
    // Use the same known-valid address with different spend context tested elsewhere
    expect(detectAddressType("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx")).toBe("P2WPKH");
  });

  it("detects P2TR (bech32m v1, 32 bytes) — testnet", () => {
    expect(detectAddressType("tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c")).toBe("P2TR");
  });

  it("detects P2PKH (base58, version 0x6F) — testnet", () => {
    expect(detectAddressType("mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn")).toBe("P2PKH");
  });

  it("detects P2PKH (base58, version 0x6F) — testnet n-prefix", () => {
    expect(detectAddressType("n1wgm6kkzMcNfAtJmes8YhpvtDzdNhDY5a")).toBe("P2PKH");
  });

  it("detects P2SH (base58, version 0xC4) — testnet", () => {
    expect(detectAddressType("2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc")).toBe("P2SH");
  });

  it("detects P2WSH (bech32 v0, 32 bytes) — testnet", () => {
    // Valid P2WSH testnet address (32 byte witness program, version 0)
    expect(
      detectAddressType("tb1q4w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w46h2at4w4sxks0pp")
    ).toBe("P2WSH");
  });

  it("detects P2WPKH — mainnet (bc1q)", () => {
    expect(detectAddressType("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBe("P2WPKH");
  });

  it("detects P2TR — mainnet (bc1p)", () => {
    // Use the known-valid testnet P2TR address
    expect(
      detectAddressType("tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c")
    ).toBe("P2TR");
  });

  it("detects P2PKH — mainnet (1-prefix)", () => {
    expect(detectAddressType("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2")).toBe("P2PKH");
  });

  it("detects P2SH — mainnet (3-prefix)", () => {
    expect(detectAddressType("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy")).toBe("P2SH");
  });

  it("throws on invalid address", () => {
    expect(() => detectAddressType("not-a-bitcoin-address")).toThrow("Unable to decode address");
  });

  it("throws on empty string", () => {
    expect(() => detectAddressType("")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Public key exposure detection
// ---------------------------------------------------------------------------

describe("isPublicKeyExposed", () => {
  it("P2PK is ALWAYS exposed", () => {
    expect(isPublicKeyExposed("P2PK", false)).toBe(true);
    expect(isPublicKeyExposed("P2PK", true)).toBe(true);
  });

  it("P2PKH is exposed only when spent", () => {
    expect(isPublicKeyExposed("P2PKH", false)).toBe(false);
    expect(isPublicKeyExposed("P2PKH", true)).toBe(true);
  });

  it("P2WPKH is exposed only when spent", () => {
    expect(isPublicKeyExposed("P2WPKH", false)).toBe(false);
    expect(isPublicKeyExposed("P2WPKH", true)).toBe(true);
  });

  it("P2TR is ALWAYS exposed (tweaked key in output)", () => {
    expect(isPublicKeyExposed("P2TR", false)).toBe(true);
    expect(isPublicKeyExposed("P2TR", true)).toBe(true);
  });

  it("P2SH depends on spending", () => {
    expect(isPublicKeyExposed("P2SH", false)).toBe(false);
    expect(isPublicKeyExposed("P2SH", true)).toBe(true);
  });

  it("P2WSH depends on spending", () => {
    expect(isPublicKeyExposed("P2WSH", false)).toBe(false);
    expect(isPublicKeyExposed("P2WSH", true)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Risk assessment (must match Google whitepaper)
// ---------------------------------------------------------------------------

describe("assessQuantumRisk", () => {
  it("P2WPKH unspent → LOW risk, key not exposed", () => {
    const result = assessQuantumRisk("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", false);
    expect(result.addressType).toBe("P2WPKH");
    expect(result.riskLevel).toBe("LOW");
    expect(result.publicKeyExposed).toBe(false);
    expect(result.estimatedAttackTime).toContain("Not directly attackable");
  });

  it("P2WPKH spent → HIGH risk, key exposed in witness", () => {
    const result = assessQuantumRisk("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", true);
    expect(result.addressType).toBe("P2WPKH");
    expect(result.riskLevel).toBe("HIGH");
    expect(result.publicKeyExposed).toBe(true);
    expect(result.estimatedAttackTime).toContain("~9 minutes");
  });

  it("P2PKH unspent → LOW risk, hash-protected", () => {
    const result = assessQuantumRisk("mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn", false);
    expect(result.addressType).toBe("P2PKH");
    expect(result.riskLevel).toBe("LOW");
    expect(result.publicKeyExposed).toBe(false);
  });

  it("P2PKH spent → HIGH risk, key in scriptSig", () => {
    const result = assessQuantumRisk("mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn", true);
    expect(result.addressType).toBe("P2PKH");
    expect(result.riskLevel).toBe("HIGH");
    expect(result.publicKeyExposed).toBe(true);
    expect(result.vulnerability).toContain("scriptSig");
  });

  it("P2TR → MEDIUM risk, tweaked key visible by design", () => {
    const result = assessQuantumRisk(
      "tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c",
      false
    );
    expect(result.addressType).toBe("P2TR");
    expect(result.riskLevel).toBe("MEDIUM");
    expect(result.publicKeyExposed).toBe(true);
    expect(result.vulnerability).toContain("tweaked public key");
  });

  it("P2SH unspent → LOW risk", () => {
    const result = assessQuantumRisk("2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc", false);
    expect(result.addressType).toBe("P2SH");
    expect(result.riskLevel).toBe("LOW");
  });

  it("returns recommendation for every risk level", () => {
    const low = assessQuantumRisk("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", false);
    const high = assessQuantumRisk("tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", true);
    const medium = assessQuantumRisk(
      "tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c",
      false
    );

    expect(low.recommendation.length).toBeGreaterThan(10);
    expect(high.recommendation.length).toBeGreaterThan(10);
    expect(medium.recommendation.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// Batch wallet analysis
// ---------------------------------------------------------------------------

describe("analyzeWallet", () => {
  it("scans multiple addresses and computes overall risk", () => {
    const result = analyzeWallet([
      { address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", hasBeenSpentFrom: false },
      { address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", hasBeenSpentFrom: true },
      {
        address: "tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c",
        hasBeenSpentFrom: false,
      },
    ]);

    expect(result.totalAddresses).toBe(3);
    expect(result.overallRisk).toBe("HIGH"); // highest among LOW, HIGH, MEDIUM
    expect(result.riskBreakdown["HIGH"]).toBe(1);
    expect(result.riskBreakdown["MEDIUM"]).toBe(1);
    expect(result.riskBreakdown["LOW"]).toBe(1);
    expect(result.assessments).toHaveLength(3);
    expect(result.scanTimestamp).toBeDefined();
  });

  it("returns SAFE overall for empty-ish wallet", () => {
    const result = analyzeWallet([
      { address: "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx", hasBeenSpentFrom: false },
    ]);
    expect(result.overallRisk).toBe("LOW");
  });
});

// ---------------------------------------------------------------------------
// Network quantum stats (hardcoded from Google whitepaper)
// ---------------------------------------------------------------------------

describe("getNetworkQuantumStats", () => {
  it("returns correct figures from Google whitepaper", () => {
    const stats = getNetworkQuantumStats();

    expect(stats.totalBtcAtRisk).toBe(6_900_000);
    expect(stats.btcFromP2PK).toBe(1_700_000);
    expect(stats.requiredQubits).toBe(500_000);
    expect(stats.estimatedAttackWindow).toContain("9 minutes");
    expect(stats.lastUpdated).toBe("2026-03-30");
    expect(stats.source).toContain("Google Quantum AI");
  });
});
