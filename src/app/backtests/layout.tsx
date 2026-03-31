import type { ReactNode } from "react";
import { KoinHeader } from "@/components/backtest/KoinHeader";

export default function BacktestsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <KoinHeader />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
