"use client";

import { useMutation } from "@tanstack/react-query";
import { parseCommand } from "@/dal/guardian.dal";
import { getBalance } from "@/dal/wallet.dal";
import { scanAddress } from "@/dal/scanner.dal";
import { useChatStore } from "@/stores/chat.store";
import { useWalletStore } from "@/stores/wallet.store";
import { formatSats } from "@/lib/formatters";
import type { GuardianParseResult } from "@/lib/types";

/**
 * After intent classification, execute the action and enrich the response
 * with real data so the guardian doesn't just say "I'll check" but actually shows results.
 */
async function executeIntent(
  result: GuardianParseResult,
  walletId: string | undefined,
): Promise<{ message: string; intent: GuardianParseResult["intent"] }> {
  const base = result.explanation;

  try {
    switch (result.intent) {
      case "check_balance": {
        if (!walletId) return { message: base, intent: result.intent };
        const data = await getBalance(walletId);
        return {
          message: `${base}\n\nBalance: ${formatSats(data.balance)} sats (${(data.balance / 100_000_000).toFixed(8)} BTC)`,
          intent: result.intent,
        };
      }
      case "scan_address": {
        const addr = result.parameters.address;
        if (!addr) return { message: base, intent: result.intent };
        const assessment = await scanAddress(addr);
        return {
          message: `${base}\n\nAddress: ${addr}\nType: ${assessment.addressType}\nRisk: ${assessment.riskLevel}\nKey exposed: ${assessment.publicKeyExposed ? "Yes" : "No"}\nSpent: ${assessment.hasBeenSpent ? "Yes" : "No"}\n\n${assessment.recommendation}`,
          intent: result.intent,
        };
      }
      default:
        return { message: base, intent: result.intent };
    }
  } catch {
    // If the follow-up action fails, still show the original explanation
    return { message: base, intent: result.intent };
  }
}

export function useGuardian() {
  const { addUserMessage, addGuardianMessage, setLoading } = useChatStore();
  const activeWallet = useWalletStore((s) => s.activeWallet);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      const result = await parseCommand(message);
      return executeIntent(result, activeWallet?.id);
    },
    onMutate: () => setLoading(true),
    onSuccess: ({ message, intent }) => {
      addGuardianMessage(message, intent);
    },
    onError: (error: Error) => {
      addGuardianMessage(`Sorry, something went wrong: ${error.message}`);
    },
    onSettled: () => setLoading(false),
  });

  function sendMessage(content: string) {
    addUserMessage(content);
    mutation.mutate(content);
  }

  return {
    sendMessage,
    isPending: mutation.isPending,
  };
}
