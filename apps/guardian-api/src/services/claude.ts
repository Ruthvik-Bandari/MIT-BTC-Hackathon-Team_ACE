import Anthropic from "@anthropic-ai/sdk";
import type { GuardianParseResult, GuardianIntent } from "../utils/types.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export class ClaudeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeError";
  }
}

const SYSTEM_PROMPT = `You are BitShield, an AI Bitcoin guardian. Parse the user's message and determine their intent.

You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no extra text before or after. The JSON must match this exact schema:

{"intent":"<one of: send, check_balance, set_policy, scan_address, scan_wallet, pay_lightning, explain_risk, unknown>","confidence":<number 0-1>,"parameters":{<key-value pairs extracted from the message>},"explanation":"<brief response to the user explaining what you understood and what action will be taken>"}

Intent definitions:
- send: User wants to send BTC to an address
- check_balance: User wants to see their wallet balance
- set_policy: User wants to change spending limits or approval requirements
- scan_address: User wants to check a specific address for quantum vulnerability
- scan_wallet: User wants to scan all wallet addresses
- pay_lightning: User wants to pay a Lightning invoice
- explain_risk: User wants to understand quantum risk or security concepts
- unknown: Cannot determine intent

Extract relevant parameters like addresses, amounts (in sats), invoice strings, policy values.
Always respond in a helpful, security-conscious tone. This is signet/testnet only.
CRITICAL: Output raw JSON only. No markdown. No \`\`\`json blocks. No explanatory text outside the JSON.`;

export async function parseIntent(message: string): Promise<GuardianParseResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new ClaudeError("ANTHROPIC_API_KEY not configured");
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: message }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new ClaudeError("No text response from Claude");
  }

  try {
    // Strip markdown code fences if Claude wraps the JSON
    let rawText = textBlock.text.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(rawText) as {
      intent: string;
      confidence: number;
      parameters: Record<string, string>;
      explanation: string;
    };

    const validIntents: GuardianIntent[] = [
      "send",
      "check_balance",
      "set_policy",
      "scan_address",
      "scan_wallet",
      "pay_lightning",
      "explain_risk",
      "unknown",
    ];

    const intent: GuardianIntent = validIntents.includes(parsed.intent as GuardianIntent)
      ? (parsed.intent as GuardianIntent)
      : "unknown";

    return {
      intent,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      parameters: parsed.parameters ?? {},
      explanation: parsed.explanation ?? "I understood your request.",
    };
  } catch {
    throw new ClaudeError("Failed to parse Claude response as JSON");
  }
}
