"use client";

import { AlertCircle, Info, ShieldAlert } from "lucide-react";

type Priority = "CRITICAL" | "WARNING" | "INFO";

const config: Record<Priority, { border: string; bg: string; iconColor: string; badge: string; badgeBg: string; Icon: React.ElementType }> = {
  CRITICAL: {
    border: "border-l-error-500",
    bg: "bg-error-50",
    iconColor: "text-error-500",
    badge: "CRÍTICO",
    badgeBg: "bg-error-100 text-error-700",
    Icon: ShieldAlert,
  },
  WARNING: {
    border: "border-l-warning-500",
    bg: "bg-warning-50",
    iconColor: "text-warning-500",
    badge: "ATENÇÃO",
    badgeBg: "bg-warning-100 text-warning-700",
    Icon: AlertCircle,
  },
  INFO: {
    border: "border-l-brand-500",
    bg: "bg-brand-50",
    iconColor: "text-brand-500",
    badge: "INFO",
    badgeBg: "bg-brand-100 text-brand-700",
    Icon: Info,
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
  const { border, bg, iconColor, badge, badgeBg, Icon } = config[priority];

  return (
    <div className={`rounded-xl border border-gray-200 border-l-4 ${border} ${bg} p-5 flex gap-4`}>
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeBg}`}>
            {badge}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            {category}
          </span>
          <span className="text-[10px] text-gray-300 ml-auto">{ruleId}</span>
        </div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}
