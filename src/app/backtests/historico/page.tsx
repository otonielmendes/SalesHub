import { HistoricoEmptyState } from "@/components/backtest/HistoricoEmptyState";
import { createClient } from "@/lib/supabase/server";
import type { BacktestMetrics } from "@/types/backtest";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeMetricsJson(raw: unknown): BacktestMetrics | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as BacktestMetrics;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return parsed as BacktestMetrics;
      }
    } catch {
      return null;
    }
  }
  return null;
}

type BacktestRow = {
  id: string;
  prospect_name: string;
  filename: string;
  created_at: string;
  row_count: number | null;
  fraud_count: number | null;
  metrics_json: unknown;
};

function ConfigError() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-12">
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-6 text-center">
        <p className="text-sm font-semibold text-warning-900">Configuração incompleta</p>
        <p className="mt-1 text-sm text-warning-800">
          As variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY têm de estar definidas no
          ambiente.
        </p>
      </div>
    </div>
  );
}

export default async function HistoricoPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return <ConfigError />;
  }

  let backtests: BacktestRow[] | null = null;
  let queryError: string | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("backtests")
      .select("id, prospect_name, filename, created_at, row_count, fraud_count, metrics_json")
      .order("created_at", { ascending: false });

    if (error) {
      queryError = error.message;
    } else {
      backtests = (data ?? []) as BacktestRow[];
    }
  } catch (e) {
    queryError = e instanceof Error ? e.message : "Erro inesperado ao ligar ao Supabase.";
  }

  if (queryError) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center">
          <p className="text-sm font-semibold text-error-800">Erro ao carregar histórico</p>
          <p className="mt-1 text-sm text-error-600">{queryError}</p>
        </div>
      </div>
    );
  }

  if (!backtests || backtests.length === 0) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-display-xs font-semibold text-primary">Histórico</h1>
          <span className="text-sm text-tertiary">0 backtests</span>
        </div>
        <HistoricoEmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display-xs font-semibold text-primary">Histórico</h1>
        <span className="text-sm text-tertiary">{backtests.length} backtests</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary">
              <th className="px-5 py-3.5 text-left font-semibold text-quaternary">Prospect</th>
              <th className="px-5 py-3.5 text-left font-semibold text-quaternary">Arquivo</th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">Transações</th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">Detecção</th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">Recuperável</th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">Data</th>
            </tr>
          </thead>
          <tbody>
            {backtests.map((bt, i) => {
              const metrics = normalizeMetricsJson(bt.metrics_json);
              const detectionRate = metrics?.confusionMatrix?.detectionRate;
              const recoverable = metrics?.recoverableTransactions;
              return (
                <tr
                  key={bt.id}
                  className={
                    i % 2 !== 0
                      ? "border-b border-secondary last:border-0 bg-secondary_alt"
                      : "border-b border-secondary last:border-0"
                  }
                >
                  <td className="px-5 py-3.5 font-medium text-primary">{bt.prospect_name}</td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 text-tertiary">{bt.filename}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-secondary">
                    {bt.row_count?.toLocaleString("pt-BR") ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono">
                    {detectionRate !== undefined && detectionRate !== null ? (
                      <span
                        className={
                          detectionRate > 0.8
                            ? "text-success-800"
                            : detectionRate > 0.5
                              ? "text-warning-800"
                              : "text-error-800"
                        }
                      >
                        {(Number(detectionRate) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-secondary">
                    {recoverable !== undefined && recoverable !== null ? recoverable : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right text-tertiary">
                    {formatDate(bt.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
