"use client";

import { useState } from "react";
import { ArrowLeft, Save01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { Badge } from "@/components/base/badges/badges";
import { Tabs, TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import { ComparativoTab } from "./tabs/ComparativoTab";
import { FraudIntelligenceTab } from "./tabs/FraudIntelligenceTab";
import { BlocklistExportTab } from "./tabs/BlocklistExportTab";
import { InsightsTab } from "./tabs/InsightsTab";
import type { AiInsights, BacktestMetrics } from "@/types/backtest";

type Tab = "comparativo" | "fraud" | "blocklist" | "insights";

export type InsightsFetchState = "idle" | "loading" | "ready" | "error";

interface BacktestDashboardProps {
  metrics: BacktestMetrics;
  insights: AiInsights | null;
  insightsFetchState?: InsightsFetchState;
  insightsErrorMessage?: string | null;
  fileName: string;
  rawFile: File | null;
  onReset: () => void;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function BacktestDashboard({
  metrics,
  insights,
  insightsFetchState = "idle",
  insightsErrorMessage,
  fileName,
  rawFile,
  onReset,
}: BacktestDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("comparativo");
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const prospectName = fileName.replace(/\.csv$/i, "").replace(/[-_]/g, " ");

  const handleSave = async () => {
    if (savedId || isSaving || !rawFile) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append("file", rawFile);
      formData.append("prospect_name", prospectName);
      formData.append("metrics", JSON.stringify(metrics));
      if (insights) formData.append("insights", JSON.stringify(insights));

      const res = await fetch("/api/backtest/save", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      const data = (await res.json()) as { id: string };
      setSavedId(data.id);
    } catch {
      setSaveError("Falha ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Badge counts
  const fraudCount = metrics.confusionMatrix
    ? metrics.confusionMatrix.tp + metrics.confusionMatrix.fn
    : undefined;
  const blocklistCount = metrics.recurrentFraudKoin?.length ?? undefined;
  const insightsBadge =
    insightsFetchState === "ready" && insights ? insights.insights.length : undefined;

  const tabItems = [
    { id: "comparativo", label: "Comparativo" },
    { id: "fraud", label: "Intelligence", badge: fraudCount },
    { id: "blocklist", label: "Blocklist", badge: blocklistCount },
    { id: "insights", label: "Insights", badge: insightsBadge },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Dashboard header */}
      <div className="border-b border-secondary bg-primary">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-sm text-tertiary transition-colors hover:text-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Nova testagem
            </button>
            <span className="text-sm text-quaternary">/</span>
            <span className="text-sm font-semibold text-primary">{prospectName}</span>
          </div>

          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-xs text-error-800">{saveError}</span>
            )}
            {savedId ? (
              <span className="flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-xs font-medium text-success-800">
                <span className="h-1.5 w-1.5 rounded-full bg-success-800" />
                Salvo no histórico
              </span>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving || !rawFile}
                className={cx(
                  "flex items-center gap-1.5 rounded-lg border border-secondary px-3 py-2 text-sm font-medium transition-colors",
                  isSaving
                    ? "cursor-not-allowed text-quaternary"
                    : "text-secondary hover:bg-secondary hover:text-primary",
                )}
              >
                <Save01 className="h-4 w-4" />
                {isSaving ? "Salvando…" : "Salvar"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab content area */}
      <div className="mx-auto w-full max-w-[1280px] px-6 py-6">
        {/* Context card */}
        <div className="mb-5 rounded-xl border border-secondary bg-primary p-5 shadow-xs">
          <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
            <span className="text-lg font-semibold text-primary">Análise comparativa</span>
            <Badge type="pill-color" color="brand" size="sm">Backtest</Badge>
            <Badge type="pill-color" color="gray" size="sm">Resultado do time de modelos</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-tertiary">
            <span>{fileName}</span>
            <span>{metrics.totalRows.toLocaleString("pt-BR")} transações</span>
            {fraudCount !== undefined && (
              <span className="font-medium text-error-700">
                {fraudCount.toLocaleString("pt-BR")} fraudes
              </span>
            )}
            {metrics.totalGmv && metrics.totalRows > 0 && (
              <span>Ticket médio: {fmtCompact(metrics.totalGmv / metrics.totalRows)}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as Tab)}
        >
          <TabList
            type="button-border"
            size="sm"
            items={tabItems}
            className="mb-6"
          />

          <TabPanel id="comparativo">
            <ComparativoTab metrics={metrics} />
          </TabPanel>
          <TabPanel id="fraud">
            <FraudIntelligenceTab metrics={metrics} />
          </TabPanel>
          <TabPanel id="blocklist">
            <BlocklistExportTab metrics={metrics} prospectName={prospectName} />
          </TabPanel>
          <TabPanel id="insights">
            <InsightsTab
              insights={insights}
              fetchState={insightsFetchState}
              errorMessage={insightsErrorMessage}
            />
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
