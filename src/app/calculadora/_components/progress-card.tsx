"use client";

import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

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
      className={cx(
        "w-full rounded-xl border px-4 py-3 text-left shadow-xs ring-1 ring-inset transition-all",
        isActive
          ? "border-brand-300 bg-brand-primary_alt ring-brand-200"
          : "border-secondary bg-primary ring-secondary hover:border-secondary_hover hover:bg-secondary",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cx(
              "truncate text-sm font-semibold",
              isActive ? "text-brand-secondary" : "text-primary",
            )}
          >
            {title}
          </p>
          <p className="truncate text-[11px] text-quaternary">{description}</p>
        </div>
        {isMandatory && !isComplete && (
          <Badge type="pill-color" color="error" size="sm" className="shrink-0 uppercase tracking-wider">
            Req.
          </Badge>
        )}
        {isComplete && (
          <Badge type="pill-color" color="success" size="sm" className="shrink-0">
            ✓
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className={cx(
              "h-full rounded-full transition-all duration-300",
              isComplete ? "bg-success-500" : "bg-brand-solid",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-quaternary">
          {completedCount}/{totalCount}
        </span>
      </div>
    </button>
  );
}
