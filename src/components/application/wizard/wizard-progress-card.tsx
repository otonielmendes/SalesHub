"use client";

import type { ComponentType, SVGProps } from "react";
import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

type CardState = "active" | "complete" | "pending";
type BadgeTone = "required" | "optional" | "neutral";

interface WizardProgressCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  meta: string;
  progress: number;
  state: CardState;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  onClick?: () => void;
  className?: string;
}

export function WizardProgressCard({
  icon: Icon,
  title,
  description,
  meta,
  progress,
  state,
  badgeLabel,
  badgeTone = "neutral",
  onClick,
  className,
}: WizardProgressCardProps) {
  const isComplete = state === "complete";
  const isActive = state === "active";
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cx(
        "w-full rounded-xl border p-4 text-left transition-colors",
        onClick && "cursor-pointer",
        isComplete
          ? "border-[#12B76A] bg-[#F6FEF9]"
          : isActive
            ? "border-[#12B76A] bg-[#F6FEF9]"
            : "border-[#D0D5DD] bg-white",
        onClick && !isActive && !isComplete && "hover:border-[#98A2B3]",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-4">
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isComplete
              ? "bg-[#0C8525] text-white"
              : isActive
                ? "bg-[#ECFDF3] text-[#0C8525] ring-1 ring-inset ring-[#12B76A]"
                : "bg-[#F2F4F7] text-[#344054]",
          )}
        >
          {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-primary">{title}</h2>
              <p className="mt-1 text-sm leading-5 text-tertiary">{description}</p>
            </div>

            {badgeLabel ? (
              <span
                className={cx(
                  "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                  badgeTone === "required" && "bg-[#FEF3F2] text-[#B42318]",
                  badgeTone === "optional" && "bg-[#E4FBE9] text-[#0C8525]",
                  badgeTone === "neutral" && "bg-[#F8F9FC] text-[#363F72]",
                )}
              >
                {badgeLabel}
              </span>
            ) : null}

            {!badgeLabel ? (
              <span
                className={cx(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
                  isComplete ? "border-[#0C8525] bg-[#0C8525] text-white" : "border-[#D0D5DD] bg-white text-transparent",
                )}
                aria-hidden="true"
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-1.5 flex items-end justify-between gap-2 text-xs text-secondary">
        <span>{meta}</span>
        <span>{normalizedProgress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#F2F4F7]">
        <div className="h-full rounded-full bg-[#12B76A] transition-all duration-500" style={{ width: `${normalizedProgress}%` }} />
      </div>
    </Component>
  );
}
