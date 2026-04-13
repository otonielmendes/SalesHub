import type { ReactNode } from "react";
import { KoinHeader } from "@/components/backtest/KoinHeader";
import { CalculadoraSubNav } from "./_components/subnav";

export const metadata = {
  title: "Calculadora | Koin Sales Hub",
  description: "Diagnóstico de saúde antifraude e projeção de ROI para merchants",
};

export default function CalculadoraLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <KoinHeader />
      <CalculadoraSubNav />
      <main className="w-full">{children}</main>
    </div>
  );
}
