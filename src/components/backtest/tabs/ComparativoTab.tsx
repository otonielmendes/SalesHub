"use client";

import { TrendUp01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { CompareCard } from "@/components/backtest/CompareCard";
import { MetricCard } from "@/components/backtest/MetricCard";
import { FraudBar } from "@/components/backtest/FraudBar";
import { DEFAULT_CURRENCY, formatCompact } from "@/lib/csv/currency";
import type { AiInsightItem, AiInsights, BacktestCapabilities, BacktestMetrics } from "@/types/backtest";
import type { InsightsFetchState } from "@/components/backtest/BacktestDashboard";
import { cx } from "@/utils/cx";
import { useLocale, useTranslations } from "next-intl";

interface ComparativoTabProps {
  metrics: BacktestMetrics;
  insights?: AiInsights | null;
  insightsFetchState?: InsightsFetchState;
  insightsErrorMessage?: string | null;
  onGenerateInsights?: () => void;
}

type ScopedT = (key: string, values?: Record<string, string | number | boolean | null | undefined>) => string;

function InsightCard({ insight, t }: { insight: AiInsightItem; t: ScopedT }) {
  const severityConfig = {
    critical: { label: t("severityCritical"), className: "bg-[#FEF3F2] text-[#B42318] ring-1 ring-inset ring-[#FEE4E2]" },
    moderate: { label: t("severityModerate"), className: "bg-[#FFF7ED] text-[#B54708] ring-1 ring-inset ring-[#FEDF89]" },
    informative: { label: t("severityInformative"), className: "bg-[#F2F4F7] text-[#475467] ring-1 ring-inset ring-[#E4E7EC]" },
  }[insight.severity];

  const lines = insight.description.split(/\. /).filter(Boolean);
  const bodyLines = lines.length > 1 ? `${lines.slice(0, -1).join(". ")}.` : insight.description;
  const recommendationLine = lines.length > 1 ? lines[lines.length - 1].replace(/\.$/, "") : null;

  return (
    <div className="rounded-xl border border-secondary bg-primary p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <span className="text-sm font-semibold text-primary">{insight.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityConfig.className}`}>
            {severityConfig.label}
          </span>
          {insight.category && (
            <Badge type="pill-color" color="gray" size="sm">
              {insight.category}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-secondary">{recommendationLine ? bodyLines : insight.description}</p>

      {recommendationLine && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2.5">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-600">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-xs leading-relaxed text-success-800">{recommendationLine}</p>
        </div>
      )}

      {insight.detected !== undefined && insight.total !== undefined && (
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-secondary_alt px-2 py-0.5 text-xs font-medium text-secondary">
            {t("insightDetected", { detected: insight.detected, total: insight.total })}
          </span>
        </div>
      )}
    </div>
  );
}

function KeyFigureStrip({
  figures,
  t,
  className,
}: {
  figures: { label: string; shortLabel: string; help: string; value: string; tone?: "default" | "positive" | "warning" | "negative" }[];
  t: ScopedT;
  className?: string;
}) {
  return (
    <div className={cx("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      {figures.map((figure, index) => (
        <div key={index} className="rounded-xl bg-[#FCFCFD] px-3 py-2.5">
          <p className="text-xs font-medium leading-none text-quaternary">
            <span className="inline-flex items-center gap-1 whitespace-nowrap" title={figure.label}>
              <span aria-label={figure.label}>{figure.shortLabel}</span>
              <Tooltip title={figure.help} placement="top">
                <TooltipTrigger
                  aria-label={t("metricHelpAria", { label: figure.label })}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center text-[#98A2B3]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </TooltipTrigger>
              </Tooltip>
            </span>
          </p>
          <p
            className={cx(
              "mt-1.5 font-mono text-xl font-semibold leading-none",
              figure.tone === "positive" && "text-[#0C8525]",
              figure.tone === "warning" && "text-[#B54708]",
              figure.tone === "negative" && "text-[#B42318]",
              (!figure.tone || figure.tone === "default") && "text-[#101828]",
            )}
          >
            {figure.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ComparativoTab({
  metrics,
  insights,
  insightsFetchState = "idle",
  insightsErrorMessage,
  onGenerateInsights,
}: ComparativoTabProps) {
  const t = useTranslations("backtests.comparativo");
  const tr = t as ScopedT;
  const locale = useLocale();
  const currency = metrics.currency ?? DEFAULT_CURRENCY;
  const fmt = (n: number | null | undefined) => formatCompact(n, currency);

  const c = metrics.capabilities;
  const cap = (key: keyof BacktestCapabilities) => (c ? c[key] : true);

  const showComparativo = cap("comparativo");
  const showRevenue = cap("revenueRecovery") && metrics.recoverableTransactions > 0;
  const showConfusion = cap("confusionMatrix") && metrics.confusionMatrix != null;
  const showFinancialAmounts =
    cap("financialImpact") &&
    metrics.preventedFraudAmount != null &&
    metrics.residualFraudAmount != null;
  const showRoi =
    (showRevenue || showFinancialAmounts) &&
    (metrics.recoverableVolume > 0 || metrics.preventedFraudAmount != null);
  const showDevoluciones = cap("devoluciones") && metrics.devolucionCount != null && metrics.devolucionCount > 0;
  const showBrandMix =
    cap("cardBrand") &&
    metrics.cardBrandFraudDistribution &&
    metrics.cardBrandFraudDistribution.length > 0;

  const fraudCount = metrics.confusionMatrix ? metrics.confusionMatrix.tp + metrics.confusionMatrix.fn : 0;
  const precision =
    metrics.confusionMatrix && metrics.confusionMatrix.tp + metrics.confusionMatrix.fp > 0
      ? metrics.confusionMatrix.tp / (metrics.confusionMatrix.tp + metrics.confusionMatrix.fp)
      : null;

  const txnApprovalToday = Math.round(metrics.approvalRateToday * metrics.totalRows);
  const txnApprovalKoin = Math.round(metrics.approvalRateKoin * metrics.totalRows);
  const txnRejectToday = Math.round(metrics.rejectionRateToday * metrics.totalRows);
  const txnRejectKoin = Math.round(metrics.rejectionRateKoin * metrics.totalRows);
  const roiTotal = (metrics.recoverableVolume ?? 0) + (metrics.preventedFraudAmount ?? 0);

  const criticalInsights = insights?.insights.filter((i) => i.severity === "critical") ?? [];
  const moderateInsights = insights?.insights.filter((i) => i.severity === "moderate") ?? [];
  const informativeInsights = insights?.insights.filter((i) => i.severity === "informative") ?? [];

  return (
    <div className="flex flex-col gap-6">
      {showRoi && (
        <div className="overflow-hidden rounded-2xl border border-success-200 bg-success-50 shadow-xs">
          <div className="flex items-center gap-2 border-b border-success-100 px-5 py-3">
            <TrendUp01 className="size-4 text-success-700" />
            <p className="text-sm font-semibold text-success-900">{t("roiHeader")}</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-success-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col gap-1 px-5 py-5">
              <span className="text-xs uppercase tracking-[0.08em] text-success-800">{t("roiRecoveredRevenue")}</span>
              <span className="font-mono text-3xl font-bold leading-none text-success-900">{fmt(metrics.recoverableVolume)}</span>
              <span className="text-xs text-success-700">
                {t("roiRecoveredApprovals", { count: metrics.recoverableTransactions.toLocaleString(locale) })}
              </span>
            </div>
            <div className="flex flex-col gap-1 px-5 py-5">
              <span className="text-xs uppercase tracking-[0.08em] text-success-800">{t("roiPreventedFraud")}</span>
              <span className="font-mono text-3xl font-bold leading-none text-success-900">{fmt(metrics.preventedFraudAmount)}</span>
              <span className="text-xs text-success-700">
                {metrics.preventedPct != null
                  ? t("roiPreventedFraudPct", { pct: `${(metrics.preventedPct * 100).toFixed(1)}%` })
                  : t("roiChargebacksAvoided")}
              </span>
            </div>
            <div className="flex flex-col gap-1 px-5 py-5">
              <span className="text-xs uppercase tracking-[0.08em] text-success-800">{t("roiTotalValue")}</span>
              <span className="font-mono text-3xl font-bold leading-none text-success-900">{fmt(roiTotal)}</span>
              <span className="text-xs text-success-700">
                {metrics.valueImpactRatio != null
                  ? t("roiGmvProtectedPct", { pct: `${(metrics.valueImpactRatio * 100).toFixed(1)}%` })
                  : t("roiImpactEstimate")}
              </span>
            </div>
          </div>
          {metrics.totalGmv != null && (
            <div className="border-t border-success-100 px-5 py-3 text-xs text-success-700">
              {t("roiGmvFile")} {fmt(metrics.totalGmv)}
            </div>
          )}
        </div>
      )}

      {(showConfusion && metrics.confusionMatrix) || showFinancialAmounts ? (
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          {showConfusion && metrics.confusionMatrix && (
            <div className="h-full min-h-[160px] overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white p-4 shadow-xs">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-[#344054]">{t("confusionTitle")}</h3>
              </div>
              <KeyFigureStrip
                t={tr}
                className="h-full"
                figures={[
                  {
                    label: t("metricTp"),
                    shortLabel: t("metricTpShort"),
                    help: t("metricTpHelp"),
                    value: metrics.confusionMatrix.tp.toLocaleString(locale),
                    tone: "positive",
                  },
                  {
                    label: t("metricFn"),
                    shortLabel: t("metricFnShort"),
                    help: t("metricFnHelp"),
                    value: metrics.confusionMatrix.fn.toLocaleString(locale),
                    tone: "negative",
                  },
                  {
                    label: t("metricFp"),
                    shortLabel: t("metricFpShort"),
                    help: t("metricFpHelp"),
                    value: metrics.confusionMatrix.fp.toLocaleString(locale),
                    tone: "warning",
                  },
                  {
                    label: t("metricTn"),
                    shortLabel: t("metricTnShort"),
                    help: t("metricTnHelp"),
                    value: metrics.confusionMatrix.tn.toLocaleString(locale),
                  },
                ]}
              />
            </div>
          )}
          {showFinancialAmounts && (
            <div className="flex h-full min-h-[160px] flex-col overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white p-4 shadow-xs">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-[#344054]">{t("fraudPreventedTitle")}</h3>
                <p className="mt-1 text-xs text-[#667085]">{t("fraudPreventedDesc")}</p>
              </div>
              <FraudBar
                prevented={metrics.preventedFraudAmount!}
                residual={metrics.residualFraudAmount!}
                preventedLabel={fmt(metrics.preventedFraudAmount)}
                residualLabel={fmt(metrics.residualFraudAmount)}
              />
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {showComparativo && (
          <CompareCard
            title={t("compareApprovalTitle")}
            todayValue={metrics.approvalRateToday * 100}
            koinValue={metrics.approvalRateKoin * 100}
            delta={(metrics.approvalRateKoin - metrics.approvalRateToday) * 100}
            format="percent"
            todayLabel={t("labelMerchant")}
            koinLabel={t("labelKoin")}
            todaySub={t("compareApprovedTxns", { count: txnApprovalToday.toLocaleString(locale) })}
            koinSub={t("compareApprovedTxns", { count: txnApprovalKoin.toLocaleString(locale) })}
            footer={t("compareApprovalFooter")}
          />
        )}

        {showConfusion && metrics.confusionMatrix && (
          <MetricCard
            title={t("compareFraudDetected")}
            items={[
              {
                label: t("compareDetectionRate"),
                value: `${(metrics.confusionMatrix.detectionRate * 100).toFixed(1)}%`,
                sub: t("compareCases", {
                  detected: metrics.confusionMatrix.tp.toLocaleString(locale),
                  total: fraudCount.toLocaleString(locale),
                }),
                accent: true,
              },
              {
                label: t("comparePrecision"),
                value: precision != null ? `${(precision * 100).toFixed(1)}%` : "—",
                sub:
                  precision != null
                    ? t("compareCorrectRejections", { count: metrics.confusionMatrix.tp.toLocaleString(locale) })
                    : t("compareNoBase"),
              },
            ]}
          />
        )}

        {showRevenue && (
          <MetricCard
            title={t("compareRevenueRecovery")}
            items={[
              {
                label: t("compareRecoverableTxns"),
                value: metrics.recoverableTransactions.toLocaleString(locale),
                sub: t("compareCurrentRejections", { pct: `${(metrics.recoveredRejectionPct * 100).toFixed(1)}%` }),
                accent: true,
              },
              {
                label: t("compareRecoverableVolume"),
                value: fmt(metrics.recoverableVolume),
                sub: t("compareRevenueFloor"),
                accent: true,
              },
            ]}
            footer={t("compareRevenueFooter")}
          />
        )}

        {showComparativo && (
          <CompareCard
            title={t("compareChargebackTitle")}
            todayValue={metrics.fraudRateApprovedToday * 100}
            koinValue={metrics.fraudRateApprovedKoin * 100}
            delta={(metrics.fraudRateApprovedKoin - metrics.fraudRateApprovedToday) * 100}
            deltaFormat="pct"
            invertDelta
            format="percent"
            todayLabel={t("labelMerchant")}
            koinLabel={t("labelKoin")}
            todaySub={fraudCount > 0 ? t("compareChargebacksInApproved", { count: fraudCount.toLocaleString(locale) }) : undefined}
            koinSub={metrics.confusionMatrix ? t("compareResidualFraud", { count: metrics.confusionMatrix.fn.toLocaleString(locale) }) : undefined}
          />
        )}

        {showComparativo && (
          <CompareCard
            title={t("compareRejectionTitle")}
            todayValue={metrics.rejectionRateToday * 100}
            koinValue={metrics.rejectionRateKoin * 100}
            delta={(metrics.rejectionRateKoin - metrics.rejectionRateToday) * 100}
            format="percent"
            invertDelta
            todayLabel={t("labelMerchant")}
            koinLabel={t("labelKoin")}
            todaySub={t("compareRejectionsToday", { count: txnRejectToday.toLocaleString(locale) })}
            koinSub={t("compareRejectionsToday", { count: txnRejectKoin.toLocaleString(locale) })}
            footer={t("compareRejectionFooter")}
          />
        )}

        {showDevoluciones && (
          <MetricCard
            title={t("compareDevolucioesTitle")}
            items={[
              {
                label: t("compareTotalDevolucoes"),
                value: metrics.devolucionCount!.toLocaleString(locale),
                sub: t("compareTransactionsPct", {
                  pct: `${((metrics.devolucionCount! / metrics.totalRows) * 100).toFixed(1)}%`,
                }),
              },
              {
                label: t("compareKoinAvoid"),
                value: metrics.devolucionKoinRejectCount?.toLocaleString(locale) ?? "—",
                sub:
                  metrics.devolucionAvoidablePct != null
                    ? t("compareAvoidablePct", { pct: `${(metrics.devolucionAvoidablePct * 100).toFixed(1)}%` })
                    : t("compareAvoidabilityUnknown"),
                accent: true,
              },
            ]}
          />
        )}
      </div>

      {showBrandMix && (
        <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#344054]">{t("compareBrandFraud")}</h3>
            <p className="mt-1 text-xs text-[#667085]">{t("compareBrandConcentration")}</p>
          </div>
          <div className="flex flex-col gap-3">
            {metrics.cardBrandFraudDistribution!.slice(0, 5).map((brand) => (
              <div key={brand.key} className="grid grid-cols-[120px_minmax(0,1fr)_52px] items-center gap-3">
                <span className="truncate text-sm font-medium text-[#475467]">{brand.key}</span>
                <div className="h-3 overflow-hidden rounded-full bg-[#EEF2F6]">
                  <div className="h-full rounded-full bg-[#F04438]" style={{ width: `${brand.pct * 100}%` }} />
                </div>
                <span className="text-right text-xs font-semibold text-[#475467]">{(brand.pct * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mb-2">
        <h2 className="mb-2 text-lg font-bold text-[#10181B]">{t("insightsTitle")}</h2>

        <div className="flex max-h-[480px] flex-col overflow-hidden rounded-2xl bg-[#F9FAFB] p-4 outline outline-1 outline-offset-[-1px] outline-[#E4E7EC]">
          <div className="inline-flex shrink-0 items-center gap-4 self-stretch">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10B132] text-white">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M1.16667 7C1.16667 10.2217 3.77834 12.8333 7 12.8333C10.2217 12.8333 12.8333 10.2217 12.8333 7C12.8333 3.77834 10.2217 1.16667 7 1.16667C4.86917 1.16667 3.00667 2.33667 1.985 4.08333M1.16667 1.16667V4.08333H4.08333"
                  stroke="currentColor"
                  strokeWidth="1.17"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#667085]">
                {insightsFetchState === "ready" && insights?.insights.length ? t("insightsDiagnose") : t("insightsAi")}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {criticalInsights.length > 0 && (
                  <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-sm font-medium text-[#B42318]">
                    {t("insightsCritical", { count: criticalInsights.length })}
                  </span>
                )}
                {moderateInsights.length > 0 && (
                  <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-sm font-medium text-[#B54708]">
                    {t("insightsModerate", { count: moderateInsights.length })}
                  </span>
                )}
                {informativeInsights.length > 0 && (
                  <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-sm font-medium text-[#475467]">
                    {t("insightsInformative", { count: informativeInsights.length })}
                  </span>
                )}
              </div>
            </div>

          </div>

          <div className="mt-4 h-px shrink-0 bg-[#E4E7EC]" />

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-4">
            {insightsFetchState === "idle" && onGenerateInsights && (
              <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-[#D0D5DD] bg-white/60 px-5 py-6">
                <p className="text-sm text-[#667085]">{t("insightsIdle")}</p>
              </div>
            )}

            {insightsFetchState === "loading" && (
              <div className="flex min-h-32 items-center gap-3 rounded-xl border border-[#E4E7EC] bg-white px-5 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#10B132]" />
                <p className="text-sm text-[#667085]">{t("insightsLoading")}</p>
              </div>
            )}

            {insightsFetchState === "error" && (
              <div className="rounded-xl border border-[#FDB022] bg-[#FFFAEB] px-5 py-4">
                <p className="text-sm font-semibold text-[#7A2E0E]">{t("insightsErrorTitle")}</p>
                <p className="mt-0.5 text-sm text-[#B54708]">
                  {insightsErrorMessage ?? t("insightsErrorCheck")}
                </p>
              </div>
            )}

            {insightsFetchState === "ready" && insights && insights.insights.length > 0 && (
              <div className="flex flex-col gap-4 pr-1">
                {insights.insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} t={tr} />
                ))}

                <p className="flex items-center gap-1.5 text-xs text-[#667085]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  {t("insightsWarning")}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
