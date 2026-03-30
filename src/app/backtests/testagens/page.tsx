"use client";

import { useState, useCallback } from "react";
import { UploadZone } from "@/components/backtest/UploadZone";
import { BacktestDashboard, type InsightsFetchState, type SaveStatus } from "@/components/backtest/BacktestDashboard";
import { parseCsv } from "@/lib/csv/parser";
import { calculateMetrics } from "@/lib/csv/metrics";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";

type PageState = "idle" | "parsing" | "loaded" | "error";

export default function TestagensPage() {
  const [state, setState] = useState<PageState>("idle");
  const [metrics, setMetrics] = useState<BacktestMetrics | null>(null);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [insightsFetchState, setInsightsFetchState] = useState<InsightsFetchState>("idle");
  const [insightsErrorMessage, setInsightsErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const handleFileSelected = useCallback(async (file: File) => {
    setState("parsing");
    setFileName(file.name);
    setSavedId(null);
    setSaveStatus("idle");

    try {
      const text = await file.text();
      const { rows } = parseCsv(text);

      if (rows.length === 0) {
        setErrorMessage("O arquivo CSV está vazio ou sem dados válidos.");
        setState("error");
        return;
      }

      const calculated = calculateMetrics(rows);
      setMetrics(calculated);
      setState("loaded");

      // Auto-save imediato (sem insights — chegam depois via PATCH)
      let resolvedId: string | null = null;
      setSaveStatus("saving");

      const savePromise = fetch("/api/backtest/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospect_name: file.name.replace(/\.csv$/i, "").replace(/[-_]/g, " "),
          filename: file.name,
          metrics: calculated,
        }),
      })
        .then(async (res) => {
          const data = (await res.json()) as { id?: string; error?: string };
          if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
          if (!data.id) throw new Error("Resposta inválida do servidor");
          resolvedId = data.id;
          setSavedId(data.id);
          setSaveStatus("saved");
          return data.id;
        })
        .catch(() => {
          setSaveStatus("error");
          return null;
        });

      // Insights em paralelo
      setInsights(null);
      setInsightsFetchState("loading");
      setInsightsErrorMessage(null);

      fetch("/api/backtest/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: calculated }),
      })
        .then(async (res) => {
          const data = (await res.json()) as { insights?: AiInsights; error?: string };
          if (!res.ok) {
            setInsightsFetchState("error");
            setInsightsErrorMessage(data.error ?? `Erro HTTP ${res.status}`);
            return;
          }
          if (data.insights) {
            setInsights(data.insights);
          }
          setInsightsFetchState("ready");

          // Aguarda o save terminar e então atualiza o record com os insights
          await savePromise;
          if (resolvedId && data.insights) {
            fetch("/api/backtest/save", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: resolvedId, insights: data.insights }),
            }).catch(() => {
              // Não fatal — insights ainda ficam visíveis na sessão, só não persistem
            });
          }
        })
        .catch(() => {
          setInsightsFetchState("error");
          setInsightsErrorMessage("Falha de rede ao solicitar insights.");
        });
    } catch {
      setErrorMessage("Erro ao processar o arquivo. Verifique se é um CSV válido.");
      setState("error");
    }
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setMetrics(null);
    setInsights(null);
    setInsightsFetchState("idle");
    setInsightsErrorMessage(null);
    setFileName("");
    setErrorMessage("");
    setSavedId(null);
    setSaveStatus("idle");
  }, []);

  if (state === "idle") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-display-xs font-semibold text-primary">Testagens</h1>
          <p className="mt-2 text-sm text-tertiary">
            Carregue o CSV de resultado do backtest para gerar o relatório de performance.
          </p>
        </div>
        <UploadZone onFileSelected={handleFileSelected} />
      </div>
    );
  }

  if (state === "parsing") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-sm font-medium text-secondary">Processando {fileName}…</p>
          <p className="text-sm text-tertiary">Detectando colunas e calculando métricas</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-center">
          <p className="text-sm font-semibold text-error-800">Erro ao processar o CSV</p>
          <p className="mt-1 text-sm text-error-600">{errorMessage}</p>
          <button
            onClick={handleReset}
            className="mt-4 rounded-lg bg-error-800 px-4 py-2 text-sm font-semibold text-white hover:bg-error-900"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <BacktestDashboard
      metrics={metrics!}
      insights={insights}
      insightsFetchState={insightsFetchState}
      insightsErrorMessage={insightsErrorMessage}
      fileName={fileName}
      savedId={savedId}
      saveStatus={saveStatus}
      onReset={handleReset}
    />
  );
}
