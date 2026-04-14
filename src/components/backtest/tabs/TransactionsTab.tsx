"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { DataTableToolbar } from "@/components/application/tables/data-table-toolbar";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import type { BacktestTransactionRecord, CurrencyInfo } from "@/types/backtest";
import { DEFAULT_CURRENCY, formatFull } from "@/lib/csv/currency";
import { cx } from "@/utils/cx";
import { useLocale, useTranslations } from "next-intl";

interface TransactionsTabProps {
  backtestId?: string | null;
}

type LoadState = "idle" | "loading" | "ready" | "error";

function toCsv(rows: BacktestTransactionRecord[], t: ReturnType<typeof useTranslations>) {
  const header = [
    t("csvOrder"),
    t("csvDate"),
    t("csvAmount"),
    t("csvPaymentStatus"),
    t("csvFraud"),
    t("csvKoinDecision"),
    t("csvCategory"),
    t("csvBrand"),
    t("csvDocument"),
    t("csvEmail"),
    t("csvPhone"),
    t("csvBin"),
    t("csvDelivery"),
  ];

  const lines = rows.map((row) =>
    [
      row.orderId ?? "",
      row.date ?? "",
      row.amount ?? "",
      row.paymentStatus ?? "",
      row.fraud == null ? "" : row.fraud ? "Sim" : "Não",
      row.koinDecision ?? "",
      row.item ?? "",
      row.cardBrand ?? "",
      row.document ?? "",
      row.email ?? "",
      row.phone ?? "",
      row.bin ?? "",
      row.delivery ?? "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function TransactionsTableSkeleton({ label }: { label: string }) {
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label={label}>
      <table className="min-w-full text-sm">
        <thead className="bg-[#F9FAFB]">
          <tr className="border-b border-[#E4E7EC]">
            {Array.from({ length: 7 }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-3 w-20 animate-pulse rounded bg-[#E4E7EC]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]"}>
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <td key={colIndex} className="border-b border-[#E4E7EC] px-6 py-4">
                  <div
                    className={cx(
                      "h-4 animate-pulse rounded bg-[#E4E7EC]",
                      colIndex === 0 && "w-28",
                      colIndex === 1 && "w-16",
                      colIndex === 2 && "w-24",
                      colIndex === 3 && "w-28",
                      colIndex === 4 && "w-14",
                      colIndex === 5 && "w-20",
                      colIndex === 6 && "w-36",
                    )}
                  />
                  {(colIndex === 0 || colIndex === 6) && (
                    <div className="mt-2 h-3 w-20 animate-pulse rounded bg-[#F2F4F7]" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TransactionsTab({ backtestId }: TransactionsTabProps) {
  const t = useTranslations("backtests.transactions");
  const locale = useLocale();
  const [loadState, setLoadState] = useState<LoadState>(backtestId ? "idle" : "error");
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    backtestId ? null : t("errorNoCsv"),
  );
  const [rows, setRows] = useState<BacktestTransactionRecord[]>([]);
  const [currency, setCurrency] = useState<CurrencyInfo>(DEFAULT_CURRENCY);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!backtestId) return;

    let ignore = false;

    async function loadRows() {
      setIsFetching(true);
      setLoadState((current) => (current === "ready" ? "ready" : "loading"));
      setErrorMessage(null);
      try {
        const res = await fetch("/api/backtest/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: backtestId, page, pageSize, search, filter }),
        });

        const data = (await res.json()) as {
          error?: string;
          rows?: BacktestTransactionRecord[];
          currency?: CurrencyInfo;
          page?: number;
          totalRows?: number;
          totalFiltered?: number;
          totalPages?: number;
        };

        if (!res.ok) {
          if (!ignore) {
            setLoadState("error");
            setErrorMessage(data.error ?? t("errorHttp", { status: res.status }));
          }
          return;
        }

        if (!ignore) {
          setRows(data.rows ?? []);
          setCurrency(data.currency ?? DEFAULT_CURRENCY);
          setTotalRows(data.totalRows ?? 0);
          setTotalFiltered(data.totalFiltered ?? data.rows?.length ?? 0);
          setTotalPages(data.totalPages ?? 1);
          if (data.page && data.page !== page) setPage(data.page);
          setLoadState("ready");
        }
      } catch {
        if (!ignore) {
          setLoadState("error");
          setErrorMessage(t("errorLoad"));
        }
      } finally {
        if (!ignore) setIsFetching(false);
      }
    }

    void loadRows();
    return () => {
      ignore = true;
    };
  }, [backtestId, filter, page, pageSize, search, t]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1);
  };

  const formatAmount = (amount: number | null) => {
    if (amount == null) return "—";
    return formatFull(amount, currency);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white shadow-xs">
      <div className="flex flex-col gap-2 border-b border-[#E4E7EC] px-6 py-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#101828]">{t("title")}</h3>
          <p className="mt-1 text-sm text-[#667085]">
            {t("subtitle")}
          </p>
        </div>

        {rows.length > 0 && (
          <Button
            type="button"
            color="secondary"
            size="md"
            iconLeading={Download01}
            onClick={() => downloadCsv(t("downloadFilename"), toCsv(rows, t))}
          >
            {t("downloadPage")}
          </Button>
        )}
      </div>

      <DataTableToolbar
        searchPlaceholder={t("searchPlaceholder")}
        searchValue={search}
        onSearchChange={handleSearchChange}
        filterLabel={t("filterLabel")}
        filterValue={filter}
        onFilterChange={handleFilterChange}
        filterOptions={[
          { label: t("filterAll"), value: "all" },
          { label: t("filterFraud"), value: "fraud" },
          { label: t("filterClean"), value: "clean" },
          { label: t("filterKoinReject"), value: "koin-reject" },
          { label: t("filterApproved"), value: "approved" },
        ]}
      />

      <div className="flex items-center justify-between border-b border-[#E4E7EC] px-6 py-3 text-xs font-medium uppercase tracking-[0.08em] text-[#667085]">
        <span>{t("countFiltered", { count: totalFiltered.toLocaleString(locale) })}</span>
        <span>{t("countTotal", { count: totalRows.toLocaleString(locale) })}</span>
      </div>

      {loadState === "loading" && (
        <TransactionsTableSkeleton label={t("loading")} />
      )}

      {loadState === "error" && (
        <div className="m-6 flex items-start gap-3 rounded-xl border border-[#FDB022] bg-[#FFFAEB] px-4 py-4">
          <AlertCircle className="mt-0.5 size-5 text-[#B54708]" />
          <div>
            <p className="text-sm font-semibold text-[#7A2E0E]">{t("datasetUnavailable")}</p>
            <p className="mt-0.5 text-sm text-[#B54708]">{errorMessage}</p>
          </div>
        </div>
      )}

      {loadState === "ready" && (
        <div className="relative overflow-x-auto">
          {isFetching && (
            <div className="absolute inset-x-0 top-0 z-10 border-b border-[#D0D5DD] bg-white/85 px-6 py-2 text-xs font-medium text-[#667085] backdrop-blur-sm">
              {t("loading")}
            </div>
          )}
          <table className="min-w-full text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr className="border-b border-[#E4E7EC]">
                {[
                  t("tableOrder"),
                  t("tableBrand"),
                  t("tableValue"),
                  t("tableStatus"),
                  t("tableFraud"),
                  t("tableKoin"),
                  t("tableDocEmail"),
                ].map((label) => (
                  <th
                    key={label}
                    className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085]"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#667085]">
                    {t("noResults")}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]"}>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#101828]">
                      <div className="font-medium">{row.orderId ?? `#${row.id}`}</div>
                      <div className="mt-1 text-xs text-[#667085]">{row.date ?? t("noDate")}</div>
                    </td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#475467]">{row.cardBrand ?? "—"}</td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 font-medium text-[#101828]">{formatAmount(row.amount)}</td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#475467]">{row.paymentStatus ?? "—"}</td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          row.fraud === true
                            ? "bg-[#FEF3F2] text-[#B42318]"
                            : row.fraud === false
                              ? "bg-[#ECFDF3] text-[#027A48]"
                              : "bg-[#F2F4F7] text-[#475467]"
                        }`}
                      >
                        {row.fraud == null ? t("fraudNA") : row.fraud ? t("fraudYes") : t("fraudNo")}
                      </span>
                    </td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#475467]">{row.koinDecision ?? "—"}</td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#475467]">
                      <div>{row.document ?? "—"}</div>
                      <div className="mt-1 text-xs text-[#667085]">{row.email ?? t("noEmail")}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className={cx(isFetching && "pointer-events-none opacity-60")}>
            <PaginationCardMinimal page={page} total={totalPages} align="right" onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
