"use client";

import { TrendUp01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CompareCard } from "@/components/backtest/CompareCard";
import { MetricCard } from "@/components/backtest/MetricCard";
import { FraudBar } from "@/components/backtest/FraudBar";
import { DEFAULT_CURRENCY, formatCompact } from "@/lib/csv/currency";
import type { AiInsightItem, AiInsights, BacktestCapabilities, BacktestMetrics } from "@/types/backtest";
import type { InsightsFetchState } from "@/components/backtest/BacktestDashboard";
import { cx } from "@/utils/cx";

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
  const bodyLines = lines.length > 1 ? `${lines.slice(0, -1).join(". ")}.` : insight.description;
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
            Detectado: {insight.detected}/{insight.total}
          </span>
        </div>
      )}
    </div>
  );
}

function KeyFigureStrip({
  figures,
}: {
  figures: { label: string; value: string; tone?: "default" | "positive" | "warning" | "negative" }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#D0D5DD] bg-white p-4 shadow-xs sm:grid-cols-4">
      {figures.map((figure) => (
        <div key={figure.label} className="rounded-xl bg-[#FCFCFD] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#667085]">{figure.label}</p>
          <p
            className={cx(
              "mt-2 font-mono text-3xl font-semibold leading-none",
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
  const showBrandMix = cap("cardBrand") && metrics.cardBrandDistribution && metrics.cardBrandDistribution.length > 0;

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
            <p className="text-sm font-semibold text-success-900">ROI estimado Koin</p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-success-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col gap-1 px-5 py-5">
              <span className="text-xs uppercase tracking-[0.08em] text-success-800">Receita recuperada</span>
              <span className="font-mono text-3xl font-bold leading-none text-success-900">{fmt(metrics.recoverableVolume)}</span>
              <span className="text-xs text-success-700">
                {metrics.recoverableTransactions.toLocaleString("pt-BR")} aprovações potencialmente recuperadas
              </span>
            </div>
            <div className="flex flex-col gap-1 px-5 py-5">
              <span className="text-xs uppercase tracking-[0.08em] text-success-800">Fraude prevenida</span>
              <span className="font-mono text-3xl font-bold leading-none text-success-900">{fmt(metrics.preventedFraudAmount)}</span>
              <span className="text-xs text-success-700">
                {metrics.preventedPct != null ? `${(metrics.preventedPct * 100).toFixed(1)}% da fraude financeira` : "Chargebacks evitados"}
              </span>
            </div>
            <div className="flex flex-col gap-1 px-5 py-5">
              <span className="text-xs uppercase tracking-[0.08em] text-success-800">Valor total gerado</span>
              <span className="font-mono text-3xl font-bold leading-none text-success-900">{fmt(roiTotal)}</span>
              <span className="text-xs text-success-700">
                {metrics.valueImpactRatio != null ? `${(metrics.valueImpactRatio * 100).toFixed(1)}% do GMV protegido` : "Impacto estimado do backtest"}
              </span>
            </div>
          </div>
          {metrics.totalGmv != null && (
            <div className="border-t border-success-100 px-5 py-3 text-xs text-success-700">GMV do arquivo: {fmt(metrics.totalGmv)}</div>
          )}
        </div>
      )}

      {showConfusion && metrics.confusionMatrix && (
        <KeyFigureStrip
          figures={[
            {
              label: "True positives",
              value: metrics.confusionMatrix.tp.toLocaleString("pt-BR"),
              tone: "positive",
            },
            {
              label: "False negatives",
              value: metrics.confusionMatrix.fn.toLocaleString("pt-BR"),
              tone: "negative",
            },
            {
              label: "False positives",
              value: metrics.confusionMatrix.fp.toLocaleString("pt-BR"),
              tone: "warning",
            },
            {
              label: "True negatives",
              value: metrics.confusionMatrix.tn.toLocaleString("pt-BR"),
            },
          ]}
        />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {showComparativo && (
          <CompareCard
            title="Taxa de aprovação"
            todayValue={metrics.approvalRateToday * 100}
            koinValue={metrics.approvalRateKoin * 100}
            delta={(metrics.approvalRateKoin - metrics.approvalRateToday) * 100}
            format="percent"
            todaySub={`${txnApprovalToday.toLocaleString("pt-BR")} transações aprovadas`}
            koinSub={`${txnApprovalKoin.toLocaleString("pt-BR")} transações aprovadas`}
            footer="Melhor performance esperada com Koin"
          />
        )}

        {showConfusion && metrics.confusionMatrix && (
          <MetricCard
            title="Fraude detectada"
            items={[
              {
                label: "Taxa de detecção",
                value: `${(metrics.confusionMatrix.detectionRate * 100).toFixed(1)}%`,
                sub: `${metrics.confusionMatrix.tp.toLocaleString("pt-BR")} de ${fraudCount.toLocaleString("pt-BR")} casos`,
                accent: true,
              },
              {
                label: "Precisão",
                value: precision != null ? `${(precision * 100).toFixed(1)}%` : "—",
                sub:
                  precision != null
                    ? `${metrics.confusionMatrix.tp.toLocaleString("pt-BR")} rejeições corretas`
                    : "Sem base suficiente",
              },
            ]}
          />
        )}

        {showRevenue && (
          <MetricCard
            title="Recuperação de receita"
            items={[
              {
                label: "Txns recuperáveis",
                value: metrics.recoverableTransactions.toLocaleString("pt-BR"),
                sub: `${(metrics.recoveredRejectionPct * 100).toFixed(1)}% das rejeições atuais`,
                accent: true,
              },
              {
                label: "Volume recuperável",
                value: fmt(metrics.recoverableVolume),
                sub: "Receita que hoje fica no chão",
                accent: true,
              },
            ]}
            footer="Oportunidade de revenue recovery"
          />
        )}

        {showComparativo && (
          <CompareCard
            title="Chargeback rate"
            todayValue={metrics.fraudRateApprovedToday * 100}
            koinValue={metrics.fraudRateApprovedKoin * 100}
            delta={(metrics.fraudRateApprovedKoin - metrics.fraudRateApprovedToday) * 100}
            deltaFormat="pct"
            invertDelta
            format="percent"
            todaySub={fraudCount > 0 ? `${fraudCount.toLocaleString("pt-BR")} fraudes em aprovadas` : undefined}
            koinSub={metrics.confusionMatrix ? `${metrics.confusionMatrix.fn.toLocaleString("pt-BR")} fraudes residuais` : undefined}
          />
        )}

        {showComparativo && (
          <CompareCard
            title="Rejeição"
            todayValue={metrics.rejectionRateToday * 100}
            koinValue={metrics.rejectionRateKoin * 100}
            delta={(metrics.rejectionRateKoin - metrics.rejectionRateToday) * 100}
            format="percent"
            invertDelta
            todaySub={`${txnRejectToday.toLocaleString("pt-BR")} transações rejeitadas`}
            koinSub={`${txnRejectKoin.toLocaleString("pt-BR")} transações rejeitadas`}
            footer="Menor rejeição esperada com Koin"
          />
        )}

        {showDevoluciones && (
          <MetricCard
            title="Devoluções evitáveis"
            items={[
              {
                label: "Total de devoluções",
                value: metrics.devolucionCount!.toLocaleString("pt-BR"),
                sub: `${((metrics.devolucionCount! / metrics.totalRows) * 100).toFixed(1)}% das transações`,
              },
              {
                label: "Koin evitaria",
                value: metrics.devolucionKoinRejectCount?.toLocaleString("pt-BR") ?? "—",
                sub:
                  metrics.devolucionAvoidablePct != null
                    ? `${(metrics.devolucionAvoidablePct * 100).toFixed(1)}% evitáveis`
                    : "Sem estimativa de evitabilidade",
                accent: true,
              },
            ]}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {showFinancialAmounts && (
          <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white p-5 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#344054]">Fraude prevenida por valor</h3>
              <p className="mt-1 text-xs text-[#667085]">
                Valor bloqueado antes de virar chargeback versus fraudes residuais que escapariam.
              </p>
            </div>
            <FraudBar
              prevented={metrics.preventedFraudAmount!}
              residual={metrics.residualFraudAmount!}
              preventedLabel={fmt(metrics.preventedFraudAmount)}
              residualLabel={fmt(metrics.residualFraudAmount)}
            />
          </div>
        )}

        {showBrandMix && (
          <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white p-5 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#344054]">Concentração por bandeira</h3>
              <p className="mt-1 text-xs text-[#667085]">As 5 marcas mais representativas do volume transacional analisado.</p>
            </div>
            <div className="flex flex-col gap-3">
              {metrics.cardBrandDistribution!.slice(0, 5).map((brand) => (
                <div key={brand.key} className="grid grid-cols-[120px_minmax(0,1fr)_52px] items-center gap-3">
                  <span className="truncate text-sm font-medium text-[#475467]">{brand.key}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-[#EEF2F6]">
                    <div className="h-full rounded-full bg-[#2BE34F]" style={{ width: `${brand.pct * 100}%` }} />
                  </div>
                  <span className="text-right text-xs font-semibold text-[#475467]">{(brand.pct * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <section className="mb-2">
        <h2 className="mb-2 text-lg font-bold text-[#10181B]">Insights</h2>

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
                {insightsFetchState === "ready" && insights?.insights.length ? "Diagnóstico" : "Insights de IA"}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {criticalInsights.length > 0 && (
                  <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-sm font-medium text-[#B42318]">
                    {criticalInsights.length} crítico{criticalInsights.length !== 1 ? "s" : ""}
                  </span>
                )}
                {moderateInsights.length > 0 && (
                  <span className="rounded-full bg-[#FFF7ED] px-2.5 py-1 text-sm font-medium text-[#B54708]">
                    {moderateInsights.length} moderado{moderateInsights.length !== 1 ? "s" : ""}
                  </span>
                )}
                {informativeInsights.length > 0 && (
                  <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-sm font-medium text-[#475467]">
                    {informativeInsights.length} informativo{informativeInsights.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {insightsFetchState === "idle" && onGenerateInsights && (
              <Button onClick={onGenerateInsights} size="md" className="shrink-0 bg-[#10181B] text-white hover:bg-[#182225]">
                Adicionar mais
              </Button>
            )}
          </div>

          <div className="mt-4 h-px shrink-0 bg-[#E4E7EC]" />

          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-4">
            {insightsFetchState === "idle" && onGenerateInsights && (
              <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-[#D0D5DD] bg-white/60 px-5 py-6">
                <p className="text-sm text-[#667085]">Gere insights para ver o diagnóstico automático desta análise.</p>
              </div>
            )}

            {insightsFetchState === "loading" && (
              <div className="flex min-h-32 items-center gap-3 rounded-xl border border-[#E4E7EC] bg-white px-5 py-4">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#10B132]" />
                <p className="text-sm text-[#667085]">Gerando insights com IA…</p>
              </div>
            )}

            {insightsFetchState === "error" && (
              <div className="rounded-xl border border-[#FDB022] bg-[#FFFAEB] px-5 py-4">
                <p className="text-sm font-semibold text-[#7A2E0E]">Insights AI indisponíveis</p>
                <p className="mt-0.5 text-sm text-[#B54708]">
                  {insightsErrorMessage ?? "Verifique GEMINI_API_KEY no servidor ou tente novamente."}
                </p>
              </div>
            )}

            {insightsFetchState === "ready" && insights && insights.insights.length > 0 && (
              <div className="flex flex-col gap-4 pr-1">
                {insights.insights.map((insight, i) => (
                  <InsightCard key={i} insight={insight} />
                ))}

                <p className="flex items-center gap-1.5 text-xs text-[#667085]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  Insights gerados a partir dos dados agregados. Validar com o time de modelos antes de implementar regras.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
