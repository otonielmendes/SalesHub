"use client";

import Link from "next/link";
import { useState } from "react";
import { Download01, File02, HomeLine, Wallet03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ComparativoTab } from "./tabs/ComparativoTab";
import { FraudIntelligenceTab } from "./tabs/FraudIntelligenceTab";
import { TransactionsTab } from "./tabs/TransactionsTab";
import { cx } from "@/utils/cx";
import type { AiInsights, BacktestMetrics } from "@/types/backtest";
import { DEFAULT_CURRENCY, formatCompact } from "@/lib/csv/currency";

type Tab = "comparativo" | "fraud" | "transactions";

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

function BacktestsBreadcrumbs({ source, currentLabel }: { source: BreadcrumbSource; currentLabel: string }) {
  const items =
    source === "historico"
      ? [
          { label: "Backtestes", href: "/backtests/historico" },
          { label: "Histórico", href: "/backtests/historico" },
          { label: currentLabel, current: true },
        ]
      : [
          { label: "Backtestes", href: "/backtests/testagens" },
          { label: "Testagens", href: "/backtests/testagens" },
          { label: currentLabel, current: true },
        ];

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[#475456]">
      <Link
        href={source === "historico" ? "/backtests/historico" : "/backtests/testagens"}
        className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]"
        aria-label="Voltar para Backtestes"
      >
        <HomeLine className="h-5 w-5" />
      </Link>

      {items.map((item) => (
        <div key={`${item.label}-${item.href ?? "current"}`} className="flex items-center gap-3">
          <span className="text-[#D0D5D7]">/</span>
          {item.href && !item.current ? (
            <Link href={item.href} className="rounded-md px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
              {item.label}
            </Link>
          ) : (
            <span className={cx("rounded-md px-2 py-1 font-medium", item.current ? "font-semibold text-[#0C8525]" : "")}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

export function BacktestDashboard({
  metrics,
  insights,
  insightsFetchState = "idle",
  insightsErrorMessage,
  fileName,
  savedId,
  saveStatus,
  source = "testagens",
  onReset,
  onRecalculate,
  onGenerateInsights,
}: BacktestDashboardProps) {
  void savedId;
  void source;
  void onReset;
  void onRecalculate;

  const [activeTab, setActiveTab] = useState<Tab>("comparativo");

  const prospectName = fileName.replace(/\.csv$/i, "").replace(/[-_]/g, " ");

  const fraudCount = metrics.confusionMatrix
    ? metrics.confusionMatrix.tp + metrics.confusionMatrix.fn
    : undefined;
  const blocklistCount = metrics.recurrentFraudKoin?.length ?? undefined;

  const tabItems = [
    { id: "comparativo", label: "Comparativo" },
    { id: "fraud", label: "Inteligência", badge: fraudCount ?? blocklistCount },
    { id: "transactions", label: "Transações", badge: metrics.totalRows },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* ── Content area ── */}
      <div className="mx-auto w-full max-w-container px-6 py-6 lg:px-8">
        <BacktestsBreadcrumbs
          source={source}
          currentLabel={source === "historico" ? prospectName : "Análise"}
        />

        <div className="mb-4 overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-4">
                <h1 className="text-2xl font-semibold leading-8 text-[#10181B]">
                  Análise {prospectName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
                    Backtest
                  </span>
                  <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
                    CSV analisado
                  </span>
                  {metrics.currency && (
                    <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
                      {metrics.currency.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="md"
                  iconLeading={Download01}
                  className="bg-[#10181B] text-white hover:bg-[#182225] [&_[data-icon=leading]]:text-white"
                >
                  Exportar PDF
                </Button>
              </div>
            </div>

            <div className="h-px w-full bg-[#EAECEE]" />

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                  <File02 className="h-4 w-4 text-[#98A2B3]" />
                </div>
                <span className="text-sm leading-6 text-[#475456]">
                  Arquivo: <span className="font-medium text-[#10181B]">{fileName}</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                  <File02 className="h-4 w-4 text-[#98A2B3]" />
                </div>
                <span className="text-sm leading-6 text-[#475456]">
                  Transações: <span className="font-medium text-[#10181B]">{metrics.totalRows.toLocaleString("pt-BR")}</span>
                </span>
              </div>

              {metrics.totalGmv != null && metrics.totalRows > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                    <Wallet03 className="h-4 w-4 text-[#98A2B3]" />
                  </div>
                  <span className="text-sm leading-6 text-[#475456]">
                    Ticket Médio:{" "}
                    <span className="font-medium text-[#10181B]">
                      {formatCompact(metrics.totalGmv / metrics.totalRows, metrics.currency ?? DEFAULT_CURRENCY)}
                    </span>
                  </span>
                </div>
              )}

              {fraudCount !== undefined && (
                <div className="flex items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#16B364]" />
                  </div>
                  <span className="text-sm leading-6 text-[#475456]">
                    Fraudes: <span className="font-medium text-[#B42318]">{fraudCount.toLocaleString("pt-BR")}</span>
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#16B364]" />
                </div>
                <span className="text-sm leading-6 text-[#475456]">
                  <SaveStatusBadge status={saveStatus} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="mb-6">
          <nav className="flex flex-wrap items-center gap-3">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cx(
                  "inline-flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold transition-colors",
                  activeTab === tab.id
                    ? "bg-[#E4FBE9] text-[#0C8525]"
                    : "text-[#667085] hover:bg-[#F9FAFB] hover:text-[#475467]",
                )}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cx(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      activeTab === tab.id
                        ? "bg-[#2BE34F] text-[#0C8525]"
                        : "bg-[#D0D5DD] text-[#475467]",
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
          {activeTab === "fraud" && <FraudIntelligenceTab metrics={metrics} prospectName={prospectName} />}
          {activeTab === "transactions" && <TransactionsTab backtestId={savedId} />}
        </div>
      </div>
    </div>
  );
}
