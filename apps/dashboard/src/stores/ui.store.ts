import { create } from "zustand";

type Theme = "dark" | "light";

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  activeModal: string | null;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: "dark",
  sidebarOpen: true,
  activeModal: null,

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "light" : "dark",
    })),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  openModal: (activeModal) => set({ activeModal }),

  closeModal: () => set({ activeModal: null }),
}));
