/**
 * BIP-360 (QuBit) Post-Quantum Compatibility Checker
 *
 * BIP-360 is a proposed Bitcoin soft fork that introduces post-quantum
 * cryptographic signature schemes to Bitcoin. It defines a new output
 * type that uses hash-based or lattice-based signatures resistant to
 * Shor's algorithm.
 *
 * This service assesses whether existing addresses would be compatible
 * with BIP-360's migration path and what steps are needed.
 *
 * Reference: https://github.com/cryptoquick/bips/blob/p2qrh/bip-0360.mediawiki
 * Status: Draft (as of April 2026)
 *
 * Proposed schemes under BIP-360:
 * - P2QRH (Pay-to-Quantum-Resistant-Hash): new output type
 * - SQIsign: lattice-based signature (compact, ~204 bytes)
 * - SPHINCS+: hash-based signature (stateless, ~7,856 bytes)
 * - CRYSTALS-Dilithium: lattice-based (NIST standard, ~2,420 bytes)
 */

import type { AddressType, RiskLevel, Bip360Assessment } from "../types/quantum.js";

/**
 * Assess BIP-360 compatibility for a given address type and risk level.
 *
 * Key insights:
 * - Hash-protected addresses (unspent P2PKH/P2WPKH) can safely migrate
 *   to P2QRH once activated — their keys are not yet exposed
 * - Exposed-key addresses (P2PK, spent P2PKH/P2WPKH) need IMMEDIATE
 *   migration before BIP-360 even activates
 * - P2TR has a partial migration path: script-path spending can use
 *   post-quantum scripts, but key-path is vulnerable
 * - P2SH/P2WSH can wrap post-quantum scripts in theory
 */
export function assessBip360Compatibility(
  address: string,
  addressType: AddressType,
  currentRisk: RiskLevel,
  publicKeyExposed: boolean
): Bip360Assessment {
  switch (addressType) {
    case "P2PK":
      return {
        address,
        addressType,
        currentRisk,
        bip360Compatible: false,
        migrationRequired: true,
        postQuantumScheme: "P2QRH (after activation)",
        readiness: "NEEDS_MIGRATION",
        details:
          "P2PK outputs cannot be upgraded in-place. The public key is permanently exposed in the scriptPubKey. " +
          "You must move funds to a new P2QRH address once BIP-360 activates. " +
          "In the interim, migrate to P2WPKH to at least gain hash protection. " +
          "WARNING: If Satoshi's P2PK coins are not moved before quantum computers reach 500K qubits, they are permanently lost.",
      };

    case "P2PKH":
      if (publicKeyExposed) {
        return {
          address,
          addressType,
          currentRisk,
          bip360Compatible: false,
          migrationRequired: true,
          postQuantumScheme: "P2QRH (after activation)",
          readiness: "NEEDS_MIGRATION",
          details:
            "This P2PKH address has been spent from, exposing the public key in the scriptSig. " +
            "Hash protection is broken. Migrate remaining funds to a fresh P2WPKH now, then to P2QRH when BIP-360 activates. " +
            "BIP-360's P2QRH will use CRYSTALS-Dilithium or SQIsign signatures, which are resistant to Shor's algorithm.",
        };
      }
      return {
        address,
        addressType,
        currentRisk,
        bip360Compatible: true,
        migrationRequired: false,
        postQuantumScheme: "P2QRH (when ready)",
        readiness: "READY",
        details:
          "This unspent P2PKH address is hash-protected. The public key has not been exposed. " +
          "When BIP-360 activates, you can safely migrate to P2QRH by spending directly to a quantum-resistant output. " +
          "Do NOT spend from this address until P2QRH is available — spending reveals the public key. " +
          "Recommended: wait for BIP-360, then sweep entire balance to P2QRH in a single transaction.",
      };

    case "P2WPKH":
      if (publicKeyExposed) {
        return {
          address,
          addressType,
          currentRisk,
          bip360Compatible: false,
          migrationRequired: true,
          postQuantumScheme: "P2QRH (after activation)",
          readiness: "NEEDS_MIGRATION",
          details:
            "This P2WPKH address has been spent from, exposing the public key in witness data. " +
            "Migrate remaining funds to a fresh P2WPKH now, then to P2QRH when BIP-360 activates.",
        };
      }
      return {
        address,
        addressType,
        currentRisk,
        bip360Compatible: true,
        migrationRequired: false,
        postQuantumScheme: "P2QRH (when ready)",
        readiness: "READY",
        details:
          "This unspent P2WPKH address is hash-protected via its 20-byte witness program. " +
          "Safe to hold until BIP-360 activates. Then migrate to P2QRH. Do not spend before migration.",
      };

    case "P2TR":
      return {
        address,
        addressType,
        currentRisk,
        bip360Compatible: true,
        migrationRequired: true,
        postQuantumScheme: "P2QRH or P2TR with post-quantum script-path",
        readiness: "NEEDS_MIGRATION",
        details:
          "P2TR exposes a tweaked public key in the output. While BIP-360 proposes quantum-resistant script-path options for Taproot, " +
          "the key-path spend remains vulnerable. Migration options: " +
          "(1) Move to P2QRH when activated. " +
          "(2) Use Taproot script-path-only spending with a post-quantum signature scheme once available. " +
          "BIP-360 is specifically designed to extend Taproot's script tree with quantum-safe leaf scripts.",
      };

    case "P2SH":
      return {
        address,
        addressType,
        currentRisk,
        bip360Compatible: true,
        migrationRequired: false,
        postQuantumScheme: "P2QRH (recommended over P2SH wrapping)",
        readiness: "READY",
        details:
          "P2SH can theoretically wrap post-quantum scripts, but this is not efficient. " +
          "BIP-360's P2QRH is the recommended migration target. If the redeem script has not been revealed, " +
          "this address is hash-protected and can wait for BIP-360 activation.",
      };

    case "P2WSH":
      return {
        address,
        addressType,
        currentRisk,
        bip360Compatible: true,
        migrationRequired: false,
        postQuantumScheme: "P2QRH (recommended over P2WSH wrapping)",
        readiness: "READY",
        details:
          "P2WSH uses SHA-256 hashing for the witness script, providing stronger hash protection than P2SH. " +
          "Can wrap post-quantum scripts but P2QRH is more efficient. Safe to hold until BIP-360 activates if unspent.",
      };
  }
}
