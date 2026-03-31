"use client";

import { useEffect, useState } from "react";
import {
  Edit01,
  Plus,
  SearchLg,
  TrendUp01,
  Trash01,
} from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-states/empty-state";
import { LoadingIndicator } from "@/components/application/loading-indicators/loading-indicator";
import { DataTableToolbar } from "@/components/application/tables/data-table-toolbar";
import { TableCard } from "@/components/application/tables/table";
import { RowActionButton } from "@/components/application/tables/row-action-button";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
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

  const filtered = assessments.filter((a) => {
    const matchSearch = (a.merchant_name || "").toLowerCase().includes(search.toLowerCase());
    const matchVertical = verticalFilter === "all" || a.vertical === verticalFilter;
    return matchSearch && matchVertical;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este assessment?")) return;
    const ok = await deleteAssessment(id);
    if (ok) await load();
  };

  const filterActive = search.length > 0 || verticalFilter !== "all";

  return (
    <CalculadoraPageContainer className="animate-in pb-16 fade-in duration-500">
      <CalculadoraPageBreadcrumbs
        className="mb-10"
        items={[
          { label: "Calculadora", href: "/calculadora/historico" },
          { label: "Histórico", current: true },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-primary">
          Histórico de análises realizadas
        </h1>
        <Button color="primary" size="md" href="/calculadora/calculo" iconLeading={Plus} className="shrink-0">
          Novo Assessment
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-secondary bg-primary py-12 ring-1 ring-secondary ring-inset">
          <LoadingIndicator type="line-spinner" size="md" label="A carregar..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-xs ring-1 ring-secondary ring-inset md:p-12">
          <EmptyState size="lg" className="max-w-full">
            <EmptyState.Header pattern="none">
              <EmptyState.FeaturedIcon icon={TrendUp01} color="brand" theme="gradient" />
            </EmptyState.Header>
            <EmptyState.Content>
              <EmptyState.Title>
                {filterActive ? "Nenhum resultado encontrado" : "Sem assessments ainda"}
              </EmptyState.Title>
              <EmptyState.Description>
                {filterActive
                  ? "Tente ajustar a pesquisa ou o filtro de vertical."
                  : "Crie o seu primeiro assessment na Análise para começar."}
              </EmptyState.Description>
            </EmptyState.Content>
            {!filterActive && (
              <EmptyState.Footer className="w-full flex-col sm:w-auto sm:flex-row sm:justify-center">
                <Button color="primary" size="md" href="/calculadora/calculo" iconLeading={Plus}>
                  Criar assessment
                </Button>
              </EmptyState.Footer>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <TableCard.Root>
            <TableCard.Header
              title="Histórico de análises"
              badge={`${filtered.length} registros`}
            />
            <DataTableToolbar
              searchPlaceholder="Buscar por merchant..."
              searchValue={search}
              onSearchChange={setSearch}
              filterLabel="Filtrar por vertical"
              filterValue={verticalFilter}
              onFilterChange={setVerticalFilter}
              filterOptions={[
                { label: "Todas as verticais", value: "all" },
                ...VERTICALS.map((v) => ({ label: v, value: v })),
              ]}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary">
                  <tr className="border-b border-secondary">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      Merchant
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      Vertical
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      Ticket Médio
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-quaternary">
                      Atualizado em
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-quaternary">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="group border-b border-secondary transition-colors last:border-0 hover:bg-secondary"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                            <span className="text-sm font-bold text-secondary">
                              {(a.merchant_name || "?").slice(0, 1).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-semibold text-primary transition-colors group-hover:text-brand-secondary">
                            {a.merchant_name || "Sem nome"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge type="pill-color" color="brand" size="sm">
                          {a.vertical}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-secondary">
                        {formatCurrency(a.ticket_medio)}
                      </td>
                      <td className="px-6 py-4">
                        {a.status === "complete" ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-success-500" />
                            <span className="text-sm font-semibold text-success-700">Completo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-warning-500" />
                            <span className="text-sm font-semibold text-warning-700">Rascunho</span>
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
                              label="Ver relatório"
                            />
                          ) : (
                            <RowActionButton
                              href={`/calculadora/calculo?id=${a.id}`}
                              icon={Edit01}
                              label="Continuar"
                            />
                          )}
                          <RowActionButton
                            icon={Trash01}
                            label="Excluir"
                            variant="danger"
                            onClick={() => void handleDelete(a.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableCard.Root>
        </>
      )}
    </CalculadoraPageContainer>
  );
}
