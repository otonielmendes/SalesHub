import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";
import type { AiInsights, AiInsightItem } from "@/types/backtest";
import type { InsightsFetchState } from "@/components/backtest/BacktestDashboard";

interface InsightsTabProps {
  insights: AiInsights | null;
  fetchState: InsightsFetchState;
  errorMessage?: string | null;
}

function InsightCard({ insight }: { insight: AiInsightItem }) {
  const config = {
    critical: {
      border: "border-error-500",
      bg: "bg-error-50",
      dot: "bg-error-700",
      badgeColor: "error" as const,
      label: "Crítico",
    },
    moderate: {
      border: "border-warning-500",
      bg: "bg-warning-50",
      dot: "bg-warning-700",
      badgeColor: "warning" as const,
      label: "Moderado",
    },
    informative: {
      border: "border-gray-200",
      bg: "bg-white",
      dot: "bg-gray-400",
      badgeColor: "gray" as const,
      label: "Informativo",
    },
  }[insight.severity];

  return (
    <div
      className={cx(
        "rounded-r-xl border border-l-4 p-4",
        config.border,
        config.bg,
      )}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className={cx("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} />
          <span className="text-sm font-semibold text-primary">{insight.title}</span>
        </div>
        <Badge type="pill-color" color={config.badgeColor} size="sm">
          {config.label}
        </Badge>
      </div>
      <p className="ml-3.5 text-sm leading-relaxed text-secondary">{insight.description}</p>
    </div>
  );
}

export function InsightsTab({ insights, fetchState, errorMessage }: InsightsTabProps) {
  if (fetchState === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        <p className="text-sm text-tertiary">Gerando insights com IA…</p>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-5">
        <p className="text-sm font-semibold text-warning-900">Insights AI indisponíveis</p>
        <p className="mt-1 text-sm text-warning-800">
          {errorMessage ?? "Verifique GEMINI_API_KEY no servidor ou tente novamente mais tarde."}
        </p>
      </div>
    );
  }

  if (!insights || insights.insights.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-tertiary">
        {fetchState === "idle"
          ? "Insights não solicitados para este backtest."
          : "Nenhum insight retornado para este conjunto de métricas."}
      </div>
    );
  }

  const critical = insights.insights.filter((i) => i.severity === "critical");
  const moderate = insights.insights.filter((i) => i.severity === "moderate");
  const informative = insights.insights.filter((i) => i.severity === "informative");

  return (
    <div className="flex flex-col gap-4">
      {/* Diagnóstico header */}
      <div className="flex items-center gap-3 rounded-r-xl border border-l-4 border-brand-200 bg-primary p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-700">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">Diagnóstico do backtest</p>
          <p className="mt-0.5 text-xs text-tertiary">
            {critical.length > 0 && (
              <span className="font-medium text-error-800">{critical.length} crítico{critical.length !== 1 ? "s" : ""}</span>
            )}
            {critical.length > 0 && (moderate.length > 0 || informative.length > 0) && " · "}
            {moderate.length > 0 && (
              <span className="font-medium text-warning-800">{moderate.length} moderado{moderate.length !== 1 ? "s" : ""}</span>
            )}
            {moderate.length > 0 && informative.length > 0 && " · "}
            {informative.length > 0 && (
              <span>{informative.length} informativo{informative.length !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
      </div>

      {/* Insight cards */}
      {insights.insights.map((insight, i) => (
        <InsightCard key={i} insight={insight} />
      ))}

      {/* Disclaimer */}
      <div className="rounded-xl border border-dashed border-secondary bg-secondary_alt p-4">
        <div className="flex items-center gap-2 text-xs text-tertiary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
          Insights gerados a partir dos dados agregados do backtest. Não constituem recomendação definitiva. Validar com o time de modelos antes de implementar regras.
        </div>
      </div>
    </div>
  );
}
