"use client";

import { Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { usePagination } from "@/hooks/use-pagination";
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
  const header = "Documento,Fraudes,Total,Taxa de Fraude,Valor em Fraude\n";
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
  const header = "BIN,Fraudes,Total,Taxa de Fraude,Valor em Fraude\n";
  const lines = rows
    .map((r) => {
      const amt = r.fraudAmount != null ? r.fraudAmount.toFixed(2) : "";
      return `${r.key},${r.fraudCount},${r.total},${(r.fraudRate * 100).toFixed(2)}%,${amt}`;
    })
    .join("\n");
  return header + lines;
}

function buildEmailsCsv(rows: RiskEntry[]): string {
  const header = "Email,Fraudes,Total,Taxa de Fraude,Valor em Fraude\n";
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
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedRecurrents,
  } = usePagination({
    items: recurrents,
    pageSize: 10,
    resetPageKey: recurrents.length,
  });

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
                  Taxa de fraude
                </th>
                {koinRecurrent && koinRecurrent.length > 0 && (
                  <th className="px-5 py-3 text-right font-semibold text-quaternary">
                    Koin detectou
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedRecurrents.map((row, i) => {
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
      {recurrents.length > 0 && (
        <PaginationCardMinimal page={page} total={totalPages} align="right" onPageChange={setPage} />
      )}
    </div>
  );
}

export function BlocklistExportTab({ metrics, prospectName }: BlocklistExportTabProps) {
  const hasDocuments = metrics.riskByDocument && metrics.riskByDocument.length > 0;
  const hasBins = metrics.riskByBin && metrics.riskByBin.length > 0;
  const hasEmails = metrics.riskByEmail && metrics.riskByEmail.length > 0;
  const fraudDocuments = (metrics.riskByDocument ?? []).filter((r) => r.fraudCount > 0);
  const {
    page: documentsPage,
    setPage: setDocumentsPage,
    totalPages: documentsTotalPages,
    paginatedItems: paginatedFraudDocuments,
  } = usePagination({
    items: fraudDocuments,
    pageSize: 10,
    resetPageKey: fraudDocuments.length,
  });

  const safeProspect = prospectName.replace(/\s+/g, "_").toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      {/* Export Buttons */}
      <section>
        <h2 className="mb-4 text-sm font-semibold text-secondary">Exportar listas de bloqueio</h2>
        <div className="flex flex-wrap gap-3">
          {hasDocuments && (
            <Button
              onClick={() =>
                downloadCsv(
                  buildDocumentsCsv(metrics.riskByDocument!),
                  `${safeProspect}_documentos_fraude.csv`,
                )
              }
              color="secondary"
              size="md"
              iconLeading={Download01}
            >
              Documentos com fraude
            </Button>
          )}
          {hasBins && (
            <Button
              onClick={() =>
                downloadCsv(
                  buildBinsCsv(metrics.riskByBin!),
                  `${safeProspect}_bins_risco.csv`,
                )
              }
              color="secondary"
              size="md"
              iconLeading={Download01}
            >
              BINs de risco
            </Button>
          )}
          {hasEmails && (
            <Button
              onClick={() =>
                downloadCsv(
                  buildEmailsCsv(metrics.riskByEmail!),
                  `${safeProspect}_emails_fraude.csv`,
                )
              }
              color="secondary"
              size="md"
              iconLeading={Download01}
            >
              Emails com fraude
            </Button>
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
          title="Identidades com fraude recorrente (2+ eventos)"
          rows={metrics.riskByDocument!}
          koinRecurrent={metrics.recurrentFraudKoin ?? undefined}
        />
      )}

      {/* Recurrent Emails */}
      {hasEmails && (
        <RecurrentTable
          title="Emails com fraude recorrente (2+ eventos)"
          rows={metrics.riskByEmail!}
        />
      )}

      {/* All Documents with Fraud */}
      {hasDocuments && (
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary">
          <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
            <h3 className="text-sm font-semibold text-secondary">
              Todos os documentos com fraude
            </h3>
            <span className="text-xs text-tertiary">
              Mostrando {paginatedFraudDocuments.length} de {fraudDocuments.length}
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
                {paginatedFraudDocuments
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
          <PaginationCardMinimal
            page={documentsPage}
            total={documentsTotalPages}
            align="right"
            onPageChange={setDocumentsPage}
          />
        </div>
      )}
    </div>
  );
}
