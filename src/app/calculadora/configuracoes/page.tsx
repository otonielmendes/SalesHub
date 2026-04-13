"use client";

import { useState } from "react";
import { RefreshCw01 } from "@untitledui/icons";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import {
  KOIN_PERFORMANCE_DEFAULTS,
  KOIN_SETTINGS_KEY,
  KOIN_COST_DEFAULTS,
  KOIN_COST_SETTINGS_KEY,
  getKoinSettings,
  getCostSettings,
  type KoinPerformanceData,
  type CostSettings,
} from "@/lib/health-check/benchmarks";
import { CalculadoraPageBreadcrumbs, CalculadoraPageContainer } from "../_components/page-shell";

const VERTICALS = Object.keys(KOIN_PERFORMANCE_DEFAULTS);

// ─── Custos Operacionais ──────────────────────────────────────────────────────

interface CostCardProps {
  data: CostSettings;
  saved: boolean;
  onChange: (field: keyof CostSettings, value: number) => void;
  onRestore: () => void;
  onSave: () => void;
}

function CostCard({ data, saved, onChange, onRestore, onSave }: CostCardProps) {
  const FIELDS: { key: keyof CostSettings; label: string; unit: string; helper: string }[] = [
    {
      key: "custo_por_revisao_manual",
      label: "Custo por revisão manual",
      unit: "R$",
      helper: "Custo médio por transação analisada manualmente (salário analista + overhead). Default: R$ 4,50 — benchmark Brasil (MRC 2024: ~5,6 min/análise)",
    },
    {
      key: "reducao_revisao_manual_koin",
      label: "Redução de revisão manual c/ Koin",
      unit: "%",
      helper: "Percentual da fila de revisão manual eliminada pela automação da Koin. Default: 70%",
    },
    {
      key: "custo_por_3ds_challenge",
      label: "Custo por 3DS challenge",
      unit: "R$",
      helper: "Taxa direta de rede/processador por transação com challenge 3DS. Default: R$ 0,30 (Braintree/Adyen: $0,10–$0,30)",
    },
    {
      key: "taxa_abandono_3ds",
      label: "Taxa de abandono por 3DS challenge",
      unit: "%",
      helper: "Percentual de transações com challenge que resultam em abandono de carrinho. Default: 15%",
    },
  ];

  return (
    <div className="rounded-xl border border-secondary bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset">
      <div className="mb-6 flex items-start justify-between gap-4">
        <p className="text-sm text-tertiary">
          Valores usados para calcular economia de revisão manual e 3DS no ROI. Edite conforme a realidade do merchant.
        </p>
        <Button color="tertiary" size="sm" iconLeading={RefreshCw01} onClick={onRestore}>
          Restaurar padrões
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {FIELDS.map(({ key, label, unit, helper }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-secondary">{label}</label>
            <div className="relative">
              <input
                type="number" step="0.01" min="0"
                className="h-11 w-full rounded-lg border border-secondary bg-primary px-3 pr-12 text-sm text-primary shadow-xs ring-1 ring-secondary ring-inset transition focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={data[key]}
                onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-quaternary">{unit}</span>
            </div>
            <p className="mt-1 text-xs text-quaternary">{helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button color="primary" size="sm" onClick={onSave}>
          Salvar custos operacionais
        </Button>
        {saved && <span className="text-xs font-medium text-success-600">Salvo</span>}
      </div>
    </div>
  );
}

interface SegmentCardProps {
  vertical: string;
  data: KoinPerformanceData;
  savedVerticals: Set<string>;
  onChange: (vertical: string, field: keyof Omit<KoinPerformanceData, "vertical">, value: number) => void;
  onRestore: (vertical: string) => void;
  onSave: (vertical: string) => void;
}

function SegmentCard({ vertical, data, savedVerticals, onChange, onRestore, onSave }: SegmentCardProps) {
  const t = useTranslations("calculadora.configuracoes");
  const isSaved = savedVerticals.has(vertical);

  const FIELDS: {
    key: keyof Omit<KoinPerformanceData, "vertical">;
    label: string;
    unit: string;
    helper: string;
  }[] = [
    {
      key: "taxa_aprovacao_koin",
      label: t("fieldApprovalLabel"),
      unit: "%",
      helper: t("fieldApprovalHelper"),
    },
    {
      key: "taxa_chargeback_koin",
      label: t("fieldChargebackLabel"),
      unit: "%",
      helper: t("fieldChargebackHelper"),
    },
    {
      key: "lift_aprovacao",
      label: t("fieldLiftLabel"),
      unit: "pp",
      helper: t("fieldLiftHelper"),
    },
    {
      key: "reducao_chargeback",
      label: t("fieldCbReductionLabel"),
      unit: "%",
      helper: t("fieldCbReductionHelper"),
    },
  ];

  return (
    <div className="flex flex-col rounded-xl border border-secondary bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success-500" />
          <span className="text-sm font-semibold text-primary">{vertical}</span>
        </div>
        <Button color="tertiary" size="sm" iconLeading={RefreshCw01} onClick={() => onRestore(vertical)}>
          {t("buttonRestore")}
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
          {t("buttonUpdate")}
        </Button>
        {isSaved && (
          <span className="text-xs font-medium text-success-600">{t("saved")}</span>
        )}
      </div>
    </div>
  );
}

export default function CalculadoraConfiguracoesPage() {
  const t = useTranslations("calculadora.configuracoes");
  const [settings, setSettings] = useState<Record<string, KoinPerformanceData>>(() => getKoinSettings());
  const [savedVerticals, setSavedVerticals] = useState<Set<string>>(new Set());
  const [costs, setCosts] = useState<CostSettings>(() => getCostSettings());
  const [costSaved, setCostSaved] = useState(false);

  function handleCostChange(field: keyof CostSettings, value: number) {
    setCosts((prev) => ({ ...prev, [field]: value }));
    setCostSaved(false);
  }

  function handleCostRestore() {
    setCosts({ ...KOIN_COST_DEFAULTS });
    localStorage.removeItem(KOIN_COST_SETTINGS_KEY);
    setCostSaved(false);
  }

  function handleCostSave() {
    localStorage.setItem(KOIN_COST_SETTINGS_KEY, JSON.stringify(costs));
    setCostSaved(true);
  }

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
          { label: t("breadcrumbCalculadora"), href: "/calculadora/historico" },
          { label: t("breadcrumbConfiguracoes"), current: true },
        ]}
      />

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-xs font-semibold tracking-tight text-primary md:text-2xl">
              {t("title")}
            </h1>
            <Badge type="pill-color" color="brand" size="sm">
              {t("badgeSegments", { count: VERTICALS.length })}
            </Badge>
          </div>
          <p className="text-sm text-tertiary">{t("subtitle")}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-secondary">Custos Operacionais</h2>
        <CostCard
          data={costs}
          saved={costSaved}
          onChange={handleCostChange}
          onRestore={handleCostRestore}
          onSave={handleCostSave}
        />
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
