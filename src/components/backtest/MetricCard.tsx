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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-brand-600" />
        <p className="text-sm font-medium text-secondary">{title}</p>
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-xs text-tertiary">{item.label}</span>
            <span
              className={`font-mono text-display-xs font-semibold leading-none ${
                item.accent ? "text-brand-700" : "text-primary"
              }`}
            >
              {item.value}
            </span>
            {item.sub && <span className="text-xs text-tertiary">{item.sub}</span>}
          </div>
        ))}
      </div>
      {footer && (
        <div className="mt-3 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800">
          {footer}
        </div>
      )}
    </div>
  );
}
