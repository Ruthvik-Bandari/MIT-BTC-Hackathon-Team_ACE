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
            "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap">{content}</p>
          <p
            className={cn(
              "mt-1 text-xs",
              isUser ? "text-primary-foreground/60" : "text-muted-foreground"
            )}
          >
            {formatRelativeTime(timestamp)}
          </p>
        </div>
      </div>
    </Slide>
  );
}
