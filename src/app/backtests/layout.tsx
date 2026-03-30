import type { ReactNode } from "react";
import { KoinHeader } from "@/components/backtest/KoinHeader";

export default function BacktestsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-primary">
      <KoinHeader />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
