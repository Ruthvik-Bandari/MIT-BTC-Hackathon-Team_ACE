"use client";

import type { ReactNode } from "react";
import { useAppHotkeys } from "@/hooks/useHotkeys";
import { CommandPalette } from "@/components/ui/command-palette";

function HotkeysConnector() {
  useAppHotkeys();
  return null;
}

export function HotkeysProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <HotkeysConnector />
      <CommandPalette />
      {children}
    </>
  );
}
