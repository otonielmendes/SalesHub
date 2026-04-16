"use client";

import Link from "next/link";
import { useState } from "react";
import { Download01, File02, HomeLine, Wallet03 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Tabs } from "@/components/application/tabs/tabs";
import { ComparativoTab } from "./tabs/ComparativoTab";
import { FraudIntelligenceTab } from "./tabs/FraudIntelligenceTab";
import { TransactionsTab } from "./tabs/TransactionsTab";
import { cx } from "@/utils/cx";
import type { AiInsights, BacktestMetrics } from "@/types/backtest";
import { DEFAULT_CURRENCY, formatCompact } from "@/lib/csv/currency";
import { useLocale, useTranslations } from "next-intl";

type DashboardTab = "comparativo" | "fraud" | "transactions";

export type InsightsFetchState = "idle" | "loading" | "ready" | "error";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type BreadcrumbSource = "testagens" | "historico";

interface BacktestDashboardProps {
  metrics: BacktestMetrics;
  insights: AiInsights | null;
  insightsFetchState?: InsightsFetchState;
  insightsErrorMessage?: string | null;
  fileName: string;
  analysisName?: string;
  savedId: string | null;
  saveStatus: SaveStatus;
  source?: BreadcrumbSource;
  onReset: () => void;
  /** When defined, renders a "Recalcular" button that triggers re-processing of the stored CSV. */
  onRecalculate?: () => Promise<void>;
  /** When defined, shows a "Gerar insights" CTA in the Comparativo tab. */
  onGenerateInsights?: () => void;
}

function BacktestsBreadcrumbs({
  source,
  currentLabel,
  backtestsLabel,
  historicoLabel,
  testagensLabel,
  backAriaLabel,
}: {
  source: BreadcrumbSource;
  currentLabel: string;
  backtestsLabel: string;
  historicoLabel: string;
  testagensLabel: string;
  backAriaLabel: string;
}) {
  const items =
    source === "historico"
      ? [
          { label: backtestsLabel, href: "/backtests/historico" },
          { label: historicoLabel, href: "/backtests/historico" },
          { label: currentLabel, current: true },
        ]
      : [
          { label: backtestsLabel, href: "/backtests/new" },
          { label: testagensLabel, href: "/backtests/new" },
          { label: currentLabel, current: true },
        ];

  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[#475456]">
      <Link
        href={source === "historico" ? "/backtests/historico" : "/backtests/new"}
        className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]"
        aria-label={backAriaLabel}
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
  analysisName,
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

  const t = useTranslations("backtests.dashboard");
  const tTestagens = useTranslations("backtests.testagens");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<DashboardTab>("comparativo");

  const prospectName = analysisName?.trim() || fileName.replace(/\.csv$/i, "").replace(/[-_]/g, " ");

  const fraudCount = metrics.confusionMatrix
    ? metrics.confusionMatrix.tp + metrics.confusionMatrix.fn
    : undefined;
  const blocklistCount = metrics.recurrentFraudKoin?.length ?? undefined;

  const tabItems: { id: DashboardTab; label: string; badge?: string }[] = [
    { id: "comparativo", label: t("tabComparativo") },
    {
      id: "fraud",
      label: t("tabFraud"),
      badge: fraudCount !== undefined ? fraudCount.toLocaleString(locale) : blocklistCount?.toLocaleString(locale),
    },
    { id: "transactions", label: t("tabTransactions"), badge: metrics.totalRows.toLocaleString(locale) },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* ── Content area ── */}
      <div className="mx-auto w-full max-w-container px-6 py-6 lg:px-8">
        <BacktestsBreadcrumbs
          source={source}
          currentLabel={source === "historico" ? prospectName : t("analysisTitle")}
          backtestsLabel={t("breadcrumbBacktests")}
          historicoLabel={t("breadcrumbHistorico")}
          testagensLabel={tTestagens("title")}
          backAriaLabel={t("backToBacktests")}
        />

        <div className="mb-4 overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-wrap items-center gap-4">
                <h1 className="text-2xl font-semibold leading-8 text-[#10181B]">
                  {t("analysisTitle")} {prospectName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
                    {t("badgeBacktest")}
                  </span>
                  <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
                    {t("badgeCsv")}
                  </span>
                  {metrics.currency && (
                    <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
                      {metrics.currency.code}
                    </span>
                  )}
                  {metrics.dataQuality?.status === "partial" && (
                    <span className="rounded-full bg-[#FFFAEB] px-2.5 py-1 text-sm font-medium leading-5 text-[#B54708]">
                      {t("badgePartial")}
                    </span>
                  )}
                  {metrics.dataQuality?.extraColumns.length ? (
                    <span className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-sm font-medium leading-5 text-[#475456]">
                      {t("badgeExtraColumns", { count: metrics.dataQuality.extraColumns.length })}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="md"
                  iconLeading={Download01}
                  className="bg-[#10181B] text-white hover:bg-[#182225] [&_[data-icon=leading]]:text-white"
                >
                  {t("exportPdf")}
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
                  {t("fileLabel")} <span className="font-medium text-[#10181B]">{fileName}</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                  <File02 className="h-4 w-4 text-[#98A2B3]" />
                </div>
                <span className="text-sm leading-6 text-[#475456]">
                  {t("transactionsLabel")} <span className="font-medium text-[#10181B]">{metrics.totalRows.toLocaleString(locale)}</span>
                </span>
              </div>

              {metrics.totalGmv != null && metrics.totalRows > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                    <Wallet03 className="h-4 w-4 text-[#98A2B3]" />
                  </div>
                  <span className="text-sm leading-6 text-[#475456]">
                    {t("avgTicketLabel")}{" "}
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
                    {t("fraudsLabel")} <span className="font-medium text-[#B42318]">{fraudCount.toLocaleString(locale)}</span>
                  </span>
                </div>
              )}

              {saveStatus === "error" && (
                <div className="flex items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F6]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F04438]" />
                  </div>
                  <span className="text-sm leading-6 text-[#475456]">
                    {t("saveError")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as DashboardTab)}
          className="mb-6"
        >
          <Tabs.List
            aria-label={t("tabsAriaLabel")}
            items={tabItems}
            size="md"
            type="button-border"
            className="w-max max-w-full overflow-x-auto"
          >
            {(tab) => (
              <Tabs.Item id={tab.id} badge={tab.badge}>
                {tab.label}
              </Tabs.Item>
            )}
          </Tabs.List>
        </Tabs>

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
