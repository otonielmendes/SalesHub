"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SearchLg } from "@untitledui/icons";
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredRows = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = (s.prospect_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "captured" && s.status === "captured") ||
        (filter === "pending" && s.status === "pending") ||
        (filter === "expired" && s.status === "expired");
      return matchesSearch && matchesFilter;
    });
  }, [sessions, search, filter]);

  const { page, setPage, totalPages, paginatedItems: paginatedRows } = usePagination({
    items: filteredRows,
    pageSize: 10,
    resetPageKey: `${search}:${filter}:${sessions.length}`,
  });

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
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-quaternary">
                  {t("colProspect")}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-quaternary">
                  {t("colStatus")}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-quaternary">
                  {t("colCreated")}
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.08em] text-quaternary">
                  {t("colExpires")}
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-[0.08em] text-quaternary">
                  {t("actionView")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((s) => (
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
                  <td className="px-6 py-4 text-tertiary">{formatDate(s.created_at)}</td>
                  <td className="px-6 py-4 text-tertiary">{formatDate(s.expires_at)}</td>
                  <td className="w-24 px-6 py-4">
                    <div className="flex items-center justify-end">
                      <RowActionButton
                        icon={SearchLg}
                        label={t("actionView")}
                        onClick={() => router.push(`/fingerprinting/${s.id}`)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationCardMinimal page={page} total={totalPages} align="right" onPageChange={setPage} />
        </div>
      )}
    </TableCard.Root>
  );
}
