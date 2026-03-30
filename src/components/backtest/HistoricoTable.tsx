"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart01, Trash01 } from "@untitledui/icons";
import { Table, TableCard } from "@/components/application/table/table";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rows, setRows] = useState<BacktestRow[]>(backtests);

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
        title="Histórico"
        badge={`${rows.length} backtests`}
      />
      <Table aria-label="Histórico de backtests" selectionMode="none">
        <Table.Header>
          <Table.Head label="Prospect" isRowHeader />
          <Table.Head label="Arquivo" />
          <Table.Head label="Transações" className="text-right [&>div]:justify-end" />
          <Table.Head label="Detecção" className="text-right [&>div]:justify-end" />
          <Table.Head label="Recuperável" className="text-right [&>div]:justify-end" />
          <Table.Head label="Data" className="text-right [&>div]:justify-end" />
          <Table.Head />
        </Table.Header>
        <Table.Body>
          {rows.map((bt) => {
            const m = normalizeMetrics(bt.metrics_json);
            const detectionRate = m?.confusionMatrix?.detectionRate;
            const recoverable = m?.recoverableTransactions;
            const isDeleting = deletingId === bt.id;

            return (
              <Table.Row key={bt.id} id={bt.id}>
                <Table.Cell className="font-medium text-primary">
                  {bt.prospect_name}
                </Table.Cell>
                <Table.Cell className="max-w-[200px] truncate text-tertiary">
                  {bt.filename}
                </Table.Cell>
                <Table.Cell className="text-right text-secondary">
                  {bt.row_count?.toLocaleString("pt-BR") ?? "—"}
                </Table.Cell>
                <Table.Cell className="text-right">
                  {detectionRate != null ? (
                    <DetectionBadge rate={Number(detectionRate)} />
                  ) : (
                    <span className="text-tertiary">—</span>
                  )}
                </Table.Cell>
                <Table.Cell className="text-right text-secondary">
                  {recoverable != null ? recoverable.toLocaleString("pt-BR") : "—"}
                </Table.Cell>
                <Table.Cell className="text-right text-tertiary">
                  {formatDate(bt.created_at)}
                </Table.Cell>
                <Table.Cell className="w-20">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Visualizar"
                      onClick={() => router.push(`/backtests/historico/${bt.id}`)}
                      className="rounded-md p-1.5 text-quaternary transition-colors hover:bg-secondary hover:text-secondary"
                    >
                      <BarChart01 className="size-4" />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      disabled={isDeleting}
                      onClick={() => handleDelete(bt.id)}
                      className="rounded-md p-1.5 text-quaternary transition-colors hover:bg-error-50 hover:text-error-600 disabled:opacity-40"
                    >
                      <Trash01 className="size-4" />
                    </button>
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </TableCard.Root>
  );
}
