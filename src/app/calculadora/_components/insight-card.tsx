"use client";

import { AlertCircle, AlertTriangle, InfoCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx } from "@/utils/cx";

type Priority = "CRITICAL" | "WARNING" | "INFO";

const config: Record<
  Priority,
  {
    border: string;
    bg: string;
    badgeColor: "error" | "warning" | "brand";
    badgeLabel: string;
    icon: typeof AlertTriangle;
    featuredColor: "error" | "warning" | "brand";
  }
> = {
  CRITICAL: {
    border: "border-l-error-500",
    bg: "bg-error-50",
    badgeColor: "error",
    badgeLabel: "Crítico",
    icon: AlertTriangle,
    featuredColor: "error",
  },
  WARNING: {
    border: "border-l-warning-500",
    bg: "bg-warning-50",
    badgeColor: "warning",
    badgeLabel: "Atenção",
    icon: AlertCircle,
    featuredColor: "warning",
  },
  INFO: {
    border: "border-l-brand-500",
    bg: "bg-brand-50",
    badgeColor: "brand",
    badgeLabel: "Info",
    icon: InfoCircle,
    featuredColor: "brand",
  },
};

interface InsightCardProps {
  title: string;
  priority: Priority;
  category: string;
  insight: string;
  ruleId: string;
}

export function InsightCard({ title, priority, category, insight, ruleId }: InsightCardProps) {
  const { border, bg, badgeColor, badgeLabel, icon: Icon, featuredColor } = config[priority];

  return (
    <div
      className={cx(
        "flex gap-4 rounded-xl border border-secondary p-5 shadow-xs ring-1 ring-secondary ring-inset",
        "border-l-4",
        border,
        bg,
      )}
    >
      <FeaturedIcon icon={Icon} color={featuredColor} theme="modern" size="md" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge type="pill-color" color={badgeColor} size="sm">
            {badgeLabel}
          </Badge>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-quaternary">{category}</span>
          <span className="ml-auto text-[10px] text-quaternary">{ruleId}</span>
        </div>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="text-sm leading-relaxed text-secondary">{insight}</p>
        <div className="rounded-lg border border-secondary bg-primary p-3 ring-1 ring-primary ring-inset">
          <p className="text-xs font-medium text-brand-secondary">Sugestão</p>
          <p className="mt-1 text-xs leading-relaxed text-tertiary">
            Alinhe com o time de risco e valide com dados históricos antes de compromissos comerciais.
          </p>
        </div>
      </div>
    </div>
  );
}
