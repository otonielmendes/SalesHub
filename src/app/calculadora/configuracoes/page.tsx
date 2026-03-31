"use client";

import { useState } from "react";
import { RefreshCw01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import {
  KOIN_PERFORMANCE_DEFAULTS,
  KOIN_SETTINGS_KEY,
  getKoinSettings,
  type KoinPerformanceData,
} from "@/lib/health-check/benchmarks";
import { CalculadoraPageBreadcrumbs, CalculadoraPageContainer } from "../_components/page-shell";

const VERTICALS = Object.keys(KOIN_PERFORMANCE_DEFAULTS);

const FIELDS: {
  key: keyof Omit<KoinPerformanceData, "vertical">;
  label: string;
  unit: string;
  helper: string;
}[] = [
  {
    key: "taxa_aprovacao_koin",
    label: "Taxa de aprovação Koin",
    unit: "%",
    helper: "Aprovação média dos clientes Koin neste segmento",
  },
  {
    key: "taxa_chargeback_koin",
    label: "Taxa de chargeback Koin",
    unit: "%",
    helper: "Chargeback médio dos clientes Koin neste segmento",
  },
  {
    key: "lift_aprovacao",
    label: "Lift de aprovação esperado",
    unit: "pp",
    helper: "Melhora em pontos percentuais na aprovação pós-Koin",
  },
  {
    key: "reducao_chargeback",
    label: "Redução de chargeback esperada",
    unit: "%",
    helper: "Redução percentual no chargeback pós-Koin",
  },
];

interface SegmentCardProps {
  vertical: string;
  data: KoinPerformanceData;
  savedVerticals: Set<string>;
  onChange: (vertical: string, field: keyof Omit<KoinPerformanceData, "vertical">, value: number) => void;
  onRestore: (vertical: string) => void;
  onSave: (vertical: string) => void;
}

function SegmentCard({ vertical, data, savedVerticals, onChange, onRestore, onSave }: SegmentCardProps) {
  const isSaved = savedVerticals.has(vertical);

  return (
    <div className="flex flex-col rounded-xl border border-secondary bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success-500" />
          <span className="text-sm font-semibold text-primary">{vertical}</span>
        </div>
        <Button color="tertiary" size="sm" iconLeading={RefreshCw01} onClick={() => onRestore(vertical)}>
          Restaurar
        </Button>
      </div>

      <div className="flex-1 space-y-4">
        {FIELDS.map(({ key, label, unit, helper }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-secondary">{label}</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                className="h-11 w-full rounded-lg border border-secondary bg-primary px-3 pr-12 text-sm text-primary shadow-xs ring-1 ring-secondary ring-inset transition focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={data[key]}
                onChange={(e) => onChange(vertical, key, parseFloat(e.target.value) || 0)}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-quaternary">
                {unit}
              </span>
            </div>
            <p className="mt-1 text-xs text-quaternary">{helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button color="primary" size="sm" className="flex-1" onClick={() => onSave(vertical)}>
          Atualizar
        </Button>
        {isSaved && (
          <span className="text-xs font-medium text-success-600">Salvo</span>
        )}
      </div>
    </div>
  );
}

export default function CalculadoraConfiguracoesPage() {
  const [settings, setSettings] = useState<Record<string, KoinPerformanceData>>(() => getKoinSettings());
  const [savedVerticals, setSavedVerticals] = useState<Set<string>>(new Set());

  const displaySettings = Object.keys(settings).length > 0 ? settings : KOIN_PERFORMANCE_DEFAULTS;

  function handleChange(
    vertical: string,
    field: keyof Omit<KoinPerformanceData, "vertical">,
    value: number,
  ) {
    setSettings((prev) => ({
      ...prev,
      [vertical]: { ...(prev[vertical] ?? KOIN_PERFORMANCE_DEFAULTS[vertical]), [field]: value },
    }));
    setSavedVerticals((prev) => {
      const next = new Set(prev);
      next.delete(vertical);
      return next;
    });
  }

  function handleRestore(vertical: string) {
    setSettings((prev) => ({
      ...prev,
      [vertical]: { ...KOIN_PERFORMANCE_DEFAULTS[vertical] },
    }));
    const raw = localStorage.getItem(KOIN_SETTINGS_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw) as Record<string, Partial<KoinPerformanceData>>;
        delete saved[vertical];
        localStorage.setItem(KOIN_SETTINGS_KEY, JSON.stringify(saved));
      } catch {
        // ignore
      }
    }
    setSavedVerticals((prev) => {
      const next = new Set(prev);
      next.delete(vertical);
      return next;
    });
  }

  function handleSave(vertical: string) {
    const raw = localStorage.getItem(KOIN_SETTINGS_KEY);
    const current = raw ? (JSON.parse(raw) as Record<string, Partial<KoinPerformanceData>>) : {};
    current[vertical] = { ...(settings[vertical] ?? KOIN_PERFORMANCE_DEFAULTS[vertical]) };
    localStorage.setItem(KOIN_SETTINGS_KEY, JSON.stringify(current));
    setSavedVerticals((prev) => new Set([...prev, vertical]));
  }

  return (
    <CalculadoraPageContainer className="animate-in fade-in duration-500">
      <CalculadoraPageBreadcrumbs
        className="mb-10"
        items={[
          { label: "Calculadora", href: "/calculadora/historico" },
          { label: "Configurações", current: true },
        ]}
      />

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-xs font-semibold tracking-tight text-primary md:text-2xl">
              Performance Koin por Segmento
            </h1>
            <Badge type="pill-color" color="brand" size="sm">
              {VERTICALS.length} segmentos
            </Badge>
          </div>
          <p className="text-sm text-tertiary">
            Estes valores são usados nas projeções de ROI de cada assessment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {VERTICALS.map((vertical) => (
          <SegmentCard
            key={vertical}
            vertical={vertical}
            data={displaySettings[vertical] ?? KOIN_PERFORMANCE_DEFAULTS[vertical]}
            savedVerticals={savedVerticals}
            onChange={handleChange}
            onRestore={handleRestore}
            onSave={handleSave}
          />
        ))}
      </div>
    </CalculadoraPageContainer>
  );
}
