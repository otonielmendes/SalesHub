export const metadata = {
  title: "Histórico — Koin Sales Hub",
};

export default function HistoricoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-xs font-semibold text-primary">Histórico</h1>
        <p className="mt-1 text-md text-tertiary">
          Seus backtests salvos anteriormente.
        </p>
      </div>
      <div className="rounded-xl border border-secondary bg-primary p-8 text-center">
        <p className="text-md text-tertiary">Nenhum backtest salvo ainda.</p>
      </div>
    </div>
  );
}
