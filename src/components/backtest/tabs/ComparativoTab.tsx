import { CompareCard } from "@/components/backtest/CompareCard";
import { MetricCard } from "@/components/backtest/MetricCard";
import { StatRow } from "@/components/backtest/StatRow";
import { FraudBar } from "@/components/backtest/FraudBar";
import type { BacktestCapabilities, BacktestMetrics } from "@/types/backtest";

interface ComparativoTabProps {
  metrics: BacktestMetrics;
}

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
}

export function ComparativoTab({ metrics }: ComparativoTabProps) {
  const c = metrics.capabilities;
  const cap = (key: keyof BacktestCapabilities) => (c ? c[key] : true);

  const showComparativo = cap("comparativo");
  const showRevenue = cap("revenueRecovery") && metrics.recoverableTransactions > 0;
  const showConfusion = cap("confusionMatrix") && metrics.confusionMatrix != null;
  const showFinancial =
    cap("financialImpact") &&
    metrics.preventedFraudAmount !== null &&
    metrics.residualFraudAmount !== null;
  const showCardBrand =
    cap("cardBrand") && metrics.cardBrandDistribution && metrics.cardBrandDistribution.length > 0;
  const showDevoluciones =
    cap("devoluciones") && metrics.devolucionCount !== null && metrics.devolucionCount > 0;
  const showRoi =
    cap("roi") &&
    metrics.totalGmv != null &&
    metrics.totalGmv > 0 &&
    metrics.protectedValue != null &&
    metrics.valueImpactRatio != null;

  const fraudCount = metrics.confusionMatrix
    ? metrics.confusionMatrix.tp + metrics.confusionMatrix.fn
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Aprobación + Fraude detectada */}
      {(showComparativo || showConfusion) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showComparativo && (
            <CompareCard
              title="Aprobación"
              todayValue={metrics.approvalRateToday * 100}
              koinValue={metrics.approvalRateKoin * 100}
              delta={(metrics.approvalRateKoin - metrics.approvalRateToday) * 100}
              format="percent"
              footer="Mejor performance en Koin"
            />
          )}
          {showConfusion && metrics.confusionMatrix && (
            <MetricCard
              title="Fraude detectada"
              items={[
                {
                  label: "Taxa de detecção",
                  value: `${(metrics.confusionMatrix.detectionRate * 100).toFixed(1)}%`,
                  sub: fraudCount != null ? `${metrics.confusionMatrix.tp} de ${fraudCount} casos` : undefined,
                  accent: true,
                },
                ...(metrics.preventedPct !== null
                  ? [
                      {
                        label: "Monto prevenido",
                        value: `${(metrics.preventedPct * 100).toFixed(1)}%`,
                        sub: metrics.preventedFraudAmount != null
                          ? `${fmtCompact(metrics.preventedFraudAmount)} de ${fmtCompact(metrics.totalFraudAmount ?? 0)}`
                          : undefined,
                        accent: true,
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      )}

      {/* Row 2: Recuperación + Chargeback rate */}
      {(showRevenue || showComparativo) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showRevenue && (
            <MetricCard
              title="Recuperación de ingresos"
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
                        value: fmtCompact(metrics.recoverableVolume),
                        sub: "Ingresos perdidos hoje",
                        accent: true,
                      },
                    ]
                  : []),
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
              format="percent"
            />
          )}
        </div>
      )}

      {/* Row 3: Rechazo + Devoluciones */}
      {(showComparativo || showDevoluciones) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showComparativo && (
            <CompareCard
              title="Rechazo"
              todayValue={metrics.rejectionRateToday * 100}
              koinValue={metrics.rejectionRateKoin * 100}
              delta={(metrics.rejectionRateKoin - metrics.rejectionRateToday) * 100}
              format="percent"
              footer="Menor rechazo com Koin"
            />
          )}
          {showDevoluciones && (
            <MetricCard
              title="Devoluciones y cancelaciones"
              items={[
                {
                  label: "Total devoluciones",
                  value: metrics.devolucionCount!.toLocaleString("pt-BR"),
                  sub: `${((metrics.devolucionCount! / metrics.totalRows) * 100).toFixed(1)}% das txns`,
                },
                ...(metrics.devolucionKoinRejectCount != null
                  ? [
                      {
                        label: "Koin evitaria",
                        value: metrics.devolucionKoinRejectCount.toLocaleString("pt-BR"),
                        sub: metrics.devolucionAvoidablePct != null
                          ? `${(metrics.devolucionAvoidablePct * 100).toFixed(1)}% evitáveis`
                          : undefined,
                        accent: true,
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      )}

      {/* Confusion matrix — 4 células inline */}
      {showConfusion && metrics.confusionMatrix && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-secondary bg-secondary_alt p-5 sm:grid-cols-4">
          {[
            { label: "True positives", value: metrics.confusionMatrix.tp, color: "text-brand-700" },
            { label: "False negatives", value: metrics.confusionMatrix.fn, color: "text-error-800" },
            { label: "False positives", value: metrics.confusionMatrix.fp, color: "text-warning-800" },
            { label: "True negatives", value: metrics.confusionMatrix.tn, color: "text-primary" },
          ].map((cell) => (
            <div key={cell.label}>
              <p className="mb-0.5 text-xs text-tertiary">{cell.label}</p>
              <p className={`font-mono text-xl font-semibold ${cell.color}`}>
                {cell.value.toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Financial impact + FraudBar */}
      {showFinancial && (
        <div className="rounded-xl border border-secondary bg-primary p-5">
          <h3 className="mb-4 text-sm font-semibold text-secondary">Impacto Financeiro</h3>
          {metrics.totalFraudAmount !== null && (
            <StatRow label="Monto total de fraude" value={fmt(metrics.totalFraudAmount)} />
          )}
          <StatRow label="Fraude prevenido por Koin" value={fmt(metrics.preventedFraudAmount!)} />
          <StatRow label="Fraude residual" value={fmt(metrics.residualFraudAmount!)} />
          {metrics.preventedPct !== null && (
            <StatRow label="% prevenido" value={`${(metrics.preventedPct * 100).toFixed(1)}%`} />
          )}
          <div className="mt-4">
            <FraudBar
              prevented={metrics.preventedFraudAmount!}
              residual={metrics.residualFraudAmount!}
            />
          </div>
        </div>
      )}

      {/* ROI / Impacto econômico */}
      {showRoi && (
        <section className="rounded-xl border border-brand-200 bg-brand-25 p-5">
          <h3 className="mb-2 text-sm font-semibold text-brand-900">Impacto econômico (estimativa)</h3>
          <p className="mb-4 text-xs text-brand-800">
            Valor protegido = fraude prevenida pela Koin + volume recuperável (rejeições legítimas que a
            Koin aprovaria). Ratio = valor protegido ÷ GMV do arquivo. Não inclui custo da solução.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-brand-800">GMV (soma dos amounts)</p>
              <p className="font-mono text-lg font-bold text-brand-900">{fmt(metrics.totalGmv!)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-800">Valor protegido</p>
              <p className="font-mono text-lg font-bold text-brand-900">
                {fmt(metrics.protectedValue!)}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-800">% do GMV</p>
              <p className="font-mono text-lg font-bold text-brand-900">
                {(metrics.valueImpactRatio! * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Card Brand distribution */}
      {showCardBrand && (
        <div className="rounded-xl border border-secondary bg-primary p-5">
          <h3 className="mb-4 text-sm font-semibold text-secondary">Marcas de Cartão</h3>
          <div className="flex flex-col gap-2">
            {metrics.cardBrandDistribution!.slice(0, 8).map((brand) => (
              <div key={brand.key} className="flex items-center gap-3">
                <span className="w-28 truncate text-xs text-secondary">{brand.key}</span>
                <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-gray-100">
                  <div
                    style={{ width: `${brand.pct * 100}%` }}
                    className="h-full bg-brand-400 transition-all"
                  />
                </div>
                <span className="w-14 text-right font-mono text-xs text-tertiary">
                  {(brand.pct * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
