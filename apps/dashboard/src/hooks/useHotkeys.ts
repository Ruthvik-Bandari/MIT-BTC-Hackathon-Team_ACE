"use client";

import { useHotkeys } from "@tanstack/react-hotkeys";
import { useUiStore } from "@/stores/ui.store";

export function useAppHotkeys() {
  const { openModal } = useUiStore();

  useHotkeys([
    {
      hotkey: "Mod+K",
      callback: (e) => {
        e.preventDefault();
        openModal("command-palette");
      },
    },
    {
      hotkey: "Mod+S",
      callback: (e) => {
        e.preventDefault();
        window.location.href = "/scanner";
      },
    },
    {
      hotkey: "Mod+G",
      callback: (e) => {
        e.preventDefault();
        window.location.href = "/guardian";
      },
    },
    {
      hotkey: "Escape",
      callback: () => {
        useUiStore.getState().closeModal();
      },
    },
  ]);
}
