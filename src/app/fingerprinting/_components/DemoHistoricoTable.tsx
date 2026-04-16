"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SearchLg, Trash01 } from "@untitledui/icons";
import { DataTableToolbar } from "@/components/application/tables/data-table-toolbar";
import { TableCard } from "@/components/application/table/table";
import { RowActionButton } from "@/components/application/tables/row-action-button";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { usePagination } from "@/hooks/use-pagination";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import type { DemoSession } from "@/types/demos";

type DemoRow = Pick<DemoSession, "id" | "prospect_name" | "status" | "created_at" | "expires_at">;

interface Props {
  sessions: DemoRow[];
}

const tableHeaderCellClass = "whitespace-nowrap px-6 py-3.5 text-left text-sm font-medium text-quaternary";
const tableHeaderCellRightClass = "whitespace-nowrap px-6 py-3.5 text-right text-sm font-medium text-quaternary";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusCell({ status }: { status: DemoSession["status"] }) {
  const tc = useTranslations("demos.common");
  if (status === "captured")
    return <span className="font-medium text-success-700">{tc("statusCaptured")}</span>;
  if (status === "expired")
    return <span className="font-medium text-tertiary">{tc("statusExpired")}</span>;
  return <span className="font-medium text-warning-700">{tc("statusPending")}</span>;
}

export function DemoHistoricoTable({ sessions }: Props) {
  const router = useRouter();
  const t = useTranslations("demos.historico");
  const tc = useTranslations("demos.common");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [rows, setRows] = useState<DemoRow[]>(sessions);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    return rows.filter((s) => {
      const matchesSearch = (s.prospect_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "captured" && s.status === "captured") ||
        (filter === "pending" && s.status === "pending") ||
        (filter === "expired" && s.status === "expired");
      return matchesSearch && matchesFilter;
    });
  }, [filter, rows, search]);

  const { page, setPage, totalPages, paginatedItems: paginatedRows } = usePagination({
    items: filteredRows,
    pageSize: 10,
    resetPageKey: `${search}:${filter}:${rows.length}`,
  });

  async function handleDelete(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/demo/session?id=${id}`, { method: "DELETE" });
      if (res.ok) setRows((prev) => prev.filter((row) => row.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <TableCard.Root>
      <TableCard.Header
        title={t("title")}
        badge={t("badgeCount", { count: filteredRows.length })}
      />
      <DataTableToolbar
        searchPlaceholder={t("colProspect")}
        searchValue={search}
        onSearchChange={setSearch}
        filterLabel={t("filterLabel")}
        filterValue={filter}
        onFilterChange={setFilter}
        filterOptions={[
          { label: t("filterAll"), value: "all" },
          { label: tc("statusCaptured"), value: "captured" },
          { label: tc("statusPending"), value: "pending" },
          { label: tc("statusExpired"), value: "expired" },
        ]}
      />

      {filteredRows.length === 0 ? (
        <div className="flex items-center justify-center overflow-hidden px-8 py-20">
          <EmptyState size="sm">
            <EmptyState.Header pattern="none">
              <EmptyState.FeaturedIcon color="gray" theme="modern-neue" />
            </EmptyState.Header>
            <EmptyState.Content>
              <EmptyState.Title>{t("empty")}</EmptyState.Title>
              <EmptyState.Description>{t("emptyDescription")}</EmptyState.Description>
            </EmptyState.Content>
            <EmptyState.Footer>
              <Button size="sm" href="/fingerprinting/new">
                + {t("buttonNew")}
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
                  {t("colStatus")}
                </th>
                <th className={tableHeaderCellClass}>
                  {t("colCreated")}
                </th>
                <th className={tableHeaderCellClass}>
                  {t("colExpires")}
                </th>
                <th className={tableHeaderCellRightClass}>
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((s) => {
                const isDeleting = deletingId === s.id;

                return (
                  <tr
                    key={s.id}
                    className="border-b border-secondary transition-colors last:border-0 hover:bg-secondary"
                  >
                    <td className="px-6 py-4 font-medium text-primary">
                      {s.prospect_name ?? <span className="text-tertiary">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusCell status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-tertiary">{formatDate(s.created_at, locale)}</td>
                    <td className="px-6 py-4 text-tertiary">{formatDate(s.expires_at, locale)}</td>
                    <td className="w-28 px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <RowActionButton
                          icon={SearchLg}
                          label={t("actionView")}
                          onClick={() => router.push(`/fingerprinting/${s.id}`)}
                        />
                        <RowActionButton
                          icon={Trash01}
                          label={t("actionDelete")}
                          variant="danger"
                          disabled={isDeleting}
                          onClick={() => void handleDelete(s.id)}
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
