"use client";

import { Download01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { BacktestMetrics, RiskEntry } from "@/types/backtest";

interface BlocklistExportTabProps {
  metrics: BacktestMetrics;
  prospectName: string;
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildDocumentsCsv(rows: RiskEntry[]): string {
  const header = "Documento,Fraudes,Total,Fraud Rate,Monto Fraude\n";
  const lines = rows
    .filter((r) => r.fraudCount > 0)
    .map((r) => {
      const amt = r.fraudAmount != null ? r.fraudAmount.toFixed(2) : "";
      return `${r.key},${r.fraudCount},${r.total},${(r.fraudRate * 100).toFixed(2)}%,${amt}`;
    })
    .join("\n");
  return header + lines;
}

function buildBinsCsv(rows: RiskEntry[]): string {
  const header = "BIN,Fraudes,Total,Fraud Rate,Monto Fraude\n";
  const lines = rows
    .map((r) => {
      const amt = r.fraudAmount != null ? r.fraudAmount.toFixed(2) : "";
      return `${r.key},${r.fraudCount},${r.total},${(r.fraudRate * 100).toFixed(2)}%,${amt}`;
    })
    .join("\n");
  return header + lines;
}

function buildEmailsCsv(rows: RiskEntry[]): string {
  const header = "Email,Fraudes,Total,Fraud Rate,Monto Fraude\n";
  const lines = rows
    .filter((r) => r.fraudCount > 0)
    .map((r) => {
      const amt = r.fraudAmount != null ? r.fraudAmount.toFixed(2) : "";
      return `${r.key},${r.fraudCount},${r.total},${(r.fraudRate * 100).toFixed(2)}%,${amt}`;
    })
    .join("\n");
  return header + lines;
}

function RecurrentTable({
  title,
  rows,
  emptyMessage,
  koinRecurrent,
}: {
  title: string;
  rows: RiskEntry[];
  emptyMessage?: string;
  /** Cruzamento PRD: fraudes que a Koin teria rejeitado (documentos com 2+ fraudes) */
  koinRecurrent?: { document: string; fraudEvents: number; koinRejected: number }[];
}) {
  const recurrents = rows.filter((r) => r.fraudCount >= 2);
  const koinMap = new Map((koinRecurrent ?? []).map((k) => [k.document, k]));

  return (
    <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
      <div className="border-b border-secondary px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-secondary">{title}</h3>
          <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-semibold text-error-800">
            {recurrents.length} identidades
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        {recurrents.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-tertiary">
            {emptyMessage ?? "Nenhuma identidade com fraude recorrente"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary">
                <th className="px-5 py-3 text-left font-semibold text-quaternary">
                  Identidade
                </th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">
                  Fraudes
                </th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">
                  Total Txns
                </th>
                <th className="px-5 py-3 text-right font-semibold text-quaternary">
                  Fraud Rate
                </th>
                {koinRecurrent && koinRecurrent.length > 0 && (
                  <th className="px-5 py-3 text-right font-semibold text-quaternary">
                    Koin detectó
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {recurrents.slice(0, 50).map((row, i) => {
                const k = koinMap.get(row.key);
                const fullDetect = k && k.koinRejected >= k.fraudEvents;
                const partial = k && k.koinRejected > 0 && !fullDetect;
                return (
                  <tr
                    key={row.key}
                    className={cx(
                      "border-b border-secondary last:border-0",
                      i % 2 !== 0 && "bg-secondary_alt",
                    )}
                  >
                    <td className="px-5 py-3 font-mono text-secondary">{row.key}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-error-800">
                      {row.fraudCount}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-secondary">
                      {row.total}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-error-800">
                      {(row.fraudRate * 100).toFixed(1)}%
                    </td>
                    {koinRecurrent && koinRecurrent.length > 0 && (
                      <td className="px-5 py-3 text-right">
                        {k ? (
                          <span
                            className={cx(
                              "inline-flex rounded-full px-2 py-0.5 font-mono text-xs font-semibold",
                              fullDetect && "bg-success-50 text-success-800",
                              partial && "bg-warning-50 text-warning-800",
                              !fullDetect && !partial && "bg-gray-100 text-gray-700",
                            )}
                          >
                            {k.koinRejected}/{row.fraudCount}
                          </span>
                        ) : (
                          <span className="text-quaternary">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function BlocklistExportTab({ metrics, prospectName }: BlocklistExportTabProps) {
  const hasDocuments = metrics.riskByDocument && metrics.riskByDocument.length > 0;
  const hasBins = metrics.riskByBin && metrics.riskByBin.length > 0;
  const hasEmails = metrics.riskByEmail && metrics.riskByEmail.length > 0;

  const safeProspect = prospectName.replace(/\s+/g, "_").toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      {/* Export Buttons */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-secondary">Exportar Blocklists</h2>
        <div className="flex flex-wrap gap-3">
          {hasDocuments && (
            <button
              onClick={() =>
                downloadCsv(
                  buildDocumentsCsv(metrics.riskByDocument!),
                  `${safeProspect}_documentos_fraude.csv`,
                )
              }
              className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary hover:text-primary"
            >
              <Download01 className="h-4 w-4" />
              Documentos con Fraude
            </button>
          )}
          {hasBins && (
            <button
              onClick={() =>
                downloadCsv(
                  buildBinsCsv(metrics.riskByBin!),
                  `${safeProspect}_bins_risco.csv`,
                )
              }
              className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary hover:text-primary"
            >
              <Download01 className="h-4 w-4" />
              BINs de Riesgo
            </button>
          )}
          {hasEmails && (
            <button
              onClick={() =>
                downloadCsv(
                  buildEmailsCsv(metrics.riskByEmail!),
                  `${safeProspect}_emails_fraude.csv`,
                )
              }
              className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary hover:text-primary"
            >
              <Download01 className="h-4 w-4" />
              Emails con Fraude
            </button>
          )}
          {!hasDocuments && !hasBins && !hasEmails && (
            <p className="text-sm text-tertiary">
              Nenhuma coluna de documento, BIN ou email detectada no CSV.
            </p>
          )}
        </div>
      </section>

      {/* Recurrent Identities */}
      {hasDocuments && (
        <RecurrentTable
          title="Identidades con Fraude Recurrente (2+ eventos)"
          rows={metrics.riskByDocument!}
          koinRecurrent={metrics.recurrentFraudKoin ?? undefined}
        />
      )}

      {/* Recurrent Emails */}
      {hasEmails && (
        <RecurrentTable
          title="Emails con Fraude Recurrente (2+ eventos)"
          rows={metrics.riskByEmail!}
        />
      )}

      {/* All Documents with Fraud */}
      {hasDocuments && (
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
          <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
            <h3 className="text-sm font-semibold text-secondary">
              Todos los Documentos con Fraude
            </h3>
            <span className="text-xs text-tertiary">
              Mostrando {Math.min(50, metrics.riskByDocument!.filter((r) => r.fraudCount > 0).length)} de{" "}
              {metrics.riskByDocument!.filter((r) => r.fraudCount > 0).length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary">
                  <th className="px-5 py-3 text-left font-semibold text-quaternary">
                    Documento
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-quaternary">
                    Eventos
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-quaternary">
                    Total Txns
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.riskByDocument!
                  .filter((r) => r.fraudCount > 0)
                  .slice(0, 50)
                  .map((row, i) => (
                    <tr
                      key={row.key}
                      className={cx(
                        "border-b border-secondary last:border-0",
                        i % 2 !== 0 && "bg-secondary_alt",
                      )}
                    >
                      <td className="px-5 py-3 font-mono text-secondary">{row.key}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-error-800">
                        {row.fraudCount}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-secondary">
                        {row.total}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
