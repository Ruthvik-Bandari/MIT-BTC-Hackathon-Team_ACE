import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SatsGuard — AI Bitcoin Guardian",
  description: "AI-powered Bitcoin guardian with quantum defense. Protect your sats from quantum threats.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
