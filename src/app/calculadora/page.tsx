"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Eye,
  FileEdit,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Assessment } from "@/lib/health-check/types";
import { getAllAssessments, deleteAssessment } from "@/lib/health-check/store";
import { formatDate, formatCurrency } from "@/lib/health-check/utils";

const VERTICALS = [
  "E-commerce", "Fintech", "Marketplace", "Delivery",
  "Digital Goods", "Travel", "Subscription",
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

  useEffect(() => { void load(); }, []);

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

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Fraud Health Check</h1>
          <p className="text-sm text-gray-500">
            Diagnostique a saúde antifraude dos seus leads e projete o ganho financeiro com a Koin.
          </p>
        </div>
        <Link
          href="/calculadora/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Nova Calculadora
        </Link>
      </div>

      {/* Stats */}
      {!isLoading && assessments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: BarChart3, color: "text-brand-600", bg: "bg-brand-50", value: assessments.length, label: "Total assessments" },
            { icon: CheckCircle2, color: "text-success-600", bg: "bg-success-50", value: totalComplete, label: "Completos" },
            { icon: Clock, color: "text-warning-600", bg: "bg-warning-50", value: totalDraft, label: "Rascunhos" },
          ].map(({ icon: Icon, color, bg, value, label }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome do merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition"
          />
        </div>
        <div className="relative w-full md:w-56">
          <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <select
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
            className="w-full pl-10 pr-8 h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 appearance-none transition"
          >
            <option value="all">Todas as verticais</option>
            {VERTICALS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3.5 font-semibold text-gray-700">Merchant</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-700">Vertical</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-700">Ticket Médio</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-700">Status</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-700">Atualizado em</th>
              <th className="text-right px-4 py-3.5 font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    <span className="text-sm text-gray-400 font-medium">Carregando...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-56 text-center">
                  <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">
                        {search || verticalFilter !== "all" ? "Nenhum resultado encontrado" : "Sem assessments ainda"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {search || verticalFilter !== "all"
                          ? "Tente ajustar os filtros."
                          : "Crie seu primeiro assessment para começar."}
                      </p>
                    </div>
                    {!search && verticalFilter === "all" && (
                      <Link
                        href="/calculadora/new"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Criar assessment
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="group hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-brand-600">
                          {(a.merchant_name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                        {a.merchant_name || "Sem nome"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {a.vertical}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-700 font-semibold font-mono">
                    {formatCurrency(a.ticket_medio)}
                  </td>
                  <td className="px-4 py-4">
                    {a.status === "complete" ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-success-500" />
                        <span className="text-sm font-semibold text-success-700">Completo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-warning-500" />
                        <span className="text-sm font-semibold text-warning-700">Rascunho</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-sm">{formatDate(a.updated_at)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {a.status === "complete" ? (
                        <Link
                          href={`/calculadora/${a.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver relatório
                        </Link>
                      ) : (
                        <Link
                          href={`/calculadora/new?id=${a.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-warning-700 hover:bg-warning-50 transition-colors"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          Continuar
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-error-600 hover:bg-error-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          {filtered.length} {filtered.length === 1 ? "assessment" : "assessments"} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
