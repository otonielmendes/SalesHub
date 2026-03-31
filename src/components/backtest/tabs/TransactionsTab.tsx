"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { DataTableToolbar } from "@/components/application/tables/data-table-toolbar";
import type { BacktestTransactionRecord, CurrencyInfo } from "@/types/backtest";
import { DEFAULT_CURRENCY, formatFull } from "@/lib/csv/currency";

interface TransactionsTabProps {
  backtestId?: string | null;
}

type LoadState = "idle" | "loading" | "ready" | "error";

function toCsv(rows: BacktestTransactionRecord[]) {
  const header = [
    "Pedido",
    "Data",
    "Valor",
    "Status pagamento",
    "Fraude",
    "Decisão Koin",
    "Categoria",
    "Bandeira",
    "Documento",
    "Email",
    "Telefone",
    "BIN",
    "Entrega",
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

export function TransactionsTab({ backtestId }: TransactionsTabProps) {
  const [loadState, setLoadState] = useState<LoadState>(backtestId ? "idle" : "error");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    backtestId ? null : "Este backtest ainda não possui um CSV salvo para carregar as transações.",
  );
  const [rows, setRows] = useState<BacktestTransactionRecord[]>([]);
  const [currency, setCurrency] = useState<CurrencyInfo>(DEFAULT_CURRENCY);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!backtestId) return;

    let ignore = false;

    async function loadRows() {
      setLoadState("loading");
      setErrorMessage(null);
      try {
        const res = await fetch("/api/backtest/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: backtestId }),
        });

        const data = (await res.json()) as {
          error?: string;
          rows?: BacktestTransactionRecord[];
          currency?: CurrencyInfo;
        };

        if (!res.ok) {
          if (!ignore) {
            setLoadState("error");
            setErrorMessage(data.error ?? `Erro HTTP ${res.status}`);
          }
          return;
        }

        if (!ignore) {
          setRows(data.rows ?? []);
          setCurrency(data.currency ?? DEFAULT_CURRENCY);
          setLoadState("ready");
        }
      } catch {
        if (!ignore) {
          setLoadState("error");
          setErrorMessage("Falha ao carregar as transações do CSV salvo.");
        }
      }
    }

    void loadRows();
    return () => {
      ignore = true;
    };
  }, [backtestId]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        [
          row.orderId,
          row.date,
          row.paymentStatus,
          row.koinDecision,
          row.item,
          row.cardBrand,
          row.document,
          row.email,
          row.phone,
          row.bin,
          row.delivery,
          row.amount != null ? String(row.amount) : null,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesFilter =
        filter === "all" ||
        (filter === "fraud" && row.fraud === true) ||
        (filter === "clean" && row.fraud === false) ||
        (filter === "koin-reject" &&
          ["reject", "rechaz", "recus", "negad"].some((token) =>
            row.koinDecision?.toLowerCase().includes(token),
          )) ||
        (filter === "approved" &&
          ["approv", "aprov", "paid", "acredit"].some((token) =>
            row.paymentStatus?.toLowerCase().includes(token),
          ));

      return matchesSearch && matchesFilter;
    });
  }, [filter, rows, search]);

  const formatAmount = (amount: number | null) => {
    if (amount == null) return "—";
    return formatFull(amount, currency);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D0D5DD] bg-white shadow-xs">
      <div className="flex flex-col gap-2 border-b border-[#E4E7EC] px-6 py-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#101828]">Transações do arquivo</h3>
          <p className="mt-1 text-sm text-[#667085]">
            Explore o dataset enviado com busca e filtros aplicados diretamente sobre o CSV salvo.
          </p>
        </div>

        {filteredRows.length > 0 && (
          <Button
            type="button"
            color="secondary"
            size="md"
            iconLeading={Download01}
            onClick={() => downloadCsv("backtest_transacoes_filtradas.csv", toCsv(filteredRows))}
          >
            Baixar filtradas
          </Button>
        )}
      </div>

      <DataTableToolbar
        searchPlaceholder="Buscar pedido, email, documento, bandeira..."
        searchValue={search}
        onSearchChange={setSearch}
        filterLabel="Filtrar transações"
        filterValue={filter}
        onFilterChange={setFilter}
        filterOptions={[
          { label: "Todas", value: "all" },
          { label: "Fraude", value: "fraud" },
          { label: "Sem fraude", value: "clean" },
          { label: "Koin rejeitou", value: "koin-reject" },
          { label: "Aprovadas", value: "approved" },
        ]}
      />

      <div className="flex items-center justify-between border-b border-[#E4E7EC] px-6 py-3 text-xs font-medium uppercase tracking-[0.08em] text-[#667085]">
        <span>{filteredRows.length.toLocaleString("pt-BR")} transações</span>
        <span>{rows.length.toLocaleString("pt-BR")} no arquivo</span>
      </div>

      {loadState === "loading" && (
        <div className="flex min-h-48 items-center justify-center px-6 py-10 text-sm text-[#667085]">
          Carregando transações do CSV salvo...
        </div>
      )}

      {loadState === "error" && (
        <div className="m-6 flex items-start gap-3 rounded-xl border border-[#FDB022] bg-[#FFFAEB] px-4 py-4">
          <AlertCircle className="mt-0.5 size-5 text-[#B54708]" />
          <div>
            <p className="text-sm font-semibold text-[#7A2E0E]">Dataset indisponível</p>
            <p className="mt-0.5 text-sm text-[#B54708]">{errorMessage}</p>
          </div>
        </div>
      )}

      {loadState === "ready" && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F9FAFB]">
              <tr className="border-b border-[#E4E7EC]">
                {["Pedido", "Bandeira", "Valor", "Status", "Fraude", "Koin", "Documento / Email"].map((label) => (
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
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-[#667085]">
                    Nenhuma transação encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]"}>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#101828]">
                      <div className="font-medium">{row.orderId ?? `#${row.id}`}</div>
                      <div className="mt-1 text-xs text-[#667085]">{row.date ?? "Sem data"}</div>
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
                        {row.fraud == null ? "N/A" : row.fraud ? "Fraude" : "Limpa"}
                      </span>
                    </td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#475467]">{row.koinDecision ?? "—"}</td>
                    <td className="border-b border-[#E4E7EC] px-6 py-4 text-[#475467]">
                      <div>{row.document ?? "—"}</div>
                      <div className="mt-1 text-xs text-[#667085]">{row.email ?? "Sem email"}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
