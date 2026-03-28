import { RiskTable } from "@/components/backtest/RiskTable";
import { cx } from "@/utils/cx";
import type { BacktestMetrics, VelocityEntry } from "@/types/backtest";

interface FraudIntelligenceTabProps {
  metrics: BacktestMetrics;
}

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function VelocityTable({ rows }: { rows: VelocityEntry[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-tertiary">
        Nenhum documento com 10+ transações
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-secondary">
            <th className="px-5 py-3 text-left font-semibold text-quaternary">Documento</th>
            <th className="px-5 py-3 text-right font-semibold text-quaternary">Txns</th>
            <th className="px-5 py-3 text-right font-semibold text-quaternary">Fraudes</th>
            <th className="px-5 py-3 text-right font-semibold text-quaternary">Koin rejects</th>
            <th className="px-5 py-3 text-right font-semibold text-quaternary">Volume</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.document}
              className={cx(
                "border-b border-secondary last:border-0",
                i % 2 !== 0 && "bg-secondary_alt",
              )}
            >
              <td className="px-5 py-3 font-mono text-secondary">{row.document}</td>
              <td className="px-5 py-3 text-right font-mono text-secondary">{row.total}</td>
              <td
                className={cx(
                  "px-5 py-3 text-right font-mono font-semibold",
                  row.fraudCount > 0 ? "text-error-800" : "text-secondary",
                )}
              >
                {row.fraudCount}
              </td>
              <td className="px-5 py-3 text-right font-mono text-secondary">
                {"koinRejectCount" in row ? row.koinRejectCount : 0}
              </td>
              <td className="px-5 py-3 text-right font-mono text-secondary">
                {row.volume != null ? fmt(row.volume) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FraudIntelligenceTab({ metrics }: FraudIntelligenceTabProps) {
  const c = metrics.capabilities;
  const allow = (key: keyof NonNullable<typeof c>) => (c ? c[key] : true);

  const hasAny =
    (allow("riskByItem") && metrics.riskByItem && metrics.riskByItem.length > 0) ||
    (allow("riskByBin") && metrics.riskByBin && metrics.riskByBin.length > 0) ||
    (allow("riskByEmailDomain") && metrics.riskByEmailDomain && metrics.riskByEmailDomain.length > 0) ||
    (allow("highVelocity") && metrics.highVelocityDocuments && metrics.highVelocityDocuments.length > 0) ||
    (allow("riskByPhone") && metrics.riskByPhone && metrics.riskByPhone.length > 0);

  if (!hasAny) {
    return (
      <div className="py-16 text-center text-sm text-tertiary">
        Colunas insuficientes para gerar inteligência de fraude.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {allow("riskByItem") && metrics.riskByItem && (
        <RiskTable
          title="Categorías de Mayor Riesgo"
          rows={metrics.riskByItem.slice(0, 20)}
          emptyMessage="Nenhuma categoria com fraude registrada"
          itemLabel="Categoría"
        />
      )}

      {allow("riskByBin") && metrics.riskByBin && (
        <RiskTable
          title="BINs de Alto Riesgo (mín. 5 txns)"
          rows={metrics.riskByBin.slice(0, 20)}
          emptyMessage="Nenhum BIN com fraude (mín. 5 transações)"
          variant="bin"
          itemLabel="BIN"
        />
      )}

      {allow("riskByEmailDomain") && metrics.riskByEmailDomain && (
        <RiskTable
          title="Dominios de Email con Fraude"
          rows={metrics.riskByEmailDomain.slice(0, 20)}
          emptyMessage="Nenhum domínio de email com fraude"
          itemLabel="Dominio"
        />
      )}

      {allow("highVelocity") && metrics.highVelocityDocuments && (
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
          <div className="border-b border-secondary px-5 py-4">
            <h3 className="text-sm font-semibold text-secondary">
              Identidades de Alta Velocidad (10+ txns — Top 20)
            </h3>
          </div>
          <VelocityTable rows={metrics.highVelocityDocuments} />
        </div>
      )}

      {allow("riskByPhone") && metrics.riskByPhone && (
        <RiskTable
          title="Códigos de Área Telefónico con Fraude"
          rows={metrics.riskByPhone.slice(0, 20)}
          emptyMessage="Nenhum código de área com fraude"
          itemLabel="Código"
        />
      )}
    </div>
  );
}
