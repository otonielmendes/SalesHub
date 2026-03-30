"use client";

import { useState } from "react";
import { TrendUp01, ChevronDown } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { CompareCard } from "@/components/backtest/CompareCard";
import { MetricCard } from "@/components/backtest/MetricCard";
import { FraudBar } from "@/components/backtest/FraudBar";
import { cx } from "@/utils/cx";
import { DEFAULT_CURRENCY, formatCompact } from "@/lib/csv/currency";
import type { BacktestCapabilities, BacktestMetrics, AiInsights, AiInsightItem } from "@/types/backtest";
import type { InsightsFetchState } from "@/components/backtest/BacktestDashboard";

interface ComparativoTabProps {
  metrics: BacktestMetrics;
  insights?: AiInsights | null;
  insightsFetchState?: InsightsFetchState;
  insightsErrorMessage?: string | null;
  onGenerateInsights?: () => void;
}

function InsightCard({ insight }: { insight: AiInsightItem }) {
  const severityConfig = {
    critical: { badgeColor: "error" as const, label: "Crítico" },
    moderate: { badgeColor: "warning" as const, label: "Moderado" },
    informative: { badgeColor: "gray" as const, label: "Informativo" },
  }[insight.severity];

  const lines = insight.description.split(/\. /).filter(Boolean);
  const bodyLines = lines.length > 1 ? lines.slice(0, -1).join(". ") + "." : insight.description;
  const recommendationLine = lines.length > 1 ? lines[lines.length - 1].replace(/\.$/, "") : null;

  return (
    <div className="rounded-xl border border-secondary bg-primary p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <span className="text-sm font-semibold text-primary">{insight.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge type="pill-color" color={severityConfig.badgeColor} size="sm">
            {severityConfig.label}
          </Badge>
          {insight.category && (
            <Badge type="pill-color" color="gray" size="sm">
              {insight.category}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-secondary">
        {recommendationLine ? bodyLines : insight.description}
      </p>

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
            Detectado: {insight.detected}/{insight.total}
          </span>
        </div>
      )}
    </div>
  );
}

export function ComparativoTab({ metrics, insights, insightsFetchState = "idle", insightsErrorMessage, onGenerateInsights }: ComparativoTabProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

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
  const showDevoluciones =
    cap("devoluciones") && metrics.devolucionCount !== null && metrics.devolucionCount > 0;
  const showDetails = showConfusion || showFinancialAmounts || showDevoluciones;

  const fraudCount = metrics.confusionMatrix
    ? metrics.confusionMatrix.tp + metrics.confusionMatrix.fn
    : null;

  const precision =
    metrics.confusionMatrix &&
    metrics.confusionMatrix.tp + metrics.confusionMatrix.fp > 0
      ? metrics.confusionMatrix.tp /
        (metrics.confusionMatrix.tp + metrics.confusionMatrix.fp)
      : null;

  const txnApprovalToday = Math.round(metrics.approvalRateToday * metrics.totalRows);
  const txnApprovalKoin = Math.round(metrics.approvalRateKoin * metrics.totalRows);

  const roiTotal = (metrics.recoverableVolume ?? 0) + (metrics.preventedFraudAmount ?? 0);

  return (
    <div className="flex flex-col gap-4">

      {/* ── BLOCO 1: ROI estimado (hero) ── */}
      {showRoi && (
        <div className="overflow-hidden rounded-xl border border-success-200 bg-success-50 shadow-xs">
          <div className="flex items-center gap-2 border-b border-success-100 px-5 py-3">
            <TrendUp01 className="size-4 text-success-700" />
            <p className="text-sm font-semibold text-success-900">ROI estimado Koin</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-success-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col gap-1 px-5 py-4">
              <span className="text-xs text-success-800">Receita recuperada</span>
              <span className="font-mono text-2xl font-bold leading-none text-success-900">
                {fmt(metrics.recoverableVolume)}
              </span>
              <span className="text-xs text-success-700">Aprovações recuperadas</span>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4">
              <span className="text-xs text-success-800">Fraude prevenida</span>
              <span className="font-mono text-2xl font-bold leading-none text-success-900">
                {fmt(metrics.preventedFraudAmount)}
              </span>
              <span className="text-xs text-success-700">Chargebacks evitados</span>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4">
              <span className="text-xs text-success-800">Total estimado</span>
              <span className="font-mono text-2xl font-bold leading-none text-success-900">
                {fmt(roiTotal)}
              </span>
              <span className="text-xs text-success-700">Valor total gerado</span>
            </div>
          </div>
          {metrics.totalGmv != null && (
            <div className="border-t border-success-100 px-5 py-2.5 text-xs text-success-700">
              GMV do arquivo: {fmt(metrics.totalGmv)}
            </div>
          )}
        </div>
      )}

      {/* ── BLOCO 2: Comparativo operacional (3 cards) ── */}
      {(showComparativo || showRevenue) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          {/* Card 1: Aprobación (com linha de rechazo como sub) */}
          {showComparativo && (
            <CompareCard
              title="Aprobación"
              todayValue={metrics.approvalRateToday * 100}
              koinValue={metrics.approvalRateKoin * 100}
              delta={(metrics.approvalRateKoin - metrics.approvalRateToday) * 100}
              format="percent"
              todaySub={`${txnApprovalToday.toLocaleString("pt-BR")} aprovadas · ${(metrics.rejectionRateToday * 100).toFixed(1)}% rechazo`}
              koinSub={`${txnApprovalKoin.toLocaleString("pt-BR")} aprovadas · ${(metrics.rejectionRateKoin * 100).toFixed(1)}% rechazo`}
              footer="Melhor performance em Koin"
            />
          )}

          {/* Card 2: Chargeback rate (delta invertido: queda é positivo) */}
          {showComparativo && (
            <CompareCard
              title="Chargeback rate"
              todayValue={metrics.fraudRateApprovedToday * 100}
              koinValue={metrics.fraudRateApprovedKoin * 100}
              delta={(metrics.fraudRateApprovedKoin - metrics.fraudRateApprovedToday) * 100}
              deltaFormat="pct"
              invertDelta
              format="percent"
              todaySub={
                metrics.confusionMatrix
                  ? `${(metrics.confusionMatrix.tp + metrics.confusionMatrix.fn).toLocaleString("pt-BR")} fraudes em aprovadas`
                  : undefined
              }
              koinSub={
                metrics.confusionMatrix
                  ? `${metrics.confusionMatrix.fn.toLocaleString("pt-BR")} fraudes residuais`
                  : undefined
              }
            />
          )}

          {/* Card 3: Receita recuperável */}
          {showRevenue && (
            <MetricCard
              title="Receita recuperável"
              items={[
                {
                  label: "Txns recuperáveis",
                  value: metrics.recoverableTransactions.toLocaleString("pt-BR"),
                  sub:
                    metrics.recoveredRejectionPct > 0
                      ? `${(metrics.recoveredRejectionPct * 100).toFixed(1)}% dos rechazos`
                      : undefined,
                  accent: true,
                },
                ...(metrics.recoverableVolume > 0
                  ? [
                      {
                        label: "Volume recuperável",
                        value: fmt(metrics.recoverableVolume),
                        sub: "Receita perdida hoje",
                        accent: true,
                      },
                    ]
                  : []),
              ]}
              footer="Oportunidade de revenue recovery"
            />
          )}
        </div>
      )}

      {/* ── BLOCO 3: Detalhes de detecção (colapsável, começa fechado) ── */}
      {showDetails && (
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs">
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-secondary_alt"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-sm font-semibold text-secondary">Detalhes de detecção</span>
              {!detailsOpen && showConfusion && metrics.confusionMatrix && (
                <span className="text-xs text-tertiary">
                  {(metrics.confusionMatrix.detectionRate * 100).toFixed(1)}% taxa de detecção
                  {precision != null && ` · ${(precision * 100).toFixed(1)}% precisão`}
                </span>
              )}
            </div>
            <ChevronDown
              className={cx(
                "size-4 text-quaternary transition-transform duration-200",
                detailsOpen && "rotate-180",
              )}
            />
          </button>

          {detailsOpen && (
            <div className="flex flex-col gap-5 border-t border-secondary px-5 py-5">

              {/* Confusion matrix — 4 células */}
              {showConfusion && metrics.confusionMatrix && (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      {
                        label: "True positives",
                        value: metrics.confusionMatrix.tp,
                        color: "text-brand-700",
                        sub: "Fraude detectada",
                      },
                      {
                        label: "False negatives",
                        value: metrics.confusionMatrix.fn,
                        color: "text-error-800",
                        sub: "Fraude não detectada",
                      },
                      {
                        label: "False positives",
                        value: metrics.confusionMatrix.fp,
                        color: "text-warning-800",
                        sub: "Bloqueio incorreto",
                      },
                      {
                        label: "True negatives",
                        value: metrics.confusionMatrix.tn,
                        color: "text-primary",
                        sub: "Transação limpa",
                      },
                    ].map((cell) => (
                      <div
                        key={cell.label}
                        className="rounded-lg border border-secondary bg-secondary_alt p-3"
                      >
                        <p className="mb-1 text-xs text-tertiary">{cell.label}</p>
                        <p
                          className={cx(
                            "font-mono text-2xl font-semibold leading-none",
                            cell.color,
                          )}
                        >
                          {cell.value.toLocaleString("pt-BR")}
                        </p>
                        <p className="mt-1 text-xs text-quaternary">{cell.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Taxa de detecção + Precisão */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-secondary bg-secondary_alt px-4 py-3">
                      <p className="text-xs text-tertiary">Taxa de detecção</p>
                      <p className="font-mono text-xl font-semibold text-brand-700">
                        {(metrics.confusionMatrix.detectionRate * 100).toFixed(1)}%
                      </p>
                      {fraudCount != null && (
                        <p className="text-xs text-quaternary">
                          {metrics.confusionMatrix.tp} de {fraudCount} fraudes
                        </p>
                      )}
                    </div>
                    {precision != null && (
                      <div className="rounded-lg border border-secondary bg-secondary_alt px-4 py-3">
                        <p className="text-xs text-tertiary">Precisão</p>
                        <p className="font-mono text-xl font-semibold text-brand-700">
                          {(precision * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-quaternary">
                          {metrics.confusionMatrix.tp} de{" "}
                          {metrics.confusionMatrix.tp + metrics.confusionMatrix.fp} rejeições corretas
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* FraudBar */}
              {showFinancialAmounts && (
                <div>
                  <p className="mb-3 text-xs font-medium text-tertiary">
                    Fraude prevenida por valor
                  </p>
                  <FraudBar
                    prevented={metrics.preventedFraudAmount!}
                    residual={metrics.residualFraudAmount!}
                    preventedLabel={fmt(metrics.preventedFraudAmount)}
                    residualLabel={fmt(metrics.residualFraudAmount)}
                  />
                </div>
              )}

              {/* Devoluciones evitables */}
              {showDevoluciones && (
                <div className="border-t border-secondary pt-4">
                  <p className="mb-3 text-xs font-medium text-tertiary">
                    Devoluciones evitables
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-secondary bg-secondary_alt px-4 py-3">
                      <p className="text-xs text-tertiary">Total devoluciones</p>
                      <p className="font-mono text-xl font-semibold text-primary">
                        {metrics.devolucionCount!.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-quaternary">
                        {((metrics.devolucionCount! / metrics.totalRows) * 100).toFixed(1)}% das txns
                      </p>
                    </div>
                    {metrics.devolucionKoinRejectCount != null && (
                      <div className="rounded-lg border border-secondary bg-secondary_alt px-4 py-3">
                        <p className="text-xs text-tertiary">Koin evitaria</p>
                        <p className="font-mono text-xl font-semibold text-brand-700">
                          {metrics.devolucionKoinRejectCount.toLocaleString("pt-BR")}
                        </p>
                        {metrics.devolucionAvoidablePct != null && (
                          <p className="text-xs text-quaternary">
                            {(metrics.devolucionAvoidablePct * 100).toFixed(1)}% evitáveis
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── BLOCO 4: Insights de IA ── */}
      {insightsFetchState === "idle" && onGenerateInsights && (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-secondary bg-secondary_alt px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Insights de IA</p>
              <p className="text-xs text-tertiary">Diagnóstico automático gerado pelo Gemini</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGenerateInsights}
            className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100"
          >
            Gerar insights
          </button>
        </div>
      )}

      {insightsFetchState === "loading" && (
        <div className="flex items-center gap-3 rounded-xl border border-secondary bg-primary px-5 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-sm text-tertiary">Gerando insights com IA…</p>
        </div>
      )}

      {insightsFetchState === "error" && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 px-5 py-4">
          <p className="text-sm font-semibold text-warning-900">Insights AI indisponíveis</p>
          <p className="mt-0.5 text-xs text-warning-800">
            {insightsErrorMessage ?? "Verifique GEMINI_API_KEY no servidor ou tente novamente."}
          </p>
        </div>
      )}

      {insightsFetchState === "ready" && insights && insights.insights.length > 0 && (() => {
        const critical = insights.insights.filter((i) => i.severity === "critical");
        const moderate = insights.insights.filter((i) => i.severity === "moderate");
        const informative = insights.insights.filter((i) => i.severity === "informative");

        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-success-200 bg-success-50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success-700">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-primary">Diagnóstico</span>
              <div className="flex items-center gap-1.5">
                {critical.length > 0 && (
                  <Badge type="pill-color" color="error" size="sm">
                    {critical.length} {critical.length === 1 ? "crítico" : "críticos"}
                  </Badge>
                )}
                {moderate.length > 0 && (
                  <Badge type="pill-color" color="warning" size="sm">
                    {moderate.length} {moderate.length === 1 ? "moderado" : "moderados"}
                  </Badge>
                )}
                {informative.length > 0 && (
                  <Badge type="pill-color" color="gray" size="sm">
                    {informative.length} {informative.length === 1 ? "informativo" : "informativos"}
                  </Badge>
                )}
              </div>
            </div>

            {insights.insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}

            <p className="flex items-center gap-1.5 text-xs text-quaternary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              Insights gerados a partir dos dados agregados. Validar com o time de modelos antes de implementar regras.
            </p>
          </div>
        );
      })()}
    </div>
  );
}
