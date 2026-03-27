"use client";

import { useCallback, useRef, useState } from "react";
import { Upload01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface UploadZoneProps {
  onFileSelected?: (file: File) => void;
}

export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        return;
      }
      setSelectedFile(file);
      onFileSelected?.(file);
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Área de upload de CSV"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={cx(
        "flex min-h-60 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-primary px-6 py-12 transition-colors",
        isDragging
          ? "border-brand-500 bg-brand-25"
          : "border-secondary hover:border-brand-300 hover:bg-brand-25",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className={cx(
          "flex h-12 w-12 items-center justify-center rounded-xl border border-secondary shadow-xs",
          isDragging ? "border-brand-300 bg-brand-50" : "bg-primary",
        )}
      >
        <Upload01
          className={cx(
            "h-5 w-5",
            isDragging ? "text-brand-600" : "text-quaternary",
          )}
        />
      </div>

      {selectedFile ? (
        <div className="text-center">
          <p className="text-sm font-semibold text-secondary">{selectedFile.name}</p>
          <p className="mt-1 text-sm text-tertiary">
            {(selectedFile.size / 1024).toFixed(0)} KB — Clique para substituir
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-semibold text-secondary">
            <span className="text-brand-700">Clique para carregar</span> ou arraste e solte
          </p>
          <p className="mt-1 text-sm text-tertiary">Apenas arquivos .CSV</p>
        </div>
      )}
    </div>
  );
}
