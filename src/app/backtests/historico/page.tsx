import { HistoricoEmptyState } from "@/components/backtest/HistoricoEmptyState";
import { HistoricoTable, type BacktestRow } from "@/components/backtest/HistoricoTable";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function ConfigError() {
  return (
    <div className="mx-auto max-w-container px-6 py-12 lg:px-8">
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
      <div className="mx-auto max-w-container px-6 py-12 lg:px-8">
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center">
          <p className="text-sm font-semibold text-error-800">Erro ao carregar histórico</p>
          <p className="mt-1 text-sm text-error-600">{queryError}</p>
        </div>
      </div>
    );
  }

  if (!backtests || backtests.length === 0) {
    return (
      <div className="mx-auto max-w-container px-6 py-8 lg:px-8">
        <HistoricoEmptyState />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-6 py-8 lg:px-8">
      <HistoricoTable backtests={backtests} />
    </div>
  );
}
