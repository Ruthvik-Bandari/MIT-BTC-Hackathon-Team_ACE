"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "@/stores/wallet.store";
import { useChatStore } from "@/stores/chat.store";
import type { WsMessage, WsEventType, Transaction } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001/ws";
const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queryClient = useQueryClient();
  const addPendingTransaction = useWalletStore((s) => s.addPendingTransaction);
  const updateTransaction = useWalletStore((s) => s.updateTransaction);
  const addGuardianMessage = useChatStore((s) => s.addGuardianMessage);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(String(event.data)) as WsMessage;

        switch (msg.type as WsEventType) {
          case "transaction:pending": {
            const tx = msg.payload as Transaction;
            addPendingTransaction(tx);
            void queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
            break;
          }
          case "transaction:approved":
          case "transaction:executed": {
            const tx = msg.payload as Transaction;
            updateTransaction(tx.id, { status: tx.status });
            void queryClient.invalidateQueries({ queryKey: ["wallet"] });
            break;
          }
          case "transaction:denied": {
            const tx = msg.payload as Transaction;
            updateTransaction(tx.id, { status: "denied" });
            void queryClient.invalidateQueries({ queryKey: ["wallet"] });
            break;
          }
          case "guardian:response": {
            const data = msg.payload as { content: string; intent?: string };
            addGuardianMessage(data.content);
            break;
          }
          case "scanner:complete": {
            void queryClient.invalidateQueries({ queryKey: ["scanner"] });
            break;
          }
          case "lightning:settled": {
            void queryClient.invalidateQueries({ queryKey: ["lightning"] });
            void queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] });
            break;
          }
        }
      } catch {
        // Ignore malformed messages
      }
    },
    [queryClient, addPendingTransaction, updateTransaction, addGuardianMessage]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      console.log("[WS] Connected");
      reconnectDelayRef.current = RECONNECT_DELAY;
    });

    ws.addEventListener("message", handleMessage);

    ws.addEventListener("close", () => {
      console.log("[WS] Disconnected, reconnecting...");
      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 1.5,
          MAX_RECONNECT_DELAY
        );
        connect();
      }, reconnectDelayRef.current);
    });

    ws.addEventListener("error", () => {
      ws.close();
    });
  }, [handleMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
