import { cx } from "@/utils/cx";

interface CompareCardProps {
  title: string;
  todayValue: string | number;
  koinValue: string | number;
  delta?: number;
  /** Format: "percent" | "currency" | "raw" */
  format?: "percent" | "currency" | "raw";
  /** Delta badge format: "pp" = percentage points (+18.0pp), "pct" = relative % change (-80%) */
  deltaFormat?: "pp" | "pct";
  /**
   * When true, a negative delta is treated as good (green badge).
   * Use for metrics where lower = better, e.g. chargeback rate.
   */
  invertDelta?: boolean;
  footer?: string;
  /** Optional sub-labels */
  todayLabel?: string;
  koinLabel?: string;
  /** Optional sub-counts */
  todaySub?: string;
  koinSub?: string;
  /** When true, renders a "—" dash badge instead of a delta value */
  dashBadge?: boolean;
}

function formatValue(value: string | number, format: CompareCardProps["format"]): string {
  if (typeof value === "string") return value;
  if (!isFinite(value)) return "—";
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
  deltaFormat = "pp",
  invertDelta = false,
  footer,
  todayLabel = "Merchant",
  koinLabel = "Koin",
  todaySub,
  koinSub,
  dashBadge = false,
}: CompareCardProps) {
  const validDelta = delta !== undefined && isFinite(delta) ? delta : undefined;
  const isNeutral = validDelta === undefined || validDelta === 0;
  // When invertDelta, negative is good (e.g. chargeback rate going down is positive outcome)
  const isPositive = validDelta !== undefined && (invertDelta ? validDelta < 0 : validDelta > 0);

  function formatDelta(d: number): string {
    if (deltaFormat === "pct") {
      return `${d > 0 ? "+" : ""}${d.toFixed(0)}%`;
    }
    return `${d > 0 ? "+" : ""}${d.toFixed(1)}pp`;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      {/* Card header */}
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-brand-600" />
        <p className="text-sm font-semibold text-secondary">{title}</p>
      </div>

      {/* Two-column body with vertical divider */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Left — Merchant/Outro */}
        <div className="flex flex-col gap-1 px-5 py-4">
          <span className="text-xs font-medium text-quaternary">{todayLabel}</span>
          <span className="font-mono text-2xl font-bold text-primary leading-none">
            {formatValue(todayValue, format)}
          </span>
          {todaySub && (
            <span className="text-xs text-tertiary">{todaySub}</span>
          )}
        </div>

        {/* Right — Koin */}
        <div className="flex flex-col gap-1 px-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-brand-700">{koinLabel}</span>
            {(validDelta !== undefined || dashBadge) && (
              <span
                className={cx(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  dashBadge && validDelta === undefined
                    ? "bg-gray-100 text-gray-500"
                    : isNeutral
                      ? "bg-gray-100 text-gray-700"
                      : isPositive
                        ? "bg-brand-50 text-brand-700"
                        : "bg-error-50 text-error-700",
                )}
              >
                {dashBadge && validDelta === undefined ? "—" : formatDelta(validDelta!)}
              </span>
            )}
          </div>
          <span className="font-mono text-2xl font-bold text-brand-700 leading-none">
            {formatValue(koinValue, format)}
          </span>
          {koinSub && (
            <span className="text-xs text-tertiary">{koinSub}</span>
          )}
        </div>
      </div>

      {/* Optional footer */}
      {footer && (
        <div className="border-t border-gray-100 bg-brand-25 px-5 py-2.5 text-xs font-medium text-brand-700">
          {footer}
        </div>
      )}
    </div>
  );
}
