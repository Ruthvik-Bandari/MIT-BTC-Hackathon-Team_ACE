import Anthropic from "@anthropic-ai/sdk";
import {
  GuardianResponseSchema,
  type GuardianResponse,
  type WalletContext,
} from "../types/guardian.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 1024;

// ─── System Prompt ──────────────────────────────────────────────────────────

/**
 * System prompt that instructs Claude to act as the SatsGuard AI guardian.
 * Claude parses natural language into structured intents for wallet operations.
 *
 * Supported intents:
 * - SET_POLICY: Configure AI spending limits
 * - SEND_PAYMENT: Initiate a Bitcoin transaction
 * - CHECK_BALANCE: Query wallet balance
 * - SCAN_QUANTUM: Trigger quantum vulnerability scan
 * - APPROVE_TRANSACTION: Approve a pending transaction
 * - DENY_TRANSACTION: Deny a pending transaction
 * - CHAT: General conversation / help
 */
const GUARDIAN_SYSTEM_PROMPT = `You are SatsGuard, an AI-powered Bitcoin financial guardian. You protect users' Bitcoin from rogue AI agents and quantum computer attacks. You operate on signet/testnet only — never mainnet.

Your job is to parse the user's natural language message into a structured action. You MUST respond with ONLY a valid JSON object (no markdown fences, no extra text). The JSON must follow this exact schema:

{
  "action": one of ["SET_POLICY", "SEND_PAYMENT", "CHECK_BALANCE", "SCAN_QUANTUM", "APPROVE_TRANSACTION", "DENY_TRANSACTION", "CHAT"],
  "params": { ... action-specific parameters },
  "message": "A friendly, concise response to the user explaining what you're doing",
  "warnings": ["Array of warning strings, if any risks detected"]
}

## Intent Classification Rules

**SET_POLICY** — User wants to set or modify AI spending limits.
- Triggers: "set limit", "allow spending", "let my AI spend", "change policy", "daily limit", "spending cap"
- params: { "dailyLimitSats": <number>, "requireApprovalAboveSats": <number or null> }
- If user says "up to X sats per day", set dailyLimitSats to X.
- If user specifies an approval threshold, set requireApprovalAboveSats. Otherwise omit it.

**SEND_PAYMENT** — User wants to send Bitcoin.
- Triggers: "send", "pay", "transfer", "move funds to"
- params: { "toAddress": "<bitcoin address>", "amountSats": <number> }
- CRITICAL: If the destination address appears in the wallet context with quantumRisk of CRITICAL or HIGH, add a warning: "Destination address has [LEVEL] quantum risk — public key is exposed. Consider migrating to a quantum-safe address first."
- If amountSats exceeds the daily policy limit or remaining daily budget, add a warning about policy limits.
- If amountSats exceeds the wallet balance, add a warning about insufficient funds.

**CHECK_BALANCE** — User wants to know their wallet balance.
- Triggers: "balance", "how much", "what do I have", "funds"
- params: {}

**SCAN_QUANTUM** — User wants to scan wallet addresses for quantum vulnerability.
- Triggers: "scan", "quantum risk", "check vulnerability", "quantum safe", "vulnerable"
- params: {}
- If wallet context already contains addresses with CRITICAL or HIGH risk, proactively mention them in the message.

**APPROVE_TRANSACTION** — User wants to approve a pending transaction.
- Triggers: "approve", "confirm", "go ahead", "yes send it", "authorize"
- params: { "txId": "<transaction ID if specified, otherwise the most recent pending tx>" }
- If no pending transactions exist, set action to CHAT and explain there's nothing to approve.

**DENY_TRANSACTION** — User wants to deny/reject a pending transaction.
- Triggers: "deny", "reject", "cancel", "don't send", "stop that"
- params: { "txId": "<transaction ID if specified, otherwise the most recent pending tx>" }
- If no pending transactions exist, set action to CHAT and explain there's nothing to deny.

**CHAT** — General conversation, help requests, or anything that doesn't match above intents.
- params: {}
- Be helpful. Explain what SatsGuard can do. Reference quantum risks from the Google whitepaper (6.9M BTC with exposed keys, 9-minute attack window, <500K qubits needed).

## Wallet Context Awareness

You will receive the user's wallet context including:
- Current balance in sats
- Active spending policy (daily limit, amount spent today)
- List of wallet addresses with their quantum risk levels
- Pending transactions awaiting approval

Use this context to:
1. Validate transactions against policy limits
2. Warn about quantum-vulnerable addresses
3. Reference specific pending transactions when user says "approve/deny that"
4. Provide accurate balance information

## Quantum Risk Intelligence

Based on Google Quantum AI's March 2026 whitepaper:
- P2PK addresses: CRITICAL risk — public key always exposed
- P2PKH/P2WPKH (spent from): HIGH risk — public key revealed in scriptSig/witness
- P2TR: MEDIUM risk — tweaked key visible in output
- Unspent hash-protected: LOW risk — safe at rest
- A Cryptographically Relevant Quantum Computer (CRQC) with <500,000 physical qubits could break secp256k1 in ~9 minutes
- 6.9 million BTC (approximately 1/3 of supply) have exposed public keys

Always warn when transactions involve quantum-vulnerable addresses.

## Response Style
- Be concise but informative
- Use sats as the unit (not BTC)
- Reference specific numbers from wallet context
- Be protective — warn about risks before they happen
- Never reveal internal JSON schema to the user in the message field`;

// ─── Client Initialization ──────────────────────────────────────────────────

let client: Anthropic | null = null;

/**
 * Returns a singleton Anthropic SDK client.
 * Reads ANTHROPIC_API_KEY from environment variables.
 * @throws Error if ANTHROPIC_API_KEY is not set
 */
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

// ─── Core Guardian Function ─────────────────────────────────────────────────

/**
 * Sends a user message to Claude for intent parsing and returns a structured
 * GuardianResponse with the parsed action, parameters, message, and warnings.
 *
 * @param userMessage - The natural language message from the user
 * @param walletContext - Current wallet state for contextual awareness
 * @returns Parsed GuardianResponse with action, params, message, and warnings
 * @throws Error if Claude API call fails or response cannot be parsed
 *
 * @example
 * ```ts
 * const response = await parseGuardianIntent(
 *   "Send 5000 sats to tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
 *   walletContext
 * );
 * // response.action === "SEND_PAYMENT"
 * // response.params === { toAddress: "tb1q...", amountSats: 5000 }
 * ```
 */
export async function parseGuardianIntent(
  userMessage: string,
  walletContext: WalletContext,
): Promise<GuardianResponse> {
  const anthropic = getClient();

  const contextSummary = formatWalletContext(walletContext);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: GUARDIAN_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## Current Wallet Context\n${contextSummary}\n\n## User Message\n${userMessage}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = extractJSON(textBlock.text);
  const validated = GuardianResponseSchema.parse(parsed);

  return validated;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formats wallet context into a human-readable summary for Claude's context window.
 * This gives Claude the information it needs to make contextual decisions about
 * policy limits, quantum risks, and pending transactions.
 *
 * @param ctx - The current wallet context from the frontend
 * @returns Formatted string summary of wallet state
 */
function formatWalletContext(ctx: WalletContext): string {
  const lines: string[] = [
    `Network: ${ctx.network}`,
    `Balance: ${ctx.balanceSats.toLocaleString()} sats`,
    `Daily spending limit: ${ctx.policy.dailyLimitSats.toLocaleString()} sats`,
    `Spent today: ${ctx.policy.spentTodaySats.toLocaleString()} sats`,
    `Remaining daily budget: ${(ctx.policy.dailyLimitSats - ctx.policy.spentTodaySats).toLocaleString()} sats`,
    `Approval required above: ${ctx.policy.requireApprovalAboveSats.toLocaleString()} sats`,
    `Co-signer enabled: ${ctx.policy.coSignerEnabled}`,
  ];

  if (ctx.addresses.length > 0) {
    lines.push("", "Wallet Addresses:");
    for (const addr of ctx.addresses) {
      lines.push(
        `  - ${addr.address} | Type: ${addr.type} | Spent: ${addr.hasBeenSpent} | Balance: ${addr.balanceSats.toLocaleString()} sats | Quantum Risk: ${addr.quantumRisk}`,
      );
    }
  }

  if (ctx.pendingTransactions.length > 0) {
    lines.push("", "Pending Transactions:");
    for (const tx of ctx.pendingTransactions) {
      lines.push(
        `  - TX ${tx.txId} | To: ${tx.toAddress} | Amount: ${tx.amountSats.toLocaleString()} sats | Status: ${tx.status} | Created: ${tx.createdAt}`,
      );
    }
  } else {
    lines.push("", "No pending transactions.");
  }

  return lines.join("\n");
}

/**
 * Extracts a JSON object from Claude's response text. Handles cases where
 * the response may be wrapped in markdown code fences (```json ... ```)
 * or contain leading/trailing whitespace.
 *
 * @param text - Raw text response from Claude
 * @returns Parsed JSON object
 * @throws Error if no valid JSON can be extracted
 */
function extractJSON(text: string): unknown {
  const trimmed = text.trim();

  // Try direct parse first (most common case — Claude follows instructions)
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to fence extraction
  }

  // Extract from markdown code fences: ```json { ... } ``` or ``` { ... } ```
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/;
  const match = fencePattern.exec(trimmed);
  if (match?.[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch {
      // Fall through to brace extraction
    }
  }

  // Last resort: find the first { ... } block
  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    const jsonSlice = trimmed.slice(braceStart, braceEnd + 1);
    return JSON.parse(jsonSlice);
  }

  throw new Error(`Failed to extract JSON from Claude response: ${trimmed.slice(0, 200)}`);
}

// ─── Quantum Risk Pre-screening ─────────────────────────────────────────────

/**
 * Pre-screens a guardian response for quantum risk warnings before returning
 * to the frontend. Adds server-side warnings that Claude may have missed,
 * particularly for SEND_PAYMENT actions targeting vulnerable addresses.
 *
 * This provides defense-in-depth — Claude is instructed to add warnings in
 * the system prompt, but this function ensures they're always present even
 * if Claude's response is incomplete.
 *
 * @param response - The parsed guardian response from Claude
 * @param walletContext - Current wallet state with address risk data
 * @returns The response with any additional quantum risk warnings appended
 */
export function enrichWithQuantumWarnings(
  response: GuardianResponse,
  walletContext: WalletContext,
): GuardianResponse {
  const warnings = [...response.warnings];

  if (response.action === "SEND_PAYMENT") {
    const toAddress = (response.params as Record<string, unknown>)["toAddress"];
    const amountSats = (response.params as Record<string, unknown>)["amountSats"];

    if (typeof toAddress === "string") {
      // Check if destination address is in wallet and has quantum risk
      const destAddr = walletContext.addresses.find((a) => a.address === toAddress);
      if (destAddr && (destAddr.quantumRisk === "CRITICAL" || destAddr.quantumRisk === "HIGH")) {
        const riskWarning = `QUANTUM RISK: Destination address has ${destAddr.quantumRisk} quantum risk (${destAddr.type}, ${destAddr.hasBeenSpent ? "public key exposed" : "key exposure pending"}). Consider migrating to a fresh P2WPKH address first.`;
        if (!warnings.some((w) => w.includes("quantum") || w.includes("QUANTUM"))) {
          warnings.push(riskWarning);
        }
      }
    }

    if (typeof amountSats === "number") {
      // Check policy limits server-side
      const remaining = walletContext.policy.dailyLimitSats - walletContext.policy.spentTodaySats;
      if (amountSats > remaining) {
        const policyWarning = `POLICY: This transaction (${amountSats.toLocaleString()} sats) exceeds your remaining daily budget (${remaining.toLocaleString()} sats). Requires manual approval.`;
        if (!warnings.some((w) => w.includes("POLICY") || w.includes("policy"))) {
          warnings.push(policyWarning);
        }
      }

      // Check insufficient funds
      if (amountSats > walletContext.balanceSats) {
        const balanceWarning = `INSUFFICIENT FUNDS: Requested ${amountSats.toLocaleString()} sats but wallet balance is ${walletContext.balanceSats.toLocaleString()} sats.`;
        if (!warnings.some((w) => w.includes("INSUFFICIENT") || w.includes("insufficient"))) {
          warnings.push(balanceWarning);
        }
      }
    }
  }

  if (response.action === "SCAN_QUANTUM") {
    // Proactively summarize known risks
    const criticalAddrs = walletContext.addresses.filter((a) => a.quantumRisk === "CRITICAL");
    const highAddrs = walletContext.addresses.filter((a) => a.quantumRisk === "HIGH");
    if (criticalAddrs.length > 0 || highAddrs.length > 0) {
      const summary = `SCAN PREVIEW: ${criticalAddrs.length} CRITICAL and ${highAddrs.length} HIGH risk addresses detected in wallet. Full scan recommended.`;
      if (!warnings.some((w) => w.includes("SCAN PREVIEW"))) {
        warnings.push(summary);
      }
    }
  }

  return { ...response, warnings };
}

// ─── Streaming Support ──────────────────────────────────────────────────────

/**
 * Streams a guardian response via Server-Sent Events. Uses Claude's streaming
 * API to send text tokens as they arrive, then emits the final parsed action
 * as a structured event.
 *
 * SSE event types:
 * - `token`: Individual text tokens as they stream from Claude
 * - `action`: The final parsed GuardianResponse (JSON)
 * - `error`: Error message if parsing fails
 * - `done`: Stream complete signal
 *
 * @param userMessage - The natural language message from the user
 * @param walletContext - Current wallet state for contextual awareness
 * @param onToken - Callback for each streamed token
 * @param onComplete - Callback with the final parsed GuardianResponse
 * @param onError - Callback if an error occurs
 */
export async function streamGuardianIntent(
  userMessage: string,
  walletContext: WalletContext,
  onToken: (token: string) => void,
  onComplete: (response: GuardianResponse) => void,
  onError: (error: Error) => void,
): Promise<void> {
  const anthropic = getClient();
  const contextSummary = formatWalletContext(walletContext);

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: GUARDIAN_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `## Current Wallet Context\n${contextSummary}\n\n## User Message\n${userMessage}`,
        },
      ],
    });

    let fullText = "";

    stream.on("text", (text) => {
      fullText += text;
      onToken(text);
    });

    const finalMessage = await stream.finalMessage();

    const textBlock = finalMessage.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude stream");
    }

    const parsed = extractJSON(textBlock.text);
    const validated = GuardianResponseSchema.parse(parsed);
    const enriched = enrichWithQuantumWarnings(validated, walletContext);

    onComplete(enriched);
  } catch (error: unknown) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

export { GUARDIAN_SYSTEM_PROMPT, extractJSON };
