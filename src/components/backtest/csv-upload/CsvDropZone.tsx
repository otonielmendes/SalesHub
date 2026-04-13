"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud02 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { useTranslations } from "next-intl";

interface CsvDropZoneProps {
    /** Impede clique e drop (ex.: enquanto processa). */
    disabled?: boolean;
    onFileSelect: (file: File) => void;
    className?: string;
}

/** Zona de drop no padrão [Untitled UI File uploaders](https://www.untitledui.com/react/components/file-uploaders). */
export function CsvDropZone({ disabled, onFileSelect, className }: CsvDropZoneProps) {
    const t = useTranslations("backtests.upload");
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        (file: File) => {
            if (!file.name.toLowerCase().endsWith(".csv")) return;
            onFileSelect(file);
        },
        [onFileSelect],
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (disabled) return;
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [disabled, handleFile],
    );

    const openPicker = () => {
        if (!disabled) inputRef.current?.click();
    };

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-label={t("ariaLabel")}
            onDrop={handleDrop}
            onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={openPicker}
            onKeyDown={(e) => e.key === "Enter" && openPicker()}
            className={cx(
                "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-secondary bg-primary px-6 py-10 transition-all duration-200",
                disabled && "cursor-not-allowed opacity-50",
                !disabled &&
                    (isDragging
                        ? "border-brand-400 bg-brand-25 shadow-xs ring-2 ring-brand-200"
                        : "hover:border-brand-300 hover:bg-secondary_alt"),
                className,
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                }}
            />

            <div
                className={cx(
                    "flex size-12 items-center justify-center rounded-lg border border-secondary bg-primary shadow-xs ring-4 ring-primary transition-colors",
                    isDragging && !disabled && "border-brand-200 bg-brand-50",
                )}
            >
                <UploadCloud02
                    className={cx("size-5", isDragging && !disabled ? "text-brand-600" : "text-quaternary")}
                    aria-hidden
                />
            </div>

            <div className="text-center">
                <p className="text-sm font-semibold text-secondary">
                    <span className="text-brand-700">{t("clickToUpload")}</span>
                    <span className="text-tertiary"> {t("dragDrop")}</span>
                </p>
                <p className="mt-1 text-sm text-tertiary">{t("onlyCsv")}</p>
            </div>
        </div>
    );
}
