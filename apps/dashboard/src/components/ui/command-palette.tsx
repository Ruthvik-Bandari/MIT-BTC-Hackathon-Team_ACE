"use client";

import { useState } from "react";
import { Shield, ScanLine, Zap, Home, Search } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { Input } from "@/components/ui/input";
import { Fade } from "@/components/animate-ui/primitives/effects/fade";

const commands = [
  { label: "Dashboard", href: "/", icon: Home, shortcut: "⌘D" },
  { label: "Guardian Chat", href: "/guardian", icon: Shield, shortcut: "⌘G" },
  { label: "Quantum Scanner", href: "/scanner", icon: ScanLine, shortcut: "⌘S" },
  { label: "Lightning Payment", href: "/guardian", icon: Zap },
];

export function CommandPalette() {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const [query, setQuery] = useState("");

  if (activeModal !== "command-palette") return null;

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
      onClick={closeModal}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <Fade>
        <div
          className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Search className="size-4 text-muted-foreground" />
            <Input
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:border-transparent"
              autoFocus
            />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No commands found
              </p>
            ) : (
              filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <a
                    key={cmd.label}
                    href={cmd.href}
                    onClick={closeModal}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-4 text-muted-foreground" />
                      {cmd.label}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </a>
                );
              })
            )}
          </div>
        </div>
      </Fade>
    </div>
  );
}
