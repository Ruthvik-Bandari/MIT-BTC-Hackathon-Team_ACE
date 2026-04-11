"use client";

import { useMutation } from "@tanstack/react-query";
import { parseCommand } from "@/dal/guardian.dal";
import { useChatStore } from "@/stores/chat.store";

export function useGuardian() {
  const { addUserMessage, addGuardianMessage, setLoading } = useChatStore();

  const mutation = useMutation({
    mutationFn: parseCommand,
    onMutate: () => setLoading(true),
    onSuccess: (result) => {
      addGuardianMessage(result.explanation, result.intent);
    },
    onError: (error: Error) => {
      addGuardianMessage(`Error: ${error.message}`);
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
