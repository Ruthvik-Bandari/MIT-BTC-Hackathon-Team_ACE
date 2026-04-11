"use client";

import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useChatStore } from "@/stores/chat.store";
import { useGuardian } from "@/hooks/useGuardian";
import { guardianCommandSchema, type GuardianCommandInput } from "@/schemas/guardian.schema";
import { MessageBubble } from "./MessageBubble";
import { IntentIndicator } from "./IntentIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypingText } from "@/components/animate-ui/primitives/texts/typing";

export function GuardianChat() {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const { sendMessage } = useGuardian();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset } = useForm<GuardianCommandInput>({
    resolver: zodResolver(guardianCommandSchema),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function onSubmit(data: GuardianCommandInput) {
    sendMessage(data.message);
    reset();
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <TypingText
              text="Ask the guardian to manage your wallet, scan addresses, or send payments."
              className="text-muted-foreground text-sm"
            />
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble role={msg.role} content={msg.content} timestamp={msg.timestamp} />
            {msg.intent && msg.role === "guardian" && (
              <IntentIndicator intent={msg.intent} />
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 animate-pulse rounded-full bg-orange-500" />
            Guardian is thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <Input
          {...register("message")}
          placeholder="Tell the guardian what to do..."
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
