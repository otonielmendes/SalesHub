"use client";

import { useState } from "react";
import { ChevronRight, Home01, Upload01, BarChart01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { ComparativoTab } from "./tabs/ComparativoTab";
import { FraudIntelligenceTab } from "./tabs/FraudIntelligenceTab";
import { BlocklistExportTab } from "./tabs/BlocklistExportTab";
import { InsightsTab } from "./tabs/InsightsTab";
import { cx } from "@/utils/cx";
import type { AiInsights, BacktestMetrics } from "@/types/backtest";

type Tab = "comparativo" | "fraud" | "blocklist" | "insights";

export type InsightsFetchState = "idle" | "loading" | "ready" | "error";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type BreadcrumbSource = "testagens" | "historico";

interface BacktestDashboardProps {
  metrics: BacktestMetrics;
  insights: AiInsights | null;
  insightsFetchState?: InsightsFetchState;
  insightsErrorMessage?: string | null;
  fileName: string;
  savedId: string | null;
  saveStatus: SaveStatus;
  source?: BreadcrumbSource;
  onReset: () => void;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-quaternary">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-quaternary" />
        Salvando…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-xs font-medium text-success-800">
        <span className="h-1.5 w-1.5 rounded-full bg-success-800" />
        Salvo no histórico
      </span>
    );
  }
  if (status === "error") {
    return <span className="text-xs text-error-800">Erro ao salvar</span>;
  }
  return null;
}

export function BacktestDashboard({
  metrics,
  insights,
  insightsFetchState = "idle",
  insightsErrorMessage,
  fileName,
  savedId: _savedId,
  saveStatus,
  source = "testagens",
  onReset,
}: BacktestDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("comparativo");

  const prospectName = fileName.replace(/\.csv$/i, "").replace(/[-_]/g, " ");
  const parentLabel = source === "historico" ? "Histórico" : "Testagens";

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
      {/* ── Breadcrumb bar ── */}
      <div className="border-b border-secondary bg-primary">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-1.5 text-sm">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center text-quaternary transition-colors hover:text-secondary"
            >
              <Home01 className="size-4" />
            </button>
            <ChevronRight className="size-3.5 text-quaternary" />
            <button
              type="button"
              onClick={onReset}
              className="text-quaternary transition-colors hover:text-secondary"
            >
              Backtests
            </button>
            <ChevronRight className="size-3.5 text-quaternary" />
            <button
              type="button"
              onClick={onReset}
              className="text-quaternary transition-colors hover:text-secondary"
            >
              {parentLabel}
            </button>
            <ChevronRight className="size-3.5 text-quaternary" />
            <span className="font-medium text-brand-700">{prospectName}</span>
          </nav>

          <SaveStatusBadge status={saveStatus} />
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="mx-auto w-full max-w-[1280px] px-6 py-6">

        {/* Context card — fundo amarelo */}
        <div className="mb-4 overflow-hidden rounded-xl border border-warning-200 bg-warning-50 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">Análise comparativa</span>
                <Badge type="pill-color" color="warning" size="sm">Análise comparativa</Badge>
                <Badge type="pill-color" color="gray" size="sm">Time de modelos</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <BarChart01 className="size-3.5" />
                  {fileName}
                </span>
                <span>{metrics.totalRows.toLocaleString("pt-BR")} transações</span>
                {fraudCount !== undefined && (
                  <span className="font-medium text-error-700">
                    {fraudCount.toLocaleString("pt-BR")} fraudes
                  </span>
                )}
                {metrics.totalGmv != null && metrics.totalRows > 0 && (
                  <span>Ticket médio: {fmtCompact(metrics.totalGmv / metrics.totalRows)}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-lg border border-warning-300 bg-white/70 px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white"
            >
              <Upload01 className="size-4" />
              Novo teste
            </button>
          </div>
        </div>

        {/* ── Tab strip — abaixo do card ── */}
        <div className="mb-6 border-b border-secondary">
          <nav className="flex items-center gap-0">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cx(
                  "relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-brand-700 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t-full after:bg-brand-600"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cx(
                      "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                      activeTab === tab.id
                        ? "bg-brand-100 text-brand-700"
                        : "bg-gray-100 text-gray-600",
                    )}
                  >
                    {tab.badge.toLocaleString("pt-BR")}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Tab panels ── */}
        <div>
          {activeTab === "comparativo" && <ComparativoTab metrics={metrics} />}
          {activeTab === "fraud" && <FraudIntelligenceTab metrics={metrics} />}
          {activeTab === "blocklist" && (
            <BlocklistExportTab metrics={metrics} prospectName={prospectName} />
          )}
          {activeTab === "insights" && (
            <InsightsTab
              insights={insights}
              fetchState={insightsFetchState}
              errorMessage={insightsErrorMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
