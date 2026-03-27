import { cx } from "@/utils/cx";

interface RiskTableProps {
  title: string;
  rows: Array<{
    key: string;
    total: number;
    fraudCount: number;
    fraudRate: number;
  }>;
  emptyMessage?: string;
}

export function RiskTable({ title, rows, emptyMessage = "Sem dados" }: RiskTableProps) {
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
                <th className="px-5 py-3 text-left font-semibold text-quaternary">Item</th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">Total</th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">Fraudes</th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.key}
                  className={cx("border-b border-secondary last:border-0", i % 2 !== 0 && "bg-secondary_alt")}
                >
                  <td className="px-5 py-3 text-secondary">{row.key}</td>
                  <td className="px-5 py-3 text-right font-mono text-secondary">{row.total}</td>
                  <td className="px-5 py-3 text-right font-mono text-secondary">{row.fraudCount}</td>
                  <td
                    className={cx(
                      "px-5 py-3 text-right font-mono font-semibold",
                      row.fraudRate > 0.01
                        ? "text-error-800"
                        : row.fraudRate > 0.003
                          ? "text-warning-800"
                          : "text-secondary",
                    )}
                  >
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
