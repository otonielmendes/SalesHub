"use client";

import { useCallback, useRef, useState } from "react";
import { BacktestDashboard, type InsightsFetchState, type SaveStatus } from "@/components/backtest/BacktestDashboard";
import { CsvFileProgressRow, type CsvUploadRowPhase } from "@/components/backtest/csv-upload/CsvFileProgressRow";
import { calculateMetrics } from "@/lib/csv/metrics";
import { parseCsv } from "@/lib/csv/parser";
import { createClient } from "@/lib/supabase/client";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { Button } from "@/components/base/buttons/button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Download01, HomeLine, Plus } from "@untitledui/icons";
import { cx } from "@/utils/cx";

type PageState = "idle" | "parsing" | "loaded" | "error";

type NormalizationSummary = {
  adjusted: boolean;
  normalizedCsv: string;
  changes: { from: string; to: string }[];
  missingOptional: string[];
  extraColumns: string[];
  expectedColumns: string[];
  receivedColumns: string[];
};

export default function TestagensPage() {
  const t = useTranslations("backtests.testagens");
  const tHistorico = useTranslations("backtests.historico");
  const tUpload = useTranslations("backtests.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
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
  const [normalizeModalOpen, setNormalizeModalOpen] = useState(false);
  const [normalizeChanges, setNormalizeChanges] = useState<{ from: string; to: string }[]>([]);
  const [missingOptionalColumns, setMissingOptionalColumns] = useState<string[]>([]);
  const [extraColumns, setExtraColumns] = useState<string[]>([]);
  const [pendingNormalizedCsv, setPendingNormalizedCsv] = useState<string | null>(null);
  const [pendingNormalizationSummary, setPendingNormalizationSummary] = useState<NormalizationSummary | null>(null);

  const saveProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSaveProgressTick = useCallback(() => {
    if (saveProgressTimerRef.current) {
      clearInterval(saveProgressTimerRef.current);
      saveProgressTimerRef.current = null;
    }
  }, []);

  const processCsvText = useCallback(
    async (csvText: string, file: File, normalization?: NormalizationSummary) => {
      const { rows, currency } = parseCsv(csvText);
      if (rows.length === 0) {
        setErrorMessage(t("errors.csv_empty"));
        setRowPhase("error");
        setState("error");
        return;
      }

      setUploadProgress(52);
      const calculated = calculateMetrics(rows, currency);
      if (normalization) {
        calculated.dataQuality = {
          status: normalization.missingOptional.length > 0 ? "partial" : "complete",
          expectedColumns: normalization.expectedColumns,
          receivedColumns: normalization.receivedColumns,
          adjustedColumns: normalization.changes,
          missingOptionalColumns: normalization.missingOptional,
          extraColumns: normalization.extraColumns,
        };
      }
      setUploadProgress(60);
      setMetrics(calculated);

      setRowPhase("saving");
      setSaveStatus("saving");
      setUploadProgress(66);

      // Capture CSV text and Supabase user for Storage upload (resolved after save)
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

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
          if (!data.id) throw new Error(t("errors.invalid_response"));
          setSavedId(data.id);
          setSaveStatus("saved");

          // Upload CSV to Storage and register in backtest_files (fire-and-forget)
          if (authUser) {
            const storagePath = `${authUser.id}/${data.id}.csv`;
            const blob = new Blob([csvText], { type: "text/csv" });
            supabase.storage
              .from("backtest-files")
              .upload(storagePath, blob)
              .then(({ error: uploadError }) => {
                if (uploadError) {
                  console.warn("CSV Storage upload failed:", uploadError.message);
                  return;
                }
                return fetch("/api/backtest/save", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: data.id, storage_path: storagePath }),
                });
              })
              .catch((err) => console.warn("CSV Storage upload error:", err));
          }

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
          setInsightsErrorMessage(t("errors.network_insights"));
        });

      const saved = await savePromise;
      clearSaveProgressTick();

      if (!saved) {
        setErrorMessage(t("errors.save_failed"));
        setRowPhase("error");
        setState("error");
        return;
      }

      setUploadProgress(100);
      setRowPhase("complete");
      await new Promise<void>((r) => setTimeout(r, 520));
      setState("loaded");
    },
    [clearSaveProgressTick, t],
  );

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
      setNormalizeChanges([]);
      setMissingOptionalColumns([]);
      setExtraColumns([]);
      setPendingNormalizedCsv(null);
      setPendingNormalizationSummary(null);
      setNormalizeModalOpen(false);
      setState("parsing");
      setRowPhase("reading");
      setUploadProgress(6);

      try {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        setUploadProgress(14);

        const text = await file.text();
        setUploadProgress(32);
        setRowPhase("normalizing");

        const normalizeRes = await fetch("/api/backtest/normalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText: text }),
        });

        if (!normalizeRes.ok) {
          const data = (await normalizeRes.json()) as { error?: string; missing?: string[] };
          if (normalizeRes.status == 422 && data.missing?.length) {
            setErrorMessage(t("errors.missing_columns", { columns: data.missing.join(", ") }));
          } else {
            setErrorMessage(data.error ?? t("errors.process_file"));
          }
          setRowPhase("error");
          setState("error");
          return;
        }

        const data = (await normalizeRes.json()) as {
          adjusted: boolean;
          normalizedCsv: string;
          changes: { from: string; to: string }[];
          missingOptional: string[];
          extraColumns: string[];
          expectedColumns: string[];
          receivedColumns: string[];
        };
        const normalization: NormalizationSummary = {
          adjusted: data.adjusted,
          normalizedCsv: data.normalizedCsv,
          changes: data.changes ?? [],
          missingOptional: data.missingOptional ?? [],
          extraColumns: data.extraColumns ?? [],
          expectedColumns: data.expectedColumns ?? [],
          receivedColumns: data.receivedColumns ?? [],
        };

        if (normalization.adjusted || normalization.missingOptional.length > 0 || normalization.extraColumns.length > 0) {
          setNormalizeChanges(normalization.changes);
          setMissingOptionalColumns(normalization.missingOptional);
          setExtraColumns(normalization.extraColumns);
          setPendingNormalizedCsv(normalization.normalizedCsv);
          setPendingNormalizationSummary(normalization);
          setNormalizeModalOpen(true);
          setUploadProgress(40);
          return;
        }

        setRowPhase("parsing");
        setUploadProgress(44);
        await processCsvText(normalization.normalizedCsv, file, normalization);
      } catch {
        clearSaveProgressTick();
        setErrorMessage(t("errors.process_file"));
        setRowPhase("error");
        setState("error");
      }
    },
    [clearSaveProgressTick, processCsvText, t],
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
    setNormalizeModalOpen(false);
    setNormalizeChanges([]);
    setMissingOptionalColumns([]);
    setExtraColumns([]);
    setPendingNormalizedCsv(null);
    setPendingNormalizationSummary(null);
  }, [clearSaveProgressTick]);

  const dropDisabled =
    state === "parsing" &&
    (rowPhase === "reading" ||
      rowPhase === "normalizing" ||
      rowPhase === "parsing" ||
      rowPhase === "saving" ||
      rowPhase === "complete");

  const openPicker = () => {
    if (!dropDisabled) inputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (dropDisabled) return;
    const file = e.dataTransfer.files[0];
    if (file) void handleFileSelected(file);
  };

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
    <div className="mx-auto w-full max-w-container px-6 py-10 lg:px-8">
      <div className="flex flex-col gap-5">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-3 text-sm text-[#475456]">
          <a
            href="/backtests/testagens"
            className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]"
            aria-label={tHistorico("breadcrumbBacktests")}
          >
            <HomeLine className="h-5 w-5" />
          </a>
          <span className="text-[#D0D5D7]">/</span>
          <a href="/backtests/testagens" className="rounded-md px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
            {tHistorico("breadcrumbBacktests")}
          </a>
          <span className="text-[#D0D5D7]">/</span>
          <span className="rounded-md px-2 py-1 font-semibold text-[#0C8525]">{t("title")}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-primary">{t("title")}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="md" color="secondary" iconLeading={Download01} href="/templates/backtest_template.csv">
              {t("downloadTemplate")}
            </Button>
            <Button size="md" iconLeading={Plus} onClick={openPicker} isDisabled={dropDisabled}>
              {tUpload("selectCsv")}
            </Button>
          </div>
        </div>

        <div
          role="button"
          tabIndex={dropDisabled ? -1 : 0}
          aria-disabled={dropDisabled}
          aria-label={tUpload("ariaLabel")}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dropDisabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={openPicker}
          onKeyDown={(e) => e.key === "Enter" && openPicker()}
          className={cx(
            "rounded-2xl border border-secondary bg-primary p-8 shadow-xs ring-1 ring-secondary ring-inset md:p-12",
            dropDisabled && "cursor-not-allowed opacity-60",
            !dropDisabled &&
              (isDragging
                ? "border-brand-400 bg-brand-25 shadow-xs ring-2 ring-brand-200"
                : "hover:border-brand-300 hover:bg-secondary_alt"),
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={dropDisabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFileSelected(file);
              e.target.value = "";
            }}
          />

          <EmptyState size="md">
            <EmptyState.Header pattern="none">
              <EmptyState.FileTypeIcon />
            </EmptyState.Header>

            <EmptyState.Content>
              <EmptyState.Title>{t("title")}</EmptyState.Title>
              <EmptyState.Description>{t("subtitle")}</EmptyState.Description>
            </EmptyState.Content>

            <EmptyState.Footer>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button size="md" color="secondary" iconLeading={Download01} href="/templates/backtest_template.csv">
                  {t("downloadTemplate")}
                </Button>
                <Button size="md" iconLeading={Plus} onClick={openPicker}>
                  {tUpload("selectCsv")}
                </Button>
              </div>
            </EmptyState.Footer>
          </EmptyState>
        </div>

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

      <ModalOverlay
        isOpen={normalizeModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNormalizeModalOpen(false);
            setPendingNormalizedCsv(null);
            setPendingNormalizationSummary(null);
            setNormalizeChanges([]);
            setMissingOptionalColumns([]);
            setExtraColumns([]);
          }
        }}
        isDismissable
      >
        <Modal className="w-full max-w-2xl">
          <Dialog className="mx-auto w-full">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-[#D0D5DD]">
              <div className="border-b border-[#E4E7EC] px-6 py-5">
                <h3 className="text-lg font-semibold text-[#101828]">{t("normalize.title")}</h3>
                <p className="mt-2 text-sm text-[#667085]">{t("normalize.description")}</p>
              </div>
              <div className="px-6 py-5">
                {normalizeChanges.length > 0 && (
                  <div className="mb-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] p-4">
                    <p className="text-sm font-semibold text-[#101828]">{t("normalize.changesTitle")}</p>
                    <ul className="mt-3 list-disc pl-5 text-sm text-[#475467]">
                      {normalizeChanges.map((change) => (
                        <li key={`${change.from}-${change.to}`}>
                          {change.from} → {change.to}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {missingOptionalColumns.length > 0 && (
                  <div className="mb-4 rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4">
                    <p className="text-sm font-semibold text-[#93370D]">{t("normalize.partialTitle")}</p>
                    <p className="mt-2 text-sm text-[#B54708]">
                      {t("normalize.partialDescription", { columns: missingOptionalColumns.join(", ") })}
                    </p>
                  </div>
                )}
                {extraColumns.length > 0 && (
                  <div className="rounded-xl border border-[#D0D5DD] bg-white p-4">
                    <p className="text-sm font-semibold text-[#101828]">{t("normalize.extraTitle")}</p>
                    <p className="mt-2 text-sm text-[#475467]">
                      {t("normalize.extraDescription", { columns: extraColumns.join(", ") })}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E4E7EC] px-6 py-4">
                <Button
                  type="button"
                  color="secondary"
                  onClick={() => {
                    setNormalizeModalOpen(false);
                    setPendingNormalizedCsv(null);
                    setPendingNormalizationSummary(null);
                    setNormalizeChanges([]);
                    setMissingOptionalColumns([]);
                    setExtraColumns([]);
                    handleReset();
                  }}
                >
                  {t("normalize.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    if (!pendingNormalizedCsv || !workFile || !pendingNormalizationSummary) return;
                    setNormalizeModalOpen(false);
                    setRowPhase("parsing");
                    setUploadProgress(44);
                    await processCsvText(pendingNormalizedCsv, workFile, pendingNormalizationSummary);
                  }}
                >
                  {t("normalize.adjust")}
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
}
