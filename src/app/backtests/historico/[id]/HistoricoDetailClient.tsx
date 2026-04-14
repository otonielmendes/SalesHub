"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BacktestDashboard, type InsightsFetchState } from "@/components/backtest/BacktestDashboard";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";

interface Props {
  metrics: BacktestMetrics;
  insights: AiInsights | null;
  fileName: string;
  savedId: string;
  hasFile: boolean;
}

export function HistoricoDetailClient({ metrics, insights: initialInsights, fileName, savedId, hasFile }: Props) {
  const router = useRouter();
  const tDashboard = useTranslations("backtests.dashboard");

  const [insights, setInsights] = useState<AiInsights | null>(initialInsights);
  const [insightsFetchState, setInsightsFetchState] = useState<InsightsFetchState>(
    initialInsights ? "ready" : "idle",
  );
  const [insightsErrorMessage, setInsightsErrorMessage] = useState<string | null>(null);

  const handleGenerateInsights = useCallback(async () => {
    setInsightsFetchState("loading");
    setInsightsErrorMessage(null);
    try {
      const res = await fetch("/api/backtest/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics }),
      });
      const data = (await res.json()) as { insights?: AiInsights; error?: string };
      if (!res.ok) {
        setInsightsFetchState("error");
        setInsightsErrorMessage(data.error ?? tDashboard("errors.http", { status: res.status }));
        return;
      }
      if (data.insights) {
        setInsights(data.insights);
        fetch("/api/backtest/save", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: savedId, insights: data.insights }),
        }).catch(() => {});
      }
      setInsightsFetchState("ready");
    } catch {
      setInsightsFetchState("error");
      setInsightsErrorMessage(tDashboard("errors.networkInsights"));
    }
  }, [metrics, savedId, tDashboard]);

  const handleRecalculate = hasFile
    ? async () => {
        const res = await fetch("/api/backtest/recalculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: savedId }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? tDashboard("errors.recalculate"));
        }
        router.refresh();
      }
    : undefined;

  return (
    <BacktestDashboard
      metrics={metrics}
      insights={insights}
      insightsFetchState={insightsFetchState}
      insightsErrorMessage={insightsErrorMessage}
      fileName={fileName}
      savedId={savedId}
      saveStatus="saved"
      source="historico"
      onReset={() => router.push("/backtests/historico")}
      onRecalculate={handleRecalculate}
      onGenerateInsights={insightsFetchState === "idle" ? handleGenerateInsights : undefined}
    />
  );
}
