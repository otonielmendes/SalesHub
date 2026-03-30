"use client";

import { useRouter } from "next/navigation";
import { BacktestDashboard } from "@/components/backtest/BacktestDashboard";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";

interface Props {
  metrics: BacktestMetrics;
  insights: AiInsights | null;
  fileName: string;
  savedId: string;
}

export function HistoricoDetailClient({ metrics, insights, fileName, savedId }: Props) {
  const router = useRouter();

  return (
    <BacktestDashboard
      metrics={metrics}
      insights={insights}
      insightsFetchState={insights ? "ready" : "idle"}
      fileName={fileName}
      savedId={savedId}
      saveStatus="saved"
      source="historico"
      onReset={() => router.push("/backtests/historico")}
    />
  );
}
