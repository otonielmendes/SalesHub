"use client";

import type { ComponentType, SVGProps } from "react";
import { cx } from "@/utils/cx";

interface ProgressCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  completedCount: number;
  totalCount: number;
  isMandatory: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function ProgressCard({
  icon: Icon,
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
        "w-full rounded-2xl border p-4 text-left transition-all duration-200",
        isComplete
          ? "border-[#0C8525] bg-[#E4FBE9]"
          : isActive
            ? "border-[#10B132] bg-[#F6FEF9]"
            : "border-[#D0D5D7] bg-white hover:border-[#98A2A4]",
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isComplete
              ? "bg-[#0C8525]"
              : isActive
                ? "bg-[#E4FBE9] ring-1 ring-inset ring-[#10B132]"
                : "bg-[#F2F4F6]",
          )}
        >
          <Icon
            className={cx(
              "h-6 w-6",
              isComplete ? "text-white" : isActive ? "text-[#0C8525]" : "text-[#344043]",
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-bold text-[#475456]">{title}</span>
            <span
              className={cx(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                isMandatory ? "bg-[#FEF3F2] text-[#B42318]" : "bg-[#E4FBE9] text-[#0C8525]",
              )}
            >
              {isMandatory ? "Obrigatório" : "Desejável"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#475456]">{description}</p>
        </div>
        <div
          className={cx(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
            isComplete
              ? "border-[#0C8525] bg-[#0C8525]"
              : "border-[#D0D5D7] bg-white",
          )}
        >
          {isComplete && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="mb-1 flex items-end justify-between gap-2 text-[10px] text-[#344043]">
        <span>
          {completedCount} de {totalCount} campos
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#F2F4F6]">
        <div
          className="h-full rounded-full bg-[#10B132] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
