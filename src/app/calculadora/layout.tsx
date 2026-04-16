import type { ReactNode } from "react";
import { KoinHeader } from "@/components/backtest/KoinHeader";

export const metadata = {
  title: "Koin Sales Hub",
  description: "Diagnóstico de saúde antifraude e projeção de ROI para merchants",
};

export default function CalculadoraLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <KoinHeader />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
