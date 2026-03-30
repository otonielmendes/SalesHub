interface FraudBarProps {
  prevented: number;
  residual: number;
  preventedLabel?: string;
  residualLabel?: string;
}

export function FraudBar({ prevented, residual, preventedLabel, residualLabel }: FraudBarProps) {
  const total = prevented + residual;
  if (total === 0) return null;
  const preventedPct = (prevented / total) * 100;
  const residualPct = (residual / total) * 100;

  const leftText = preventedLabel
    ? `${preventedLabel} (${preventedPct.toFixed(1)}%)`
    : `Prevenido (${preventedPct.toFixed(0)}%)`;

  const rightText = residualLabel
    ? `${residualLabel} (${residualPct.toFixed(1)}%)`
    : `Residual (${residualPct.toFixed(0)}%)`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 w-full overflow-hidden rounded-md bg-gray-100">
        <div
          style={{ width: `${preventedPct}%` }}
          className="h-full bg-success-500 transition-all"
        />
        <div
          style={{ width: `${residualPct}%` }}
          className="h-full bg-error-600 transition-all"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-success-500" />
          {leftText}
        </span>
        <span className="flex items-center gap-1.5">
          {rightText}
          <span className="h-2 w-2 rounded-sm bg-error-600" />
        </span>
      </div>
    </div>
  );
}
