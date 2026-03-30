export interface MetricItem {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

interface MetricCardProps {
  title: string;
  items: MetricItem[];
  footer?: string;
}

export function MetricCard({ title, items, footer }: MetricCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      {/* Header — matches CompareCard style */}
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-brand-600" />
        <p className="text-sm font-semibold text-secondary">{title}</p>
      </div>

      {/* Columns with vertical divider */}
      <div
        className="grid divide-x divide-gray-100"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-1 px-5 py-4">
            <span className="text-xs text-tertiary">{item.label}</span>
            <span
              className={`font-mono text-2xl font-bold leading-none ${
                item.accent ? "text-brand-700" : "text-primary"
              }`}
            >
              {item.value}
            </span>
            {item.sub && <span className="text-xs text-tertiary">{item.sub}</span>}
          </div>
        ))}
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
