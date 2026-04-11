"use client";

import type { ReactNode } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

function WebSocketConnector() {
  useWebSocket();
  return null;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <WebSocketConnector />
      {children}
    </>
  );
}
