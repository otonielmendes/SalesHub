"use client";

import { useState } from "react";
import { Download01, Upload01, BarChart01, RefreshCw01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { ComparativoTab } from "./tabs/ComparativoTab";
import { FraudIntelligenceTab } from "./tabs/FraudIntelligenceTab";
import { BlocklistExportTab } from "./tabs/BlocklistExportTab";
import { cx } from "@/utils/cx";
import type { AiInsights, BacktestMetrics } from "@/types/backtest";
import { DEFAULT_CURRENCY, formatCompact } from "@/lib/csv/currency";

type Tab = "comparativo" | "fraud" | "blocklist";

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
  /** When defined, renders a "Recalcular" button that triggers re-processing of the stored CSV. */
  onRecalculate?: () => Promise<void>;
  /** When defined, shows a "Gerar insights" CTA in the Comparativo tab. */
  onGenerateInsights?: () => void;
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
      <span className="flex items-center gap-1.5 text-xs font-medium text-success-700">
        <span className="h-1.5 w-1.5 rounded-full bg-success-600" />
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
  source: _source = "testagens",
  onReset,
  onRecalculate,
  onGenerateInsights,
}: BacktestDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("comparativo");
  const [recalculating, setRecalculating] = useState(false);
  const [recalcError, setRecalcError] = useState<string | null>(null);

  const handleRecalculate = async () => {
    if (!onRecalculate) return;
    setRecalculating(true);
    setRecalcError(null);
    try {
      await onRecalculate();
    } catch (err) {
      setRecalcError(err instanceof Error ? err.message : "Erro ao recalcular");
    } finally {
      setRecalculating(false);
    }
  };

  const prospectName = fileName.replace(/\.csv$/i, "").replace(/[-_]/g, " ");

  const fraudCount = metrics.confusionMatrix
    ? metrics.confusionMatrix.tp + metrics.confusionMatrix.fn
    : undefined;
  const blocklistCount = metrics.recurrentFraudKoin?.length ?? undefined;

  const tabItems = [
    { id: "comparativo", label: "Comparativo" },
    { id: "fraud", label: "Intelligence", badge: fraudCount },
    { id: "blocklist", label: "Blocklist", badge: blocklistCount },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* ── Content area ── */}
      <div className="mx-auto w-full max-w-[1280px] px-6 py-6">

        {/* Context card — fundo branco */}
        <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">Análise comparativa</span>
                <Badge type="pill-color" color="brand" size="sm">Backtest</Badge>
                <span className="text-sm text-gray-400">Resultado do time de modelos</span>
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
                  <span>
                    Ticket médio:{" "}
                    {formatCompact(
                      metrics.totalGmv / metrics.totalRows,
                      metrics.currency ?? DEFAULT_CURRENCY,
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <SaveStatusBadge status={saveStatus} />
                {onRecalculate && (
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    disabled={recalculating}
                    className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw01 className={cx("size-4", recalculating && "animate-spin")} />
                    {recalculating ? "Recalculando…" : "Recalcular"}
                  </button>
                )}
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Download01 className="size-4" />
                  Exportar PDF
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Upload01 className="size-4" />
                  Novo teste
                </button>
              </div>
              {recalcError && (
                <span className="text-xs text-error-700">{recalcError}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab strip ── */}
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
          {activeTab === "comparativo" && (
            <ComparativoTab
              metrics={metrics}
              insights={insights}
              insightsFetchState={insightsFetchState}
              insightsErrorMessage={insightsErrorMessage}
              onGenerateInsights={onGenerateInsights}
            />
          )}
          {activeTab === "fraud" && <FraudIntelligenceTab metrics={metrics} />}
          {activeTab === "blocklist" && (
            <BlocklistExportTab metrics={metrics} prospectName={prospectName} />
          )}
        </div>
      </div>
    </div>
  );
}
