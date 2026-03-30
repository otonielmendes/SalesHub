import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HistoricoDetailClient } from "./HistoricoDetailClient";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function normalizeJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as T;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
        return parsed as T;
    } catch {
      return null;
    }
  }
  return null;
}

export default async function HistoricoDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("backtests")
    .select("id, prospect_name, filename, metrics_json, ai_insights_json")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const metrics = normalizeJson<BacktestMetrics>(data.metrics_json);
  if (!metrics) notFound();

  const insights = normalizeJson<AiInsights>(data.ai_insights_json);

  return (
    <HistoricoDetailClient
      metrics={metrics}
      insights={insights}
      fileName={data.filename}
      savedId={data.id}
    />
  );
}
