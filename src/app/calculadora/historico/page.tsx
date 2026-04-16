"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Edit01,
  Plus,
  SearchLg,
  TrendUp01,
  Trash01,
} from "@untitledui/icons";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/application/empty-states/empty-state";
import { LoadingIndicator } from "@/components/application/loading-indicators/loading-indicator";
import { DataTableToolbar } from "@/components/application/tables/data-table-toolbar";
import { PaginationCardMinimal } from "@/components/application/pagination/pagination";
import { TableCard } from "@/components/application/tables/table";
import { RowActionButton } from "@/components/application/tables/row-action-button";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { usePagination } from "@/hooks/use-pagination";
import { Assessment } from "@/lib/health-check/types";
import { getAllAssessments, deleteAssessment } from "@/lib/health-check/store";
import { formatDate, formatCurrency } from "@/lib/health-check/utils";
import { CalculadoraPageBreadcrumbs, CalculadoraPageContainer } from "../_components/page-shell";

const VERTICALS = [
  "E-commerce",
  "Fintech",
  "Marketplace",
  "Delivery",
  "Digital Goods",
  "Travel",
  "Subscription",
];

export default function HistoricoPage() {
  const t = useTranslations("calculadora.historico");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [search, setSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    const data = await getAllAssessments();
    setAssessments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    let active = true;

    getAllAssessments().then((data) => {
      if (!active) return;
      setAssessments(data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => assessments.filter((a) => {
    const matchSearch = (a.merchant_name || "").toLowerCase().includes(search.toLowerCase());
    const matchVertical = verticalFilter === "all" || a.vertical === verticalFilter;
    return matchSearch && matchVertical;
  }), [assessments, search, verticalFilter]);
  const {
    page,
    setPage,
    totalPages,
    paginatedItems: paginatedAssessments,
  } = usePagination({
    items: filtered,
    pageSize: 10,
    resetPageKey: `${search}:${verticalFilter}:${assessments.length}`,
  });

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const ok = await deleteAssessment(id);
    if (ok) await load();
  };

  const filterActive = search.length > 0 || verticalFilter !== "all";

  return (
    <CalculadoraPageContainer className="animate-in pb-16 fade-in duration-500">
      <CalculadoraPageBreadcrumbs
        className="mb-10"
        items={[
          { label: t("breadcrumbCalculadora"), href: "/calculadora/historico" },
          { label: t("breadcrumbHistorico"), current: true },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-primary">
          {t("title")}
        </h1>
        <Button color="primary" size="md" href="/calculadora/calculo" iconLeading={Plus} className="shrink-0">
          {t("buttonNew")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-secondary bg-primary py-12 ring-1 ring-secondary ring-inset">
          <LoadingIndicator type="line-spinner" size="md" label={t("loading")} />
        </div>
      ) : (
        <TableCard.Root>
          <TableCard.Header
            title={t("tableTitle")}
            badge={t("tableRecords", { count: filtered.length })}
          />
          <DataTableToolbar
            searchPlaceholder={t("tableSearch")}
            searchValue={search}
            onSearchChange={setSearch}
            filterLabel={t("tableFilterLabel")}
            filterValue={verticalFilter}
            onFilterChange={setVerticalFilter}
            filterOptions={[
              { label: t("tableFilterAll"), value: "all" },
              ...VERTICALS.map((v) => ({ label: v, value: v })),
            ]}
          />
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center overflow-hidden px-8 py-20">
              <EmptyState size="sm">
                <EmptyState.Header pattern="none">
                  <EmptyState.FeaturedIcon icon={TrendUp01} color="brand" theme="gradient" />
                </EmptyState.Header>
                <EmptyState.Content>
                  <EmptyState.Title>
                    {filterActive ? t("emptyTitleFiltered") : t("emptyTitle")}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {filterActive ? t("emptyDescFiltered") : t("emptyDesc")}
                  </EmptyState.Description>
                </EmptyState.Content>
                {!filterActive && (
                  <EmptyState.Footer>
                    <Button color="primary" size="sm" href="/calculadora/calculo" iconLeading={Plus}>
                      {t("buttonCreate")}
                    </Button>
                  </EmptyState.Footer>
                )}
              </EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary">
                  <tr className="border-b border-secondary">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      {t("colMerchant")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      {t("colVertical")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      {t("colTicket")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      {t("colStatus")}
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      {t("colUpdated")}
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-quaternary">
                      {t("colActions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssessments.map((a) => (
                    <tr
                      key={a.id}
                      className="group border-b border-secondary transition-colors last:border-0 hover:bg-secondary"
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-primary transition-colors group-hover:text-brand-secondary">
                          {a.merchant_name || t("unnamed")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge type="pill-color" color="brand" size="sm">
                          {a.vertical}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-secondary">
                        {formatCurrency(a.ticket_medio, a.moeda)}
                      </td>
                      <td className="px-6 py-4">
                        {a.status === "complete" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-success-500" />
                            <span className="text-sm font-semibold text-success-700">{t("statusComplete")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-warning-500" />
                            <span className="text-sm font-semibold text-warning-700">{t("statusDraft")}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-quaternary">{formatDate(a.updated_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {a.status === "complete" ? (
                            <RowActionButton
                              href={`/calculadora/${a.id}`}
                              icon={SearchLg}
                              label={t("actionView")}
                            />
                          ) : (
                            <RowActionButton
                              href={`/calculadora/calculo?id=${a.id}`}
                              icon={Edit01}
                              label={t("actionContinue")}
                            />
                          )}
                          <RowActionButton
                            icon={Trash01}
                            label={t("actionDelete")}
                            variant="danger"
                            onClick={() => void handleDelete(a.id)}
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
      )}
    </CalculadoraPageContainer>
  );
}
