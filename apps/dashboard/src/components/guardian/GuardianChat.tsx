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
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-5">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <TypingText
              text="Ask BitShield to manage your wallet, scan addresses, or send payments."
              className="text-muted-foreground/60 text-[13px]"
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
          <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground/60">
            <span className="size-1.5 animate-pulse rounded-full bg-orange-400/80" />
            Guardian is thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center gap-2.5 border-t border-border/40 p-4"
      >
        <Input
          {...register("message")}
          placeholder="Tell the guardian what to do..."
          autoComplete="off"
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="ghost" disabled={isLoading}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
