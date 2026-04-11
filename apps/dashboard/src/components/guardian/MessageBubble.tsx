"use client";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";

interface MessageBubbleProps {
  role: "user" | "guardian";
  content: string;
  timestamp: string;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <Slide direction={isUser ? "right" : "left"}>
      <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
            isUser
              ? "bg-foreground/90 text-background"
              : "bg-muted/60 text-foreground/85 ring-1 ring-border/30"
          )}
        >
          <p className="whitespace-pre-wrap">{content}</p>
          <p
            className={cn(
              "mt-1.5 text-[10px]",
              isUser ? "text-background/40" : "text-muted-foreground/50"
            )}
          >
            {formatRelativeTime(timestamp)}
          </p>
        </div>
      </div>
    </Slide>
  );
}
