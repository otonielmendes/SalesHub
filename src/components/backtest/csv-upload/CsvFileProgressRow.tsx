"use client";

import { FileIcon } from "@untitledui/file-icons";
import { CheckCircle, Trash01, UploadCloud02, XCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";

export type CsvUploadRowPhase = "reading" | "parsing" | "saving" | "complete" | "error";

function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function phaseLabel(phase: CsvUploadRowPhase): string {
    switch (phase) {
        case "reading":
            return "A carregar ficheiro…";
        case "parsing":
            return "A processar CSV…";
        case "saving":
            return "A guardar no histórico…";
        case "complete":
            return "Concluído";
        case "error":
            return "Falhou";
        default:
            return "";
    }
}

interface CsvFileProgressRowProps {
    file: File;
    phase: CsvUploadRowPhase;
    /** 0–100; animado via CSS no fill da barra. */
    progress: number;
    errorMessage?: string;
    onRemove: () => void;
    onRetry?: () => void;
}

/**
 * Linha de ficheiro com barra de progresso (variante “Progress bar” da Untitled UI).
 * Fill com transição longa para movimento suave entre marcos.
 */
export function CsvFileProgressRow({
    file,
    phase,
    progress,
    errorMessage,
    onRemove,
    onRetry,
}: CsvFileProgressRowProps) {
    const showBar = phase !== "error";
    const isComplete = phase === "complete";
    const isError = phase === "error";
    const clamped = Math.min(100, Math.max(0, progress));

    return (
        <div
            className={cx(
                "relative rounded-xl border border-secondary bg-primary p-4 shadow-xs transition-shadow duration-300",
                isError && "border-error-300 ring-1 ring-error-100",
                isComplete && "border-success-200 ring-1 ring-success-100/80",
            )}
        >
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-3 right-3 rounded-md p-1.5 text-quaternary transition-colors hover:bg-secondary_hover hover:text-secondary"
                aria-label="Remover ficheiro"
            >
                <Trash01 className="size-4" aria-hidden />
            </button>

            <div className="flex gap-3 pr-10">
                <FileIcon type="csv" variant="gray" size={40} className="shrink-0" aria-hidden />

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-primary">{file.name}</p>
                    <p className="mt-0.5 text-sm text-tertiary">{formatFileSize(file.size)}</p>

                    <div className="mt-3 flex items-center gap-2">
                        {phase === "reading" || phase === "parsing" || phase === "saving" ? (
                            <>
                                <UploadCloud02 className="size-4 shrink-0 text-quaternary animate-pulse" aria-hidden />
                                <span className="text-sm text-tertiary">{phaseLabel(phase)}</span>
                            </>
                        ) : isComplete ? (
                            <>
                                <CheckCircle className="size-4 shrink-0 text-success-600" aria-hidden />
                                <span className="text-sm font-medium text-success-700">{phaseLabel(phase)}</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="size-4 shrink-0 text-error-600" aria-hidden />
                                <span className="text-sm font-medium text-error-700">{phaseLabel(phase)}</span>
                            </>
                        )}
                    </div>

                    {showBar && (
                        <div className="mt-3 flex items-center gap-3">
                            <ProgressBarBase
                                value={clamped}
                                className="h-2 flex-1 overflow-hidden rounded-full bg-quaternary"
                                progressClassName={cx(
                                    "rounded-full transition-[transform] duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none",
                                    isComplete ? "!bg-success-600" : "!bg-fg-brand-primary",
                                )}
                            />
                            <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-secondary">
                                {Math.round(clamped)}%
                            </span>
                        </div>
                    )}

                    {isError && errorMessage && (
                        <p className="mt-2 text-sm text-error-600">{errorMessage}</p>
                    )}

                    {isError && onRetry && (
                        <div className="mt-3">
                            <Button type="button" color="link-destructive" size="sm" onClick={() => onRetry()}>
                                Tentar novamente
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
