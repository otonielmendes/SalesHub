"use client";

import { useEffect, useState } from "react";
import {
  BarChart01,
  CheckCircle,
  Clock,
  Edit01,
  Eye,
  Plus,
  SearchLg,
  Sliders02,
  Trash01,
  TrendUp01,
} from "@untitledui/icons";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { EmptyState } from "@/components/application/empty-states/empty-state";
import { LoadingIndicator } from "@/components/application/loading-indicators/loading-indicator";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { Assessment } from "@/lib/health-check/types";
import { getAllAssessments, deleteAssessment } from "@/lib/health-check/store";
import { formatDate, formatCurrency } from "@/lib/health-check/utils";

const VERTICALS = [
  "E-commerce",
  "Fintech",
  "Marketplace",
  "Delivery",
  "Digital Goods",
  "Travel",
  "Subscription",
];

export default function CalculadoraPage() {
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
    void load();
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

  const totalComplete = assessments.filter((a) => a.status === "complete").length;
  const totalDraft = assessments.filter((a) => a.status === "draft").length;

  const filterActive = search.length > 0 || verticalFilter !== "all";

  return (
    <div className="mx-auto max-w-[1400px] animate-in px-4 py-8 fade-in duration-500 sm:px-6 lg:px-8">
      <Breadcrumbs className="mb-6">
        <Breadcrumbs.Item href="/calculadora">Calculadora</Breadcrumbs.Item>
        <Breadcrumbs.Item>Histórico</Breadcrumbs.Item>
      </Breadcrumbs>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <h1 className="text-display-xs font-semibold tracking-tight text-primary md:text-2xl">Fraud Health Check</h1>
          <p className="text-sm text-tertiary">
            Diagnostique a saúde antifraude dos seus leads e projete o ganho financeiro com a Koin.
          </p>
        </div>
        <Button color="primary" size="md" href="/calculadora/new" iconLeading={Plus} className="shrink-0">
          Nova análise
        </Button>
      </div>

      {!isLoading && assessments.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { icon: BarChart01, color: "brand" as const, value: assessments.length, label: "Total assessments" },
            { icon: CheckCircle, color: "success" as const, value: totalComplete, label: "Completos" },
            { icon: Clock, color: "warning" as const, value: totalDraft, label: "Rascunhos" },
          ].map(({ icon: Icon, color, value, label }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-secondary bg-primary p-5 shadow-xs ring-1 ring-secondary ring-inset"
            >
              <FeaturedIcon icon={Icon} color={color} theme="modern" size="md" className="shrink-0" />
              <div>
                <p className="text-2xl font-semibold text-primary">{value}</p>
                <p className="text-xs font-medium text-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <Input
          icon={SearchLg}
          placeholder="Buscar por nome do merchant..."
          value={search}
          onChange={setSearch}
          className="flex-1"
        />
        <div className="relative w-full md:w-56">
          <Sliders02 className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-fg-quaternary" />
          <NativeSelect
            aria-label="Filtrar por vertical"
            className="pl-10"
            options={[
              { label: "Todas as verticais", value: "all" },
              ...VERTICALS.map((v) => ({ label: v, value: v })),
            ]}
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
          />
        </div>
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
                <Button color="primary" size="md" href="/calculadora/new" iconLeading={Plus}>
                  Criar assessment
                </Button>
              </EmptyState.Footer>
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="overflow-hidden overflow-x-auto rounded-xl border border-secondary bg-primary shadow-xs ring-1 ring-secondary ring-inset">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary bg-secondary">
                  <th className="px-4 py-3.5 text-left font-semibold text-secondary">Merchant</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-secondary">Vertical</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-secondary">Ticket médio</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-secondary">Status</th>
                  <th className="px-4 py-3.5 text-left font-semibold text-secondary">Atualizado em</th>
                  <th className="px-4 py-3.5 text-right font-semibold text-secondary">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {filtered.map((a) => (
                  <tr key={a.id} className="group transition-colors hover:bg-secondary">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary_alt">
                          <span className="text-sm font-bold text-brand-secondary">
                            {(a.merchant_name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-semibold text-primary transition-colors group-hover:text-brand-secondary">
                          {a.merchant_name || "Sem nome"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge type="pill-color" color="gray" size="sm">
                        {a.vertical}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 font-mono font-semibold text-secondary">{formatCurrency(a.ticket_medio)}</td>
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4 text-sm text-quaternary">{formatDate(a.updated_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {a.status === "complete" ? (
                          <Button color="tertiary" size="sm" href={`/calculadora/${a.id}`} iconLeading={Eye}>
                            Ver relatório
                          </Button>
                        ) : (
                          <Button color="tertiary" size="sm" href={`/calculadora/new?id=${a.id}`} iconLeading={Edit01}>
                            Continuar
                          </Button>
                        )}
                        <Button
                          color="tertiary"
                          size="sm"
                          className="text-quaternary hover:text-error-primary"
                          onClick={() => void handleDelete(a.id)}
                          iconLeading={Trash01}
                          aria-label="Eliminar"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-right text-xs text-quaternary">
            {filtered.length} {filtered.length === 1 ? "assessment" : "assessments"} encontrado
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}
