"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { DataTableToolbar } from "@/components/application/tables/data-table-toolbar";
import { TableCard } from "@/components/application/table/table";
import { RowActionButton } from "@/components/application/tables/row-action-button";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { usePagination } from "@/hooks/use-pagination";
import type { BacktestMetrics } from "@/types/backtest";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";

export type BacktestRow = {
  id: string;
  prospect_name: string;
  filename: string;
  created_at: string;
  row_count: number | null;
  fraud_count: number | null;
  metrics_json: unknown;
};

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeMetrics(raw: unknown): BacktestMetrics | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as BacktestMetrics;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed))
        return parsed as BacktestMetrics;
    } catch {
      return null;
    }
  }
  return null;
}

function DetectionBadge({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1) + "%";
  if (rate > 0.8) return <span className="text-success-700 font-medium">{pct}</span>;
  if (rate > 0.5) return <span className="text-warning-700 font-medium">{pct}</span>;
  return <span className="text-error-700 font-medium">{pct}</span>;
}

interface Props {
  backtests: BacktestRow[];
}

const tableHeaderCellClass = "whitespace-nowrap px-6 py-3.5 text-left text-sm font-medium text-quaternary";
const tableHeaderCellRightClass = "whitespace-nowrap px-6 py-3.5 text-right text-sm font-medium text-quaternary";

export function HistoricoTable({ backtests }: Props) {
  const router = useRouter();
  const t = useTranslations("backtests.table");
  const tEmpty = useTranslations("backtests.empty");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rows, setRows] = useState<BacktestRow[]>(backtests);

  const locale = typeof document !== "undefined" ? document.documentElement.lang || "pt-BR" : "pt-BR";

  const filteredRows = useMemo(() => {
    return rows.filter((bt) => {
      const matchesSearch =
        bt.prospect_name.toLowerCase().includes(search.toLowerCase()) ||
        bt.filename.toLowerCase().includes(search.toLowerCase());

      const metrics = normalizeMetrics(bt.metrics_json);
      const detectionRate = metrics?.confusionMatrix?.detectionRate;
      const hasDetection = detectionRate != null;

      const matchesFilter =
        filter === "all" ||
        (filter === "with-detection" && hasDetection) ||
        (filter === "without-detection" && !hasDetection);

      return matchesSearch && matchesFilter;
    });
  }, [filter, rows, search]);
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedRows,
  } = usePagination({
    items: filteredRows,
    pageSize: 10,
    resetPageKey: `${search}:${filter}:${rows.length}`,
  });

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/backtest/save?id=${id}`, { method: "DELETE" });
      if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <TableCard.Root>
      <TableCard.Header
        title={t("title")}
        badge={t("records", { count: filteredRows.length })}
      />
      <DataTableToolbar
        searchPlaceholder={t("searchPlaceholder")}
        searchValue={search}
        onSearchChange={setSearch}
        filterLabel={t("filterLabel")}
        filterValue={filter}
        onFilterChange={setFilter}
        filterOptions={[
          { label: t("filterAll"), value: "all" },
          { label: t("filterWithDetection"), value: "with-detection" },
          { label: t("filterWithoutDetection"), value: "without-detection" },
        ]}
      />
      {filteredRows.length === 0 ? (
        <div className="flex items-center justify-center overflow-hidden px-8 py-20">
          <EmptyState size="sm">
            <EmptyState.Header pattern="none">
              <EmptyState.FeaturedIcon color="gray" theme="modern-neue" />
            </EmptyState.Header>
            <EmptyState.Content>
              <EmptyState.Title>{tEmpty("title")}</EmptyState.Title>
              <EmptyState.Description>{tEmpty("description")}</EmptyState.Description>
            </EmptyState.Content>
            <EmptyState.Footer>
              <Button size="sm" iconLeading={Plus} href="/backtests/new">
                {tEmpty("buttonNew")}
              </Button>
            </EmptyState.Footer>
          </EmptyState>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary">
              <tr className="border-b border-secondary">
                <th className={tableHeaderCellClass}>
                  {t("colProspect")}
                </th>
                <th className={tableHeaderCellClass}>
                  {t("colFile")}
                </th>
                <th className={tableHeaderCellRightClass}>
                  {t("colTransactions")}
                </th>
                <th className={tableHeaderCellRightClass}>
                  {t("colDetection")}
                </th>
                <th className={tableHeaderCellRightClass}>
                  {t("colRecoverable")}
                </th>
                <th className={tableHeaderCellRightClass}>
                  {t("colDate")}
                </th>
                <th className={tableHeaderCellRightClass}>
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((bt) => {
              const m = normalizeMetrics(bt.metrics_json);
              const detectionRate = m?.confusionMatrix?.detectionRate;
              const recoverable = m?.recoverableTransactions;
              const isDeleting = deletingId === bt.id;

              return (
                <tr
                  key={bt.id}
                  className="border-b border-secondary transition-colors last:border-0 hover:bg-secondary"
                >
                  <td className="px-6 py-4 font-medium text-primary">
                    {bt.prospect_name}
                  </td>
                  <td className="max-w-[240px] truncate px-6 py-4 text-tertiary">
                    {bt.filename}
                  </td>
                  <td className="px-6 py-4 text-right text-secondary">
                    {bt.row_count?.toLocaleString(locale) ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {detectionRate != null ? (
                      <DetectionBadge rate={Number(detectionRate)} />
                    ) : (
                      <span className="text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-secondary">
                    {recoverable != null ? recoverable.toLocaleString(locale) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right text-tertiary">
                    {formatDate(bt.created_at, locale)}
                  </td>
                  <td className="w-24 px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <RowActionButton
                        icon={SearchLg}
                        label={t("actionView")}
                        onClick={() => router.push(`/backtests/historico/${bt.id}`)}
                      />
                      <RowActionButton
                        icon={Trash01}
                        label={t("actionDelete")}
                        variant="danger"
                        disabled={isDeleting}
                        onClick={() => void handleDelete(bt.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
          <PaginationCardMinimal page={page} total={totalPages} align="right" onPageChange={setPage} />
        </div>
      )}
    </TableCard.Root>
  );
}
