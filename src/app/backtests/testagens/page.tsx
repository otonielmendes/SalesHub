"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, type ComponentType, type SVGProps } from "react";
import { BacktestDashboard, type InsightsFetchState, type SaveStatus } from "@/components/backtest/BacktestDashboard";
import { CsvFileProgressRow, type CsvUploadRowPhase } from "@/components/backtest/csv-upload/CsvFileProgressRow";
import { calculateMetrics } from "@/lib/csv/metrics";
import { parseCsv } from "@/lib/csv/parser";
import { createClient } from "@/lib/supabase/client";
import type { BacktestMetrics, AiInsights } from "@/types/backtest";
import { useTranslations } from "next-intl";
import { Button } from "@/components/base/buttons/button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { AlertCircle, BarChart01, CheckCircle, Download01, File02, HomeLine, Plus, UploadCloud02 } from "@untitledui/icons";
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

type WizardStep = {
  id: "name" | "upload" | "validation" | "report";
  title: string;
  description: string;
  completedCount: number;
  totalCount: number;
  isActive: boolean;
  isMandatory: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function WizardProgressCard({
  step,
  requiredLabel,
  optionalLabel,
  stepCountLabel,
}: {
  step: WizardStep;
  requiredLabel: string;
  optionalLabel: string;
  stepCountLabel: string;
}) {
  const Icon = step.icon;
  const pct = step.totalCount > 0 ? Math.round((step.completedCount / step.totalCount) * 100) : 0;
  const isComplete = step.completedCount === step.totalCount;

  return (
    <div
      className={cx(
        "rounded-2xl border p-4 transition-colors",
        isComplete
          ? "border-[#0C8525] bg-[#E4FBE9]"
          : step.isActive
            ? "border-[#10B132] bg-[#F6FEF9]"
            : "border-[#D0D5D7] bg-white",
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isComplete
              ? "bg-[#0C8525]"
              : step.isActive
                ? "bg-[#E4FBE9] ring-1 ring-inset ring-[#10B132]"
                : "bg-[#F2F4F6]",
          )}
        >
          <Icon className={cx("h-6 w-6", isComplete ? "text-white" : step.isActive ? "text-[#0C8525]" : "text-[#344043]")} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-[#344043]">{step.title}</span>
            <span
              className={cx(
                "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                step.isMandatory ? "bg-[#FEF3F2] text-[#B42318]" : "bg-[#E4FBE9] text-[#0C8525]",
              )}
            >
              {step.isMandatory ? requiredLabel : optionalLabel}
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-[#475456]">{step.description}</p>
        </div>
        <div
          className={cx(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
            isComplete ? "border-[#0C8525] bg-[#0C8525]" : "border-[#D0D5D7] bg-white",
          )}
        >
          {isComplete && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <div className="mb-1 flex items-end justify-between gap-2 text-xs text-[#344043]">
        <span>
          {stepCountLabel}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full bg-[#10B132] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function TestagensPage() {
  const t = useTranslations("backtests.testagens");
  const tHistorico = useTranslations("backtests.historico");
  const tUpload = useTranslations("backtests.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<PageState>("idle");
  const [analysisName, setAnalysisName] = useState("");
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
          prospect_name: analysisName.trim() || file.name.replace(/\.csv$/i, "").replace(/[-_]/g, " "),
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
    [analysisName, clearSaveProgressTick, t],
  );

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) return;
      if (!analysisName.trim()) {
        setErrorMessage(t("errors.name_required"));
        setState("error");
        return;
      }

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
    [analysisName, clearSaveProgressTick, processCsvText, t],
  );

  const handleReset = useCallback(() => {
    clearSaveProgressTick();
    setState("idle");
    setAnalysisName("");
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
  const hasName = analysisName.trim().length > 0;
  const uploadDisabled = dropDisabled || !hasName;
  const validationStarted = state === "parsing" || state === "loaded" || state === "error";
  const validationComplete = rowPhase === "complete" || state === "loaded";
  const wizardSteps = useMemo<WizardStep[]>(
    () => [
      {
        id: "name",
        title: t("steps.name.title"),
        description: t("steps.name.description"),
        completedCount: hasName ? 1 : 0,
        totalCount: 1,
        isActive: !hasName,
        isMandatory: true,
        icon: BarChart01,
      },
      {
        id: "upload",
        title: t("steps.upload.title"),
        description: t("steps.upload.description"),
        completedCount: workFile ? 1 : 0,
        totalCount: 1,
        isActive: hasName && !workFile,
        isMandatory: true,
        icon: UploadCloud02,
      },
      {
        id: "validation",
        title: t("steps.validation.title"),
        description: t("steps.validation.description"),
        completedCount: validationComplete ? 1 : 0,
        totalCount: 1,
        isActive: Boolean(workFile) && validationStarted && !validationComplete,
        isMandatory: true,
        icon: File02,
      },
      {
        id: "report",
        title: t("steps.report.title"),
        description: t("steps.report.description"),
        completedCount: savedId ? 1 : 0,
        totalCount: 1,
        isActive: validationComplete && !savedId,
        isMandatory: false,
        icon: CheckCircle,
      },
    ],
    [hasName, savedId, t, validationComplete, validationStarted, workFile],
  );

  const openPicker = () => {
    if (!uploadDisabled) inputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadDisabled) return;
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
        analysisName={analysisName}
        savedId={savedId}
        saveStatus={saveStatus}
        source="testagens"
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <div className="mx-auto w-full max-w-container px-6 py-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-3 text-sm text-[#475456]">
          <Link
            href="/backtests/historico"
            className="rounded-md p-1 transition-colors hover:bg-[#EAECEE]"
            aria-label={tHistorico("breadcrumbBacktests")}
          >
            <HomeLine className="h-5 w-5" />
          </Link>
          <span className="text-[#D0D5D7]">/</span>
          <Link href="/backtests/historico" className="rounded-md px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
            {tHistorico("breadcrumbBacktests")}
          </Link>
          <span className="text-[#D0D5D7]">/</span>
          <span className="rounded-md px-2 py-1 font-semibold text-[#0C8525]">{t("title")}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[280px] flex-1">
            <h1 className="text-2xl font-semibold text-[#10181B]">{analysisName.trim() || t("title")}</h1>
            <p className="mt-1 text-base text-[#475456]">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="md" color="secondary" iconLeading={Download01} href="/templates/backtest_template.csv">
              {t("downloadTemplate")}
            </Button>
            <Button size="md" iconLeading={Plus} onClick={openPicker} isDisabled={uploadDisabled}>
              {tUpload("selectCsv")}
            </Button>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-6">
            {state === "error" && errorMessage && !workFile && (
              <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF3F2] p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D92D20]" />
                <p className="text-sm font-medium text-[#B42318]">{errorMessage}</p>
              </div>
            )}

            <section className="overflow-hidden rounded-2xl border border-[#D0D5D7] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#EAECEE] px-6 py-5">
                <div>
                  <h2 className="text-sm font-bold text-[#475456]">{t("sections.identity.title")}</h2>
                  <p className="mt-1 text-sm text-[#475456]">{t("sections.identity.description")}</p>
                </div>
                <span className="rounded-md bg-[#FEF3F2] px-2 py-1 text-xs font-medium text-[#B42318]">
                  {t("required")}
                </span>
              </div>
              <div className="p-6">
                <label htmlFor="analysisName" className="block text-sm font-semibold text-[#344043]">
                  {t("fields.analysisName.label")} <span className="text-[#F04438]">*</span>
                </label>
                <input
                  id="analysisName"
                  type="text"
                  value={analysisName}
                  onChange={(e) => {
                    setAnalysisName(e.target.value);
                    if (state === "error" && !workFile) {
                      setState("idle");
                      setErrorMessage("");
                    }
                  }}
                  placeholder={t("fields.analysisName.placeholder")}
                  className="mt-1.5 h-11 w-full rounded-lg border border-[#D0D5DD] bg-[#F9FAFB] px-3.5 text-sm text-[#10181B] placeholder:text-[#667085] transition-all focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10B132]"
                />
              </div>
            </section>

            <section className={cx("overflow-hidden rounded-2xl border bg-white", hasName ? "border-[#D0D5D7]" : "border-[#E4E7EC] opacity-70")}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECEE] px-6 py-5">
                <div>
                  <h2 className="text-sm font-bold text-[#475456]">{t("sections.upload.title")}</h2>
                  <p className="mt-1 text-sm text-[#475456]">{t("sections.upload.description")}</p>
                </div>
                <Button size="sm" color="secondary" iconLeading={Download01} href="/templates/backtest_template.csv">
                  {t("downloadTemplate")}
                </Button>
              </div>
              <div className="p-6">
                <div
                  role="button"
                  tabIndex={uploadDisabled ? -1 : 0}
                  aria-disabled={uploadDisabled}
                  aria-label={tUpload("ariaLabel")}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!uploadDisabled) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={openPicker}
                  onKeyDown={(e) => e.key === "Enter" && openPicker()}
                  className={cx(
                    "flex min-h-56 flex-col items-center justify-center gap-4 rounded-xl border border-secondary bg-primary px-6 py-10 text-center transition-all duration-200",
                    uploadDisabled && "cursor-not-allowed opacity-60",
                    !uploadDisabled &&
                      (isDragging
                        ? "cursor-pointer border-brand-400 bg-brand-25 shadow-xs ring-2 ring-brand-200"
                        : "cursor-pointer hover:border-brand-300 hover:bg-secondary_alt"),
                  )}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    disabled={uploadDisabled}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFileSelected(file);
                      e.target.value = "";
                    }}
                  />

                  <div
                    className={cx(
                      "flex size-12 items-center justify-center rounded-lg border border-secondary bg-primary shadow-xs ring-4 ring-primary transition-colors",
                      isDragging && !uploadDisabled && "border-brand-200 bg-brand-50",
                    )}
                  >
                    <UploadCloud02 className={cx("size-5", isDragging && !uploadDisabled ? "text-brand-600" : "text-quaternary")} aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary">
                      <span className="text-brand-700">{tUpload("clickToUpload")}</span>
                      <span className="text-tertiary"> {tUpload("dragDrop")}</span>
                    </p>
                    <p className="mt-1 text-sm text-tertiary">{hasName ? tUpload("onlyCsv") : t("uploadLocked")}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#D0D5D7] bg-white">
              <div className="border-b border-[#EAECEE] px-6 py-5">
                <h2 className="text-sm font-bold text-[#475456]">{t("sections.validation.title")}</h2>
                <p className="mt-1 text-sm text-[#475456]">{t("sections.validation.description")}</p>
              </div>
              <div className="space-y-4 p-6">
                {workFile ? (
                  <CsvFileProgressRow
                    file={workFile}
                    phase={rowPhase}
                    progress={uploadProgress}
                    errorMessage={state === "error" ? errorMessage : undefined}
                    onRemove={handleReset}
                    onRetry={state === "error" ? () => void handleFileSelected(workFile) : undefined}
                  />
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#D0D5D7] bg-[#F9FAFB] p-4">
                    <File02 className="h-5 w-5 shrink-0 text-[#98A2B3]" />
                    <p className="text-sm text-[#667085]">{t("validationEmpty")}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            {wizardSteps.map((step) => (
              <WizardProgressCard
                key={step.id}
                step={step}
                requiredLabel={t("required")}
                optionalLabel={t("optional")}
                stepCountLabel={t("stepCount", { completed: step.completedCount, total: step.totalCount })}
              />
            ))}
            <div className="rounded-2xl border border-[#D0D5D7] bg-white p-5">
              <p className="text-sm font-semibold text-[#10181B]">{t("sidecar.title")}</p>
              <p className="mt-2 text-sm text-[#667085]">{t("sidecar.description")}</p>
              <Button className="mt-4 w-full" size="md" onClick={openPicker} isDisabled={uploadDisabled}>
                {workFile ? t("sidecar.replaceCsv") : t("sidecar.cta")}
              </Button>
            </div>
          </aside>
        </div>
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
