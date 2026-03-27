interface FraudBarProps {
  prevented: number;
  residual: number;
  label?: boolean;
}

export function FraudBar({ prevented, residual, label = true }: FraudBarProps) {
  const total = prevented + residual;
  if (total === 0) return null;
  const preventedPct = (prevented / total) * 100;
  const residualPct = (residual / total) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2 w-full overflow-hidden rounded-md bg-gray-100">
        <div
          style={{ width: `${preventedPct}%` }}
          className="h-full bg-brand-500 transition-all"
        />
        <div
          style={{ width: `${residualPct}%` }}
          className="h-full bg-error-800 transition-all"
        />
      </div>
      {label && (
        <div className="flex items-center gap-4 text-xs text-tertiary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand-500" />
            Prevenido ({preventedPct.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-error-800" />
            Residual ({residualPct.toFixed(0)}%)
          </span>
        </div>
      )}
    </div>
  );
}
