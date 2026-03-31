"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchLg, Trash01 } from "@untitledui/icons";
import { DataTableToolbar } from "@/components/application/tables/data-table-toolbar";
import { TableCard } from "@/components/application/table/table";
import { RowActionButton } from "@/components/application/tables/row-action-button";
import type { BacktestMetrics } from "@/types/backtest";

export type BacktestRow = {
  id: string;
  prospect_name: string;
  filename: string;
  created_at: string;
  row_count: number | null;
  fraud_count: number | null;
  metrics_json: unknown;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
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

export function HistoricoTable({ backtests }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rows, setRows] = useState<BacktestRow[]>(backtests);

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

  async function handleDelete(id: string) {
    if (!confirm("Excluir este backtest do histórico?")) return;
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
        title="Histórico de backtests"
        badge={`${filteredRows.length} registros`}
      />
      <DataTableToolbar
        searchPlaceholder="Buscar por prospect ou arquivo..."
        searchValue={search}
        onSearchChange={setSearch}
        filterLabel="Filtrar histórico"
        filterValue={filter}
        onFilterChange={setFilter}
        filterOptions={[
          { label: "Todos os backtests", value: "all" },
          { label: "Com detecção", value: "with-detection" },
          { label: "Sem detecção", value: "without-detection" },
        ]}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary">
            <tr className="border-b border-secondary">
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-quaternary">
                Prospect
              </th>
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-quaternary">
                Arquivo
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-quaternary">
                Transações
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-quaternary">
                Detecção
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-quaternary">
                Recuperável
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-quaternary">
                Data
              </th>
              <th className="px-6 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-quaternary">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((bt) => {
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
                  {bt.row_count?.toLocaleString("pt-BR") ?? "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  {detectionRate != null ? (
                    <DetectionBadge rate={Number(detectionRate)} />
                  ) : (
                    <span className="text-tertiary">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-secondary">
                  {recoverable != null ? recoverable.toLocaleString("pt-BR") : "—"}
                </td>
                <td className="px-6 py-4 text-right text-tertiary">
                  {formatDate(bt.created_at)}
                </td>
                <td className="w-24 px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <RowActionButton
                      icon={SearchLg}
                      label="Visualizar"
                      onClick={() => router.push(`/backtests/historico/${bt.id}`)}
                    />
                    <RowActionButton
                      icon={Trash01}
                      label="Excluir"
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
      </div>
    </TableCard.Root>
  );
}
