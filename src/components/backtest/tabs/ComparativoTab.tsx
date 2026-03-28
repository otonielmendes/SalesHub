import { CompareCard } from "@/components/backtest/CompareCard";
import { StatRow } from "@/components/backtest/StatRow";
import { FraudBar } from "@/components/backtest/FraudBar";
import type { BacktestCapabilities, BacktestMetrics } from "@/types/backtest";

interface ComparativoTabProps {
  metrics: BacktestMetrics;
}

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  return (
    <div className="flex flex-col gap-8">
      {showComparativo && (
        <section>
          <h2 className="mb-4 text-sm font-semibold text-secondary">Performance Comparativa</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CompareCard
              title="Aprobación"
              todayValue={metrics.approvalRateToday * 100}
              koinValue={metrics.approvalRateKoin * 100}
              delta={(metrics.approvalRateKoin - metrics.approvalRateToday) * 100}
              format="percent"
            />
            <CompareCard
              title="Rechazo"
              todayValue={metrics.rejectionRateToday * 100}
              koinValue={metrics.rejectionRateKoin * 100}
              delta={(metrics.rejectionRateKoin - metrics.rejectionRateToday) * 100}
              format="percent"
            />
            <CompareCard
              title="Fraude en Aprobadas"
              todayValue={metrics.fraudRateApprovedToday * 100}
              koinValue={metrics.fraudRateApprovedKoin * 100}
              delta={(metrics.fraudRateApprovedKoin - metrics.fraudRateApprovedToday) * 100}
              format="percent"
            />
          </div>
        </section>
      )}

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

      {showRevenue && (
        <section className="rounded-xl border-l-4 border-success-600 bg-success-50 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-success-800">Revenue Recovery</p>
              <p className="mt-1 text-xs text-success-700">
                Transações legítimas rejeitadas hoje que a Koin aprovaria
              </p>
            </div>
            {metrics.recoverableVolume > 0 && (
              <span className="font-mono text-lg font-bold text-success-800">
                {fmt(metrics.recoverableVolume)}
              </span>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-success-700">Transações recuperáveis</p>
              <p className="font-mono text-xl font-bold text-success-900">
                {metrics.recoverableTransactions}
              </p>
            </div>
            {metrics.recoveredRejectionPct > 0 && (
              <div>
                <p className="text-xs text-success-700">% dos rechazos recuperados</p>
                <p className="font-mono text-xl font-bold text-success-900">
                  {(metrics.recoveredRejectionPct * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {showConfusion && metrics.confusionMatrix && (
          <section className="rounded-xl border border-secondary bg-primary p-5">
            <h3 className="mb-4 text-sm font-semibold text-secondary">Detecção de Fraude</h3>
            <StatRow label="Verdadeiros Positivos (TP)" value={metrics.confusionMatrix.tp} />
            <StatRow label="Falsos Negativos (FN)" value={metrics.confusionMatrix.fn} />
            <StatRow label="Falsos Positivos (FP)" value={metrics.confusionMatrix.fp} />
            <StatRow label="Verdadeiros Negativos (TN)" value={metrics.confusionMatrix.tn} />
            <div className="mt-3 rounded-lg bg-brand-50 px-4 py-3">
              <p className="text-xs text-brand-700">Taxa de Detecção</p>
              <p className="font-mono text-display-xs font-bold text-brand-700">
                {(metrics.confusionMatrix.detectionRate * 100).toFixed(1)}%
              </p>
            </div>
          </section>
        )}

        {showFinancial && (
          <section className="rounded-xl border border-secondary bg-primary p-5">
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
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {showCardBrand && (
          <section className="rounded-xl border border-secondary bg-primary p-5">
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
          </section>
        )}

        {showDevoluciones && (
          <section className="rounded-xl border border-secondary bg-primary p-5">
            <h3 className="mb-4 text-sm font-semibold text-secondary">Devoluciones y Cancelaciones</h3>
            <StatRow label="Total de devoluciones/cancelaciones" value={metrics.devolucionCount!} />
            {metrics.devolucionKoinRejectCount != null && (
              <StatRow
                label="Com veredicto Koin = Reject"
                value={metrics.devolucionKoinRejectCount}
              />
            )}
            {metrics.devolucionAvoidablePct != null && (
              <StatRow
                label="% que a Koin rejeitaria"
                value={`${(metrics.devolucionAvoidablePct * 100).toFixed(1)}%`}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
