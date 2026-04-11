"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/guardian", label: "Guardian" },
  { href: "/scanner", label: "Scanner" },
];

export function Navbar() {
  const pathname = usePathname();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 ring-1 ring-orange-500/20 transition-all duration-300 group-hover:bg-orange-500/15 group-hover:ring-orange-500/30">
            <Shield className="size-3.5 text-orange-400" />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground/90">
            SatsGuard
          </span>
          <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground/60 uppercase ring-1 ring-border/50">
            signet
          </span>
        </Link>

        {/* Navigation + Actions */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-1.5 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-200",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground/70 hover:text-foreground/80"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-1.5 -bottom-[7.5px] h-px bg-foreground/40" />
                )}
              </Link>
            );
          })}

          <div className="ml-2 h-4 w-px bg-border/50" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="ml-2 flex size-7 items-center justify-center rounded-lg text-muted-foreground/60 transition-all duration-200 hover:bg-muted/60 hover:text-foreground/80 active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-3.5" />
            ) : (
              <Moon className="size-3.5" />
            )}
          </button>

          <kbd className="ml-1.5 hidden items-center gap-0.5 rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/40 ring-1 ring-border/40 sm:inline-flex">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        </div>
      </nav>
    </header>
  );
}
