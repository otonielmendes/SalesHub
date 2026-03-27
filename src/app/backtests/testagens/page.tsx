import { UploadZone } from "@/components/backtest/UploadZone";

export const metadata = {
  title: "Testagens — Koin Sales Hub",
};

export default function TestagensPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-xs font-semibold text-primary">Testagens</h1>
        <p className="mt-1 text-md text-tertiary">
          Carregue um CSV de backtest para gerar o dashboard de performance antifraude.
        </p>
      </div>
      <UploadZone />
    </div>
  );
}
