import { cx } from "@/utils/cx";

interface CompareCardProps {
  title: string;
  todayValue: string | number;
  koinValue: string | number;
  delta?: number;
  /** Format: "percent" | "currency" | "raw" */
  format?: "percent" | "currency" | "raw";
  footer?: string;
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
  footer,
}: CompareCardProps) {
  const isPositive = delta !== undefined && delta > 0;
  const isNeutral = delta === undefined || delta === 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-brand-600" />
        <p className="text-sm font-medium text-secondary">{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-tertiary">Merchant</span>
          <span className="font-mono text-display-xs font-semibold text-primary">
            {formatValue(todayValue, format)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-brand-800">Koin</span>
            {delta !== undefined && (
              <span
                className={cx(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                  isNeutral
                    ? "bg-gray-100 text-gray-700"
                    : isPositive
                      ? "bg-brand-50 text-brand-800"
                      : "bg-error-50 text-error-700",
                )}
              >
                {isPositive ? "+" : ""}
                {delta.toFixed(1)}pp
              </span>
            )}
          </div>
          <span className="font-mono text-display-xs font-semibold text-brand-800">
            {formatValue(koinValue, format)}
          </span>
        </div>
      </div>
      {footer && (
        <div className="mt-3 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800">
          {footer}
        </div>
      )}
    </div>
  );
}
