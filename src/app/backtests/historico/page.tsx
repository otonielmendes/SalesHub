import { createClient } from "@/lib/supabase/server";
import type { Backtest } from "@/types/backtest";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function HistoricoPage() {
  const supabase = await createClient();

  const { data: backtests, error } = await supabase
    .from("backtests")
    .select("id, prospect_name, filename, created_at, row_count, fraud_count, metrics_json")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-12">
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center">
          <p className="text-sm font-semibold text-error-800">
            Erro ao carregar histórico
          </p>
          <p className="mt-1 text-sm text-error-600">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!backtests || backtests.length === 0) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-secondary bg-primary shadow-xs">
            <svg
              className="h-5 w-5 text-quaternary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-primary">Sem backtests salvos</h3>
          <p className="mt-1 text-sm text-tertiary">
            Carregue um CSV em Testagens e salve para aparecer aqui.
          </p>
          <a
            href="/backtests/testagens"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Ir para Testagens
          </a>
        </div>
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
              <th className="px-5 py-3.5 text-left font-semibold text-quaternary">
                Prospect
              </th>
              <th className="px-5 py-3.5 text-left font-semibold text-quaternary">
                Arquivo
              </th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">
                Transações
              </th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">
                Detecção
              </th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">
                Recuperável
              </th>
              <th className="px-5 py-3.5 text-right font-semibold text-quaternary">
                Data
              </th>
            </tr>
          </thead>
          <tbody>
            {(backtests as Backtest[]).map((bt, i) => {
              const detectionRate = bt.metrics_json?.confusionMatrix?.detectionRate;
              const recoverable = bt.metrics_json?.recoverableTransactions;
              return (
                <tr
                  key={bt.id}
                  className={
                    i % 2 !== 0
                      ? "border-b border-secondary last:border-0 bg-secondary_alt"
                      : "border-b border-secondary last:border-0"
                  }
                >
                  <td className="px-5 py-3.5 font-medium text-primary">
                    {bt.prospect_name}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 text-tertiary">
                    {bt.filename}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-secondary">
                    {bt.row_count?.toLocaleString("pt-BR") ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono">
                    {detectionRate !== undefined ? (
                      <span
                        className={
                          detectionRate > 0.8
                            ? "text-success-800"
                            : detectionRate > 0.5
                              ? "text-warning-800"
                              : "text-error-800"
                        }
                      >
                        {(detectionRate * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-secondary">
                    {recoverable !== undefined ? recoverable : "—"}
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
