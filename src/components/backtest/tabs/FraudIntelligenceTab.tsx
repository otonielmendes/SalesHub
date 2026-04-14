"use client";

import type { ReactNode } from "react";
import { Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { DEFAULT_CURRENCY, formatFull } from "@/lib/csv/currency";
import { usePagination } from "@/hooks/use-pagination";
import type { BacktestMetrics, DistributionEntry, RiskEntry, VelocityEntry } from "@/types/backtest";
import { cx } from "@/utils/cx";
import { useLocale, useTranslations } from "next-intl";

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
  paginated = false,
  pageSize = 10,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  paginated?: boolean;
  pageSize?: number;
}) {
  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
  } = usePagination({
    items: rows,
    pageSize,
    resetPageKey: rows.length,
  });
  const visibleRows = paginated ? paginatedItems : rows;

  return (
    <>
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
            {visibleRows.map((row, index) => (
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
      {paginated && <PaginationCardMinimal page={page} total={totalPages} align="right" onPageChange={setPage} />}
    </>
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
  const t = useTranslations("backtests.fraud");
  const locale = useLocale();
  const previewRows = rows.slice(0, previewCount);
  const canExport = !!exportFilename && !!exportHeaders && !!exportRow && rows.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white shadow-xs">
      <div className="flex flex-col gap-3 border-b border-[#E4E7EC] px-5 py-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#101828]">{title}</h3>
            <span className="rounded-full bg-[#F2F4F7] px-2.5 py-1 text-xs font-semibold text-[#475467]">
              {rows.length.toLocaleString(locale)}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#667085]">{subtitle}</p>
        </div>

        {rows.length > 0 && (
          <DialogTrigger>
            <Button type="button" color="secondary" size="sm">
              {t("viewAll")}
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
                            {t("downloadCsv")}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[65vh] overflow-auto">
                      <SimpleTable rows={rows} columns={columns} paginated pageSize={20} />
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
  const t = useTranslations("backtests.fraud");
  const locale = useLocale();
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
  const brandMix = metrics.cardBrandFraudDistribution ?? [];
  const safeProspect = prospectName.replace(/\s+/g, "_").toLowerCase();

  const riskColumns: TableColumn<RiskEntry>[] = [
    { label: t("colKey"), render: (row) => <span className="font-medium text-[#101828]">{row.key}</span> },
    { label: t("colTxns"), align: "right", render: (row) => row.total.toLocaleString(locale) },
    { label: t("colFrauds"), align: "right", render: (row) => <span className="font-semibold text-[#B42318]">{row.fraudCount.toLocaleString(locale)}</span> },
    { label: t("colRate"), align: "right", render: (row) => `${(row.fraudRate * 100).toFixed(2)}%` },
    {
      label: t("colValue"),
      align: "right",
      render: (row) => (row.fraudAmount != null && row.fraudAmount > 0 ? formatMoney(row.fraudAmount) : "—"),
    },
  ];

  const velocityColumns: TableColumn<VelocityEntry>[] = [
    { label: t("colDocument"), render: (row) => <span className="font-medium text-[#101828]">{row.document}</span> },
    { label: t("colTxns"), align: "right", render: (row) => row.total.toLocaleString(locale) },
    { label: t("colFrauds"), align: "right", render: (row) => <span className="font-semibold text-[#B42318]">{row.fraudCount.toLocaleString(locale)}</span> },
    { label: t("colKoinRejected"), align: "right", render: (row) => row.koinRejectCount.toLocaleString(locale) },
    { label: t("colVolume"), align: "right", render: (row) => (row.volume != null ? formatMoney(row.volume) : "—") },
  ];

  const brandColumns: TableColumn<DistributionEntry>[] = [
    { label: t("colBrand"), render: (row) => <span className="font-medium text-[#101828]">{row.key}</span> },
    { label: t("colFrauds"), align: "right", render: (row) => row.count.toLocaleString(locale) },
    { label: t("colParticipation"), align: "right", render: (row) => `${(row.pct * 100).toFixed(1)}%` },
  ];

  const sectionCards = [
    allow("riskByItem") && (
      <PreviewTableCard
        key="risk-by-item"
        title={t("categoriesTitle")}
        subtitle={t("categoriesSubtitle")}
        rows={topCategories}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: t("colCategory") } : column))}
        emptyMessage={t("categoriesEmpty")}
        exportFilename={`${safeProspect}_categorias_risco.csv`}
        exportHeaders={[t("colCategory"), t("colTxns"), t("colFrauds"), t("colRate"), t("colValue")]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByBin") && (
      <PreviewTableCard
        key="risk-by-bin"
        title={t("binsTitle")}
        subtitle={t("binsSubtitle")}
        rows={topBins}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: t("colBin") } : column))}
        emptyMessage={t("binsEmpty")}
        exportFilename={`${safeProspect}_bins_risco.csv`}
        exportHeaders={[t("colBin"), t("colTxns"), t("colFrauds"), t("colRate"), t("colValue")]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByEmailDomain") && (
      <PreviewTableCard
        key="risk-by-domain"
        title={t("domainsTitle")}
        subtitle={t("domainsSubtitle")}
        rows={topDomains}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: t("colDomain") } : column))}
        emptyMessage={t("domainsEmpty")}
        exportFilename={`${safeProspect}_dominios_fraude.csv`}
        exportHeaders={[t("colDomain"), t("colTxns"), t("colFrauds"), t("colRate"), t("colValue")]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByDocument") && (
      <PreviewTableCard
        key="risk-by-document"
        title={t("documentsTitle")}
        subtitle={t("documentsSubtitle")}
        rows={recurringDocuments}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: t("colDocument") } : column))}
        emptyMessage={t("documentsEmpty")}
        exportFilename={`${safeProspect}_documentos_recorrentes.csv`}
        exportHeaders={[t("colDocument"), t("colTxns"), t("colFrauds"), t("colRate"), t("colValue")]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("riskByEmail") && (
      <PreviewTableCard
        key="risk-by-email"
        title={t("emailsTitle")}
        subtitle={t("emailsSubtitle")}
        rows={recurringEmails}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: t("colEmail") } : column))}
        emptyMessage={t("emailsEmpty")}
        exportFilename={`${safeProspect}_emails_recorrentes.csv`}
        exportHeaders={[t("colEmail"), t("colTxns"), t("colFrauds"), t("colRate"), t("colValue")]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("highVelocity") && (
      <PreviewTableCard
        key="high-velocity"
        title={t("highVelocityTitle")}
        subtitle={t("highVelocitySubtitle")}
        rows={highVelocity}
        columns={velocityColumns}
        emptyMessage={t("highVelocityEmpty")}
        exportFilename={`${safeProspect}_alta_velocidade.csv`}
        exportHeaders={[t("colDocument"), t("colTxns"), t("colFrauds"), t("colKoinRejected"), t("colVolume")]}
        exportRow={(row) => [row.document, String(row.total), String(row.fraudCount), String(row.koinRejectCount), row.volume != null ? String(row.volume) : ""]}
      />
    ),
    allow("riskByPhone") && (
      <PreviewTableCard
        key="risk-by-phone"
        title={t("phoneTitle")}
        subtitle={t("phoneSubtitle")}
        rows={topPhones}
        columns={riskColumns.map((column, index) => (index === 0 ? { ...column, label: t("colPhoneCode") } : column))}
        emptyMessage={t("phoneEmpty")}
        exportFilename={`${safeProspect}_codigos_risco.csv`}
        exportHeaders={[t("colPhoneCode"), t("colTxns"), t("colFrauds"), t("colRate"), t("colValue")]}
        exportRow={(row) => [row.key, String(row.total), String(row.fraudCount), `${(row.fraudRate * 100).toFixed(2)}%`, row.fraudAmount != null ? String(row.fraudAmount) : ""]}
      />
    ),
    allow("cardBrand") && (
      <PreviewTableCard
        key="card-brand"
        title={t("brandTitle")}
        subtitle={t("brandSubtitle")}
        rows={brandMix}
        columns={brandColumns}
        emptyMessage={t("brandEmpty")}
        exportFilename={`${safeProspect}_fraudes_por_bandeira.csv`}
        exportHeaders={[t("colBrand"), t("colFrauds"), t("colParticipation")]}
        exportRow={(row) => [row.key, String(row.count), `${(row.pct * 100).toFixed(1)}%`]}
      />
    ),
  ].filter(Boolean);

  if (sectionCards.length === 0) {
    return <div className="py-16 text-center text-sm text-tertiary">{t("noData")}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[#D0D5DD] bg-white p-5 shadow-xs">
        <h2 className="text-lg font-semibold text-[#101828]">{t("title")}</h2>
        <p className="mt-1 text-sm text-[#667085]">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sectionCards}
      </div>
    </div>
  );
}
