import Link from "next/link";
import { HomeLine } from "@untitledui/icons";
import { getTranslations } from "next-intl/server";
import { HistoricoEmptyState } from "@/components/backtest/HistoricoEmptyState";
import { HistoricoHeaderActions } from "@/components/backtest/HistoricoHeaderActions";
import { HistoricoTable, type BacktestRow } from "@/components/backtest/HistoricoTable";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function ConfigError() {
  const t = await getTranslations("backtests.historico");
  return (
    <div className="mx-auto max-w-container px-6 py-12 lg:px-8">
      <div className="rounded-xl border border-warning-200 bg-warning-50 p-6 text-center">
        <p className="text-sm font-semibold text-warning-900">{t("errors.configTitle")}</p>
        <p className="mt-1 text-sm text-warning-800">{t("errors.configDesc")}</p>
      </div>
    </div>
  );
}

export default async function HistoricoPage() {
  const t = await getTranslations("backtests.historico");

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
    queryError = e instanceof Error ? e.message : t("errors.unexpected");
  }

  if (queryError) {
    return (
      <div className="mx-auto max-w-container px-6 py-12 lg:px-8">
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center">
          <p className="text-sm font-semibold text-error-800">{t("errors.loadTitle")}</p>
          <p className="mt-1 text-sm text-error-600">{queryError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-6 py-8 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-3 text-sm text-[#475456]">
        <Link href="/backtests/testagens" className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]" aria-label={t("breadcrumbBacktests")}>
          <HomeLine className="h-5 w-5" />
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <Link href="/backtests/testagens" className="rounded-md px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
          {t("breadcrumbBacktests")}
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <span className="rounded-md px-2 py-1 font-semibold text-[#0C8525]">{t("breadcrumbHistorico")}</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
        <HistoricoHeaderActions label={t("buttonNew")} />
      </div>

      {!backtests || backtests.length === 0 ? (
        <HistoricoEmptyState />
      ) : (
        <HistoricoTable backtests={backtests} />
      )}
    </div>
  );
}
