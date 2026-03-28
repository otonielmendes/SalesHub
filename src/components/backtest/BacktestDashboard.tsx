"use client";

import { useState } from "react";
import { ArrowLeft, Save01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { ComparativoTab } from "./tabs/ComparativoTab";
import { FraudIntelligenceTab } from "./tabs/FraudIntelligenceTab";
import { BlocklistExportTab } from "./tabs/BlocklistExportTab";
import type { AiInsights, BacktestMetrics } from "@/types/backtest";

type Tab = "comparativo" | "fraud" | "blocklist";

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

  const TABS: { id: Tab; label: string }[] = [
    { id: "comparativo", label: "Comparativo" },
    { id: "fraud", label: "Fraud Intelligence" },
    { id: "blocklist", label: "Blocklist & Export" },
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

      {/* Stats summary bar */}
      <div className="border-b border-secondary bg-secondary_alt">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-6 px-6 py-3">
          <span className="text-xs text-tertiary">
            <span className="font-mono font-semibold text-primary">
              {metrics.totalRows.toLocaleString("pt-BR")}
            </span>{" "}
            transações
          </span>
          {metrics.confusionMatrix && (
            <span className="text-xs text-tertiary">
              Taxa de detecção:{" "}
              <span className="font-mono font-semibold text-brand-700">
                {(metrics.confusionMatrix.detectionRate * 100).toFixed(1)}%
              </span>
            </span>
          )}
          {metrics.preventedPct !== null && (
            <span className="text-xs text-tertiary">
              Fraude prevenida:{" "}
              <span className="font-mono font-semibold text-success-800">
                {(metrics.preventedPct * 100).toFixed(1)}%
              </span>
            </span>
          )}
          {metrics.recoverableTransactions > 0 && (
            <span className="text-xs text-tertiary">
              Recuperáveis:{" "}
              <span className="font-mono font-semibold text-warning-800">
                {metrics.recoverableTransactions}
              </span>{" "}
              txns
            </span>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {insightsFetchState === "loading" && (
        <div className="border-b border-secondary bg-secondary_alt">
          <div className="mx-auto max-w-[1280px] px-6 py-3">
            <p className="text-xs text-tertiary">Gerando insights com IA…</p>
          </div>
        </div>
      )}
      {insightsFetchState === "error" && (
        <div className="border-b border-secondary bg-warning-50">
          <div className="mx-auto max-w-[1280px] px-6 py-3">
            <p className="text-xs font-semibold text-warning-900">Insights AI indisponíveis</p>
            <p className="mt-0.5 text-xs text-warning-800">
              {insightsErrorMessage ??
                "Verifique GEMINI_API_KEY no servidor ou tente novamente mais tarde."}
            </p>
          </div>
        </div>
      )}
      {insights && insights.insights.length > 0 && (
        <div className="border-b border-secondary bg-brand-25">
          <div className="mx-auto max-w-[1280px] px-6 py-3">
            <p className="mb-2 text-xs font-semibold text-brand-700">
              ✦ Insights AI ({insights.insights.length})
            </p>
            <p className="mb-2 text-[10px] text-brand-600">
              Gerados por modelo de linguagem; podem conter imprecisões.
            </p>
            <div className="flex flex-wrap gap-2">
              {insights.insights.map((insight, i) => (
                <div
                  key={i}
                  className={cx(
                    "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
                    insight.severity === "critical"
                      ? "border-error-200 bg-error-50 text-error-800"
                      : insight.severity === "moderate"
                        ? "border-warning-200 bg-warning-50 text-warning-800"
                        : "border-brand-200 bg-white text-secondary",
                  )}
                >
                  <span className="font-semibold">{insight.title}:</span>
                  <span>{insight.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {insightsFetchState === "ready" && insights && insights.insights.length === 0 && (
        <div className="border-b border-secondary bg-secondary_alt">
          <div className="mx-auto max-w-[1280px] px-6 py-3">
            <p className="text-xs text-tertiary">Nenhum insight retornado para este conjunto de métricas.</p>
          </div>
        </div>
      )}

      {/* Inner tabs */}
      <div className="border-b border-secondary bg-primary">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-tertiary hover:text-secondary",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto w-full max-w-[1280px] px-6 py-8">
        {activeTab === "comparativo" && <ComparativoTab metrics={metrics} />}
        {activeTab === "fraud" && <FraudIntelligenceTab metrics={metrics} />}
        {activeTab === "blocklist" && (
          <BlocklistExportTab metrics={metrics} prospectName={prospectName} />
        )}
      </div>
    </div>
  );
}
