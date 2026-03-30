"use client";

import { useCallback, useRef, useState } from "react";
import { BacktestDashboard, type InsightsFetchState, type SaveStatus } from "@/components/backtest/BacktestDashboard";
import { CsvDropZone } from "@/components/backtest/csv-upload/CsvDropZone";
import { CsvFileProgressRow, type CsvUploadRowPhase } from "@/components/backtest/csv-upload/CsvFileProgressRow";
import { calculateMetrics } from "@/lib/csv/metrics";
import { parseCsv } from "@/lib/csv/parser";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";

type PageState = "idle" | "parsing" | "loaded" | "error";

export default function TestagensPage() {
  const [state, setState] = useState<PageState>("idle");
  const [workFile, setWorkFile] = useState<File | null>(null);
  const [rowPhase, setRowPhase] = useState<CsvUploadRowPhase>("reading");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [metrics, setMetrics] = useState<BacktestMetrics | null>(null);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [insightsFetchState, setInsightsFetchState] = useState<InsightsFetchState>("idle");
  const [insightsErrorMessage, setInsightsErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const saveProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSaveProgressTick = useCallback(() => {
    if (saveProgressTimerRef.current) {
      clearInterval(saveProgressTimerRef.current);
      saveProgressTimerRef.current = null;
    }
  }, []);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) return;

      clearSaveProgressTick();
      setWorkFile(file);
      setFileName(file.name);
      setSavedId(null);
      setSaveStatus("idle");
      setMetrics(null);
      setInsights(null);
      setInsightsFetchState("idle");
      setInsightsErrorMessage(null);
      setErrorMessage("");
      setState("parsing");
      setRowPhase("reading");
      setUploadProgress(6);

      try {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        setUploadProgress(14);

        const text = await file.text();
        setUploadProgress(36);
        setRowPhase("parsing");

        const { rows } = parseCsv(text);
        if (rows.length === 0) {
          setErrorMessage("O ficheiro CSV está vazio ou sem dados válidos.");
          setRowPhase("error");
          setState("error");
          return;
        }

        setUploadProgress(52);
        const calculated = calculateMetrics(rows);
        setUploadProgress(60);
        setMetrics(calculated);

        setRowPhase("saving");
        setSaveStatus("saving");
        setUploadProgress(66);

        let resolvedId: string | null = null;

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

        saveProgressTimerRef.current = setInterval(() => {
          setUploadProgress((p) => (p < 88 ? p + 1 : p));
        }, 120);

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

            const sid = await savePromise;
            if (sid && data.insights) {
              fetch("/api/backtest/save", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: sid, insights: data.insights }),
              }).catch(() => {});
            }
          })
          .catch(() => {
            setInsightsFetchState("error");
            setInsightsErrorMessage("Falha de rede ao solicitar insights.");
          });

        const saved = await savePromise;
        clearSaveProgressTick();

        if (!saved) {
          setErrorMessage("Não foi possível guardar o backtest. Tente novamente.");
          setRowPhase("error");
          setState("error");
          return;
        }

        setUploadProgress(100);
        setRowPhase("complete");
        await new Promise<void>((r) => setTimeout(r, 520));
        setState("loaded");
      } catch {
        clearSaveProgressTick();
        setErrorMessage("Erro ao processar o ficheiro. Verifique se é um CSV válido.");
        setRowPhase("error");
        setState("error");
      }
    },
    [clearSaveProgressTick],
  );

  const handleReset = useCallback(() => {
    clearSaveProgressTick();
    setState("idle");
    setWorkFile(null);
    setRowPhase("reading");
    setUploadProgress(0);
    setMetrics(null);
    setInsights(null);
    setInsightsFetchState("idle");
    setInsightsErrorMessage(null);
    setFileName("");
    setErrorMessage("");
    setSavedId(null);
    setSaveStatus("idle");
  }, [clearSaveProgressTick]);

  const dropDisabled =
    state === "parsing" &&
    (rowPhase === "reading" || rowPhase === "parsing" || rowPhase === "saving" || rowPhase === "complete");

  if (state === "loaded") {
    return (
      <BacktestDashboard
        metrics={metrics!}
        insights={insights}
        insightsFetchState={insightsFetchState}
        insightsErrorMessage={insightsErrorMessage}
        fileName={fileName}
        savedId={savedId}
        saveStatus={saveStatus}
        source="testagens"
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-display-xs font-semibold text-primary">Testagens</h1>
        <p className="mt-2 text-sm text-tertiary">
          Carregue o CSV de resultado do backtest para gerar o relatório de performance.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <CsvDropZone disabled={dropDisabled} onFileSelect={handleFileSelected} />

        {workFile && (
          <CsvFileProgressRow
            file={workFile}
            phase={rowPhase}
            progress={uploadProgress}
            errorMessage={state === "error" ? errorMessage : undefined}
            onRemove={handleReset}
            onRetry={state === "error" ? () => void handleFileSelected(workFile) : undefined}
          />
        )}
      </div>
    </div>
  );
}
