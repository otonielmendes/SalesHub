import { cx } from "@/utils/cx";

interface CompareCardProps {
  title: string;
  todayValue: string | number;
  koinValue: string | number;
  delta?: number;
  /** Format: "percent" | "currency" | "raw" */
  format?: "percent" | "currency" | "raw";
}

function formatValue(value: string | number, format: CompareCardProps["format"]): string {
  if (typeof value === "string") return value;
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (format === "currency")
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return String(value);
}

export function CompareCard({
  title,
  todayValue,
  koinValue,
  delta,
  format = "percent",
}: CompareCardProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNeutral = delta === undefined || delta === 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <p className="mb-4 text-sm font-semibold text-secondary">{title}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-tertiary">Hoje</span>
          <span className="font-mono text-display-xs font-semibold text-primary">
            {formatValue(todayValue, format)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-tertiary">Con Koin</span>
          <span className="font-mono text-display-xs font-semibold text-brand-700">
            {formatValue(koinValue, format)}
          </span>
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cx(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              isNeutral
                ? "bg-gray-100 text-gray-700"
                : isPositive
                  ? "bg-success-50 text-success-700"
                  : "bg-error-50 text-error-700",
            )}
          >
            {isPositive ? "+" : ""}
            {delta.toFixed(1)} pp
          </span>
          <span className="text-xs text-tertiary">vs. hoje</span>
        </div>
      )}
    </div>
  );
}
