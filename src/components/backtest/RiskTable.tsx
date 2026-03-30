import { cx } from "@/utils/cx";

interface RiskRow {
  key: string;
  total: number;
  fraudCount: number;
  fraudRate: number;
  fraudAmount?: number | null;
}

interface RiskTableProps {
  title: string;
  rows: RiskRow[];
  emptyMessage?: string;
  /** BINs: PRD thresholds 3% / 1%; default: 1% / 0.3% */
  variant?: "default" | "bin";
  itemLabel?: string;
  /** Currency formatter for the fraud amount column. Defaults to BRL if omitted. */
  formatMoney?: (n: number) => string;
}

export function RiskTable({
  title,
  rows,
  emptyMessage = "Sem dados",
  variant = "default",
  itemLabel = "Item",
  formatMoney,
}: RiskTableProps) {
  const fmtMoney = formatMoney ?? ((n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  const showAmount = rows.some((r) => r.fraudAmount != null && r.fraudAmount > 0);

  const rateClass = (rate: number) => {
    if (variant === "bin") {
      return rate > 0.03
        ? "text-error-800"
        : rate > 0.01
          ? "text-warning-800"
          : "text-secondary";
    }
    return rate > 0.01
      ? "text-error-800"
      : rate > 0.003
        ? "text-warning-800"
        : "text-secondary";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
      <div className="border-b border-secondary px-5 py-4">
        <h3 className="text-sm font-semibold text-secondary">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-tertiary">{emptyMessage}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary">
                <th className="px-5 py-3 text-left font-semibold text-quaternary">{itemLabel}</th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">Total</th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">Fraudes</th>
                {showAmount && (
                  <th className="px-5 py-3 text-right font-semibold text-quaternary">Monto fraude</th>
                )}
                <th className="px-5 py-3 text-right font-semibold text-quaternary">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.key}
                  className={cx(
                    "border-b border-secondary last:border-0",
                    i % 2 !== 0 && "bg-secondary_alt",
                  )}
                >
                  <td className="px-5 py-3 text-secondary">{row.key}</td>
                  <td className="px-5 py-3 text-right font-mono text-secondary">{row.total}</td>
                  <td className="px-5 py-3 text-right font-mono text-secondary">{row.fraudCount}</td>
                  {showAmount && (
                    <td className="px-5 py-3 text-right font-mono text-secondary">
                      {row.fraudAmount != null && row.fraudAmount > 0
                        ? fmtMoney(row.fraudAmount)
                        : "—"}
                    </td>
                  )}
                  <td className={cx("px-5 py-3 text-right font-mono font-semibold", rateClass(row.fraudRate))}>
                    {(row.fraudRate * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
