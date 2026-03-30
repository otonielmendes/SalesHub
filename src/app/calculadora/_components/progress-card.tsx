"use client";

interface ProgressCardProps {
  title: string;
  description: string;
  completedCount: number;
  totalCount: number;
  isMandatory: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function ProgressCard({
  title,
  description,
  completedCount,
  totalCount,
  isMandatory,
  isActive,
  onClick,
}: ProgressCardProps) {
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
        isActive
          ? "border-brand-300 bg-brand-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-brand-700" : "text-gray-900"}`}>
            {title}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{description}</p>
        </div>
        {isMandatory && !isComplete && (
          <span className="text-[9px] font-bold text-error-600 bg-error-50 border border-error-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Req.
          </span>
        )}
        {isComplete && (
          <span className="text-[9px] font-bold text-success-700 bg-success-50 border border-success-100 px-1.5 py-0.5 rounded-full shrink-0">
            ✓
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isComplete ? "bg-success-500" : "bg-brand-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-gray-400 shrink-0">
          {completedCount}/{totalCount}
        </span>
      </div>
    </button>
  );
}
