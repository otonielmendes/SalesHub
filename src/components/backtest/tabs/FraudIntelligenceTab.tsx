"use client";

import type { ReactNode } from "react";
import { Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { DEFAULT_CURRENCY, formatFull } from "@/lib/csv/currency";
import type { BacktestMetrics, DistributionEntry, RiskEntry, VelocityEntry } from "@/types/backtest";
import { cx } from "@/utils/cx";

interface FraudIntelligenceTabProps {
  metrics: BacktestMetrics;
  prospectName: string;
}

interface TableColumn<T> {
  label: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
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

function toCsv<T>(rows: T[], headers: string[], serialize: (row: T) => string[]) {
  return [headers.join(","), ...rows.map((row) => serialize(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))].join("\n");
}

function SimpleTable<T>({
  rows,
  columns,
}: {
  rows: T[];
  columns: TableColumn<T>[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#F9FAFB]">
          <tr className="border-b border-[#E4E7EC]">
            {columns.map((column) => (
              <th
                key={column.label}
                className={cx(
                  "px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085]",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]"}>
              {columns.map((column) => (
                <td
                  key={column.label}
                  className={cx(
                    "border-b border-[#E4E7EC] px-5 py-3 text-[#475467]",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewTableCard<T>({
  title,
  subtitle,
  rows,
  columns,
  emptyMessage,
  previewCount = 5,
  exportFilename,
  exportHeaders,
  exportRow,
}: {
  title: string;
  subtitle: string;
  rows: T[];
  columns: TableColumn<T>[];
  emptyMessage: string;
  previewCount?: number;
  exportFilename?: string;
  exportHeaders?: string[];
  exportRow?: (row: T) => string[];
}) {
  const previewRows = rows.slice(0, previewCount);
  const canExport = !!exportFilename && !!exportHeaders && !!exportRow && rows.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white shadow-xs">
      <div className="flex flex-col gap-3 border-b border-[#E4E7EC] px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#101828]">{title}</h3>
            <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-xs font-semibold text-[#475467]">
              {rows.length.toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#667085]">{subtitle}</p>
        </div>

        {rows.length > 0 && (
          <DialogTrigger>
            <Button type="button" color="secondary" size="sm">
              Ver todos
            </Button>
            <ModalOverlay isDismissable>
              <Modal className="w-full max-w-6xl">
                <Dialog className="mx-auto w-full">
                  <div className="max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-[#D0D5DD]">
                    <div className="flex flex-col gap-3 border-b border-[#E4E7EC] px-6 py-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#101828]">{title}</h3>
                        <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {canExport && (
                          <Button
                            type="button"
                            color="secondary"
                            size="md"
                            iconLeading={Download01}
                            onClick={() => downloadCsv(toCsv(rows, exportHeaders!, exportRow!), exportFilename!)}
                          >
                            Baixar CSV
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[65vh] overflow-auto">
                      <SimpleTable rows={rows} columns={columns} />
                    </div>
                  </div>
                </Dialog>
              </Modal>
            </ModalOverlay>
          </DialogTrigger>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[#667085]">{emptyMessage}</div>
      ) : (
        <SimpleTable rows={previewRows} columns={columns} />
      )}
    </div>
  );
}

export function FraudIntelligenceTab({ metrics, prospectName }: FraudIntelligenceTabProps) {
  const currency = metrics.currency ?? DEFAULT_CURRENCY;
  const formatMoney = (n: number) => formatFull(n, currency);
  const c = metrics.capabilities;
  const allow = (key: keyof NonNullable<typeof c>) => (c ? c[key] : true);

  const recurringDocuments = (metrics.riskByDocument ?? []).filter((row) => row.fraudCount >= 2);
  const recurringEmails = (metrics.riskByEmail ?? []).filter((row) => row.fraudCount >= 2);
  const topCategories = metrics.riskByItem ?? [];
  const topBins = metrics.riskByBin ?? [];
  const topDomains = metrics.riskByEmailDomain ?? [];
  const topPhones = metrics.riskByPhone ?? [];
  const highVelocity = metrics.highVelocityDocuments ?? [];
  const brandMix = metrics.cardBrandDistribution ?? [];
  const safeProspect = prospectName.replace(/\s+/g, "_").toLowerCase();

  const riskColumns: TableColumn<RiskEntry>[] = [
    { label: "Chave", render: (row) => <span className="font-medium text-[#101828]">{row.key}</span> },
    { label: "Txns", align: "right", render: (row) => row.total.toLocaleString("pt-BR") },
    { label: "Fraudes", align: "right", render: (row) => <span className="font-semibold text-[#B42318]">{row.fraudCount.toLocaleString("pt-BR")}</span> },
    { label: "Taxa", align: "right", render: (row) => `${(row.fraudRate * 100).toFixed(2)}%` },
    {
      label: "Valor",
      align: "right",
      render: (row) => (row.fraudAmount != null && row.fraudAmount > 0 ? formatMoney(row.fraudAmount) : "—"),
    },
  ];

  const velocityColumns: TableColumn<VelocityEntry>[] = [
    { label: "Documento", render: (row) => <span className="font-medium text-[#101828]">{row.document}</span> },
    { label: "Txns", align: "right", render: (row) => row.total.toLocaleString("pt-BR") },
    { label: "Fraudes", align: "right", render: (row) => <span className="font-semibold text-[#B42318]">{row.fraudCount.toLocaleString("pt-BR")}</span> },
    { label: "Koin rejeitou", align: "right", render: (row) => row.koinRejectCount.toLocaleString("pt-BR") },
    { label: "Volume", align: "right", render: (row) => (row.volume != null ? formatMoney(row.volume) : "—") },
  ];

  const brandColumns: TableColumn<DistributionEntry>[] = [
    { label: "Bandeira", render: (row) => <span className="font-medium text-[#101828]">{row.key}</span> },
    { label: "Transações", align: "right", render: (row) => row.count.toLocaleString("pt-BR") },
    { label: "Participação", align: "right", render: (row) => `${(row.pct * 100).toFixed(1)}%` },
  ];

  const sectionCards = [
    allow("riskByItem") && (
      <PreviewTableCard
        key="risk-by-item"
        title="Categorias de maior risco"
        subtitle="Onde há maior concentração de fraude por categoria ou item."
        rows={topCategories}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: "Categoria" } : column))}
        emptyMessage="Nenhuma categoria com fraude registrada."
        exportFilename={`${safeProspect}_categorias_risco.csv`}
        exportHeaders={["Categoria", "Txns", "Fraudes", "Taxa", "Valor"]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByBin") && (
      <PreviewTableCard
        key="risk-by-bin"
        title="BINs de alto risco"
        subtitle="BINs com maior incidência de fraude e impacto financeiro."
        rows={topBins}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: "BIN" } : column))}
        emptyMessage="Nenhum BIN relevante encontrado."
        exportFilename={`${safeProspect}_bins_risco.csv`}
        exportHeaders={["BIN", "Txns", "Fraudes", "Taxa", "Valor"]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByEmailDomain") && (
      <PreviewTableCard
        key="risk-by-domain"
        title="Domínios de email com fraude"
        subtitle="Domínios mais associados a eventos fraudulentos."
        rows={topDomains}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: "Domínio" } : column))}
        emptyMessage="Nenhum domínio com fraude identificado."
        exportFilename={`${safeProspect}_dominios_fraude.csv`}
        exportHeaders={["Domínio", "Txns", "Fraudes", "Taxa", "Valor"]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByDocument") && (
      <PreviewTableCard
        key="risk-by-document"
        title="Identidades com fraude recorrente"
        subtitle="Documentos com 2+ eventos de fraude, úteis para bloqueio direto."
        rows={recurringDocuments}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: "Documento" } : column))}
        emptyMessage="Nenhuma identidade recorrente encontrada."
        exportFilename={`${safeProspect}_documentos_recorrentes.csv`}
        exportHeaders={["Documento", "Txns", "Fraudes", "Taxa", "Valor"]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByEmail") && (
      <PreviewTableCard
        key="risk-by-email"
        title="Emails com fraude recorrente"
        subtitle="Emails reincidentes que podem virar regras de bloqueio ou monitoramento."
        rows={recurringEmails}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: "Email" } : column))}
        emptyMessage="Nenhum email recorrente encontrado."
        exportFilename={`${safeProspect}_emails_recorrentes.csv`}
        exportHeaders={["Email", "Txns", "Fraudes", "Taxa", "Valor"]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("highVelocity") && (
      <PreviewTableCard
        key="high-velocity"
        title="Identidades de alta velocidade"
        subtitle="Documentos com 10+ transações e comportamento de risco acelerado."
        rows={highVelocity}
        columns={velocityColumns}
        emptyMessage="Nenhum documento com alta velocidade."
        exportFilename={`${safeProspect}_alta_velocidade.csv`}
        exportHeaders={["Documento", "Txns", "Fraudes", "Koin rejeitou", "Volume"]}
        exportRow={(row) => [row.document, String(row.total), String(row.fraudCount), String(row.koinRejectCount), row.volume != null ? String(row.volume) : ""]}
      />
    ),
    allow("riskByPhone") && (
      <PreviewTableCard
        key="risk-by-phone"
        title="Códigos de área com fraude"
        subtitle="Origens telefônicas mais expostas a risco no dataset."
        rows={topPhones}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: "DDD / Código" } : column))}
        emptyMessage="Nenhum código de área relevante."
        exportFilename={`${safeProspect}_codigos_risco.csv`}
        exportHeaders={["DDD / Código", "Txns", "Fraudes", "Taxa", "Valor"]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("cardBrand") && (
      <PreviewTableCard
        key="card-brand"
        title="Distribuição por marca de cartão"
        subtitle="Concentração do volume transacional por bandeira identificada."
        rows={brandMix}
        columns={brandColumns}
        emptyMessage="Nenhuma bandeira identificada no CSV."
        exportFilename={`${safeProspect}_distribuicao_bandeiras.csv`}
        exportHeaders={["Bandeira", "Transações", "Participação"]}
        exportRow={(row) => [row.key, String(row.count), `${(row.pct * 100).toFixed(1)}%`]}
      />
    ),
  ].filter(Boolean);

  if (sectionCards.length === 0) {
    return <div className="py-16 text-center text-sm text-tertiary">Colunas insuficientes para gerar inteligência de fraude.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[#D0D5DD] bg-white p-5 shadow-xs">
        <h2 className="text-lg font-semibold text-[#101828]">Inteligência operacional</h2>
        <p className="mt-1 text-sm text-[#667085]">
          Consolidamos aqui os sinais mais acionáveis do CSV: padrões de fraude, blocos recorrentes, velocidade e concentração por bandeira.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sectionCards}
      </div>
    </div>
  );
}
