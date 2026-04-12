import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { HotkeysProvider } from "@/providers/HotkeysProvider";
import { Navbar } from "@/components/ui/navbar";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "BitShield — AI-Powered Bitcoin Guardian",
  description:
    "Quantum-resistant Bitcoin wallet guardian with AI-powered transaction management and real-time risk assessment.",
  openGraph: {
    title: "BitShield",
    description: "AI-Powered Bitcoin Guardian with Quantum Defense",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("dark", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          <ThemeProvider>
            <WebSocketProvider>
              <HotkeysProvider>
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                </div>
              </HotkeysProvider>
            </WebSocketProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
