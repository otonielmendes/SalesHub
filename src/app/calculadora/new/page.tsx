"use client";

import type { ComponentType, SVGProps } from "react";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Annotation,
  ArrowLeft,
  BarChart01,
  Building07,
  ChevronDown,
  Globe01,
  InfoCircle,
  Save01,
  Target04,
  Tool01,
  TrendUp02,
  XClose,
} from "@untitledui/icons";
import { LoadingIndicator } from "@/components/application/loading-indicators/loading-indicator";
import {
  WIZARD_PAGE_GRID_CLASS,
  WIZARD_PAGE_HEADER_CLASS,
  WIZARD_PAGE_SHELL_CLASS,
  WIZARD_PAGE_SUBTITLE_CLASS,
  WIZARD_PAGE_TITLE_CLASS,
  WIZARD_FIELD_LABEL_CLASS,
  WIZARD_FIELD_REQUIRED_CLASS,
  WIZARD_INPUT_CLASS,
  WIZARD_INPUT_WITH_PREFIX_CLASS,
  WIZARD_INPUT_WITH_SUFFIX_CLASS,
  WIZARD_SELECT_CLASS,
  WIZARD_SECTION_BADGE_CLASS,
  WIZARD_SECTION_BODY_CLASS,
  WIZARD_SECTION_CLASS,
  WIZARD_SECTION_HEADER_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
  WIZARD_SIDEBAR_CLASS,
} from "@/components/application/wizard/wizard-layout";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { TextArea } from "@/components/base/textarea/textarea";
import {
  AssessmentFormData,
  Vertical,
  VolumeRange,
  BusinessModel,
  CurrentSolution,
  Pain,
  FraudOrigin,
  YesNoUnknown,
  YesNoPartial,
} from "@/lib/health-check/types";
import {
  createAssessment,
  updateAssessment,
  getAssessmentById,
  getDefaultFormData,
} from "@/lib/health-check/store";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY_CODE, getCurrencyMeta } from "@/lib/health-check/currency";
import { cx } from "@/utils/cx";
import { CalculadoraPageBreadcrumbs } from "../_components/page-shell";
import { ProgressCard } from "../_components/progress-card";

type IconComp = ComponentType<SVGProps<SVGSVGElement>>;

const VERTICALS: Vertical[] = [
  "E-commerce",
  "Fintech",
  "Marketplace",
  "Delivery",
  "Digital Goods",
  "Travel",
  "Subscription",
  "Outro",
];
const BUSINESS_MODELS: BusinessModel[] = ["B2C", "B2B", "Marketplace (com sellers)", "Outro"];
const SOLUTIONS: CurrentSolution[] = [
  "Konduto",
  "ClearSale",
  "Cybersource",
  "SEON",
  "Kount",
  "Signifyd",
  "ThreatMetrix",
  "Nethone",
  "In-house",
  "Nenhuma",
  "Outra",
];
const PAINS: Pain[] = [
  "Chargeback alto",
  "Muita revisão manual",
  "Aprovação baixa",
  "Fraude em crescimento",
  "Expansão para novos mercados",
  "Account Takeover (ATO)",
  "Compliance",
];
const FRAUD_ORIGINS: FraudOrigin[] = [
  "Contas novas",
  "ATO (contas existentes)",
  "Friendly fraud / abuso de políticas",
];
const COUNTRIES = [
  "Antígua e Barbuda",
  "Argentina",
  "Bahamas",
  "Barbados",
  "Belize",
  "Bolívia",
  "Brasil",
  "Chile",
  "Colômbia",
  "Costa Rica",
  "Cuba",
  "Dominica",
  "El Salvador",
  "Equador",
  "Granada",
  "Guatemala",
  "Guiana",
  "Haiti",
  "Honduras",
  "Jamaica",
  "México",
  "Nicarágua",
  "Panamá",
  "Paraguai",
  "Peru",
  "República Dominicana",
  "Santa Lúcia",
  "São Cristóvão e Nevis",
  "São Vicente e Granadinas",
  "Suriname",
  "Trinidad e Tobago",
  "Uruguai",
  "Venezuela",
];

function TagInput({
  value,
  onChange,
  suggestions,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  const add = (item: string) => {
    if (!value.includes(item)) onChange([...value, item]);
    setQuery("");
  };
  const remove = (item: string) => onChange(value.filter((v) => v !== item));
  const toggle = (item: string) => (value.includes(item) ? remove(item) : add(item));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className={cx(
          "flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-[#D0D5DD] bg-white px-3.5 py-2 transition-colors shadow-xs",
          open && "border-[#0C8525] ring-2 ring-[#0C8525]/20",
        )}
        onClick={() => setOpen(true)}
        onKeyDown={() => setOpen(true)}
        role="textbox"
        tabIndex={0}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-utility-brand-200 bg-utility-brand-50 py-0.5 pl-2.5 pr-1.5 text-xs font-semibold text-utility-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(tag);
              }}
              className="flex size-4 items-center justify-center rounded-full transition-colors hover:bg-utility-brand-100"
            >
              <XClose className="size-2.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="min-w-[120px] flex-1 bg-transparent text-sm font-normal leading-5 text-[#10181B] outline-none placeholder:text-[#667085]"
          placeholder={value.length === 0 ? (placeholder ?? "Buscar...") : "Adicionar..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && query === "" && value.length > 0) remove(value[value.length - 1]);
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && filtered.length > 0) {
              e.preventDefault();
              toggle(filtered[0]);
            }
          }}
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-secondary bg-primary shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-tertiary">Nenhum país encontrado.</div>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((item) => {
                const checked = value.includes(item);
                return (
                  <li key={item}>
                    <button
                      type="button"
                      className={cx(
                        "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                        checked ? "bg-brand-primary_alt text-brand-secondary" : "text-secondary hover:bg-brand-primary_alt hover:text-brand-secondary",
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggle(item);
                      }}
                    >
                      <span
                        className={cx(
                          "flex size-4 items-center justify-center rounded border",
                          checked ? "border-[#0C8525] bg-[#10B132]" : "border-[#D0D5DD] bg-white",
                        )}
                      >
                        {checked ? (
                          <span className="block h-2 w-2 rounded-sm bg-white" />
                        ) : null}
                      </span>
                      <span>{item}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function hasNumericValue(value: number | undefined) {
  return value !== undefined && !Number.isNaN(value);
}

interface SectionDef {
  id: string;
  label: string;
  description: string;
  icon: IconComp;
  mandatory: boolean;
  totalFields: number;
  getCompleted: (f: AssessmentFormData) => number;
}

const SECTIONS: SectionDef[] = [
  {
    id: "perfil",
    label: "Perfil do negócio",
    description: "Dados básicos",
    icon: Building07,
    mandatory: true,
    totalFields: 9,
    getCompleted: (f) =>
      [
        !!f.merchant_name.trim(),
        !!f.vertical,
        !!f.volume_mensal,
        !!f.moeda,
        f.ticket_medio > 0,
        !!f.modelo_negocio,
        hasNumericValue(f.pct_volume_cartao),
        hasNumericValue(f.pct_volume_pix),
        hasNumericValue(f.pct_volume_apms),
      ].filter(Boolean).length,
  },
  {
    id: "kpis",
    label: "KPIs de Fraude",
    description: "Dados de pagamento",
    icon: BarChart01,
    mandatory: true,
    totalFields: 4,
    getCompleted: (f) =>
      [
        f.taxa_aprovacao > 0,
        hasNumericValue(f.taxa_chargeback),
        hasNumericValue(f.taxa_decline),
        !!f.solucao_atual,
      ].filter(Boolean).length,
  },
  {
    id: "avancadas",
    label: "Métricas avançadas",
    description: "Indicadores adicionais",
    icon: TrendUp02,
    mandatory: false,
    totalFields: 3,
    getCompleted: (f) =>
      [
        f.pct_revisao_manual != null && f.pct_revisao_manual > 0,
        f.challenge_rate_3ds != null && f.challenge_rate_3ds > 0,
        f.taxa_false_decline != null && f.taxa_false_decline > 0,
      ].filter(Boolean).length,
  },
  {
    id: "dores",
    label: "Contexto",
    description: "Dados de pagamento",
    icon: Target04,
    mandatory: false,
    totalFields: 2,
    getCompleted: (f) => [f.dores.length > 0, f.origem_fraude.length > 0].filter(Boolean).length,
  },
  {
    id: "capacidades",
    label: "Capacidades",
    description: "Dados de pagamento",
    icon: Tool01,
    mandatory: false,
    totalFields: 4,
    getCompleted: (f) =>
      [
        !!f.device_fingerprinting,
        !!f.monitora_behavioral_signals,
        !!f.validacao_identidade_onboarding,
        !!f.tem_regras_customizadas,
      ].filter(Boolean).length,
  },
  {
    id: "contexto",
    label: "Contexto Internacional",
    description: "Dados de pagamento",
    icon: Globe01,
    mandatory: false,
    totalFields: 2,
    getCompleted: (f) => [f.opera_crossborder !== undefined, f.tem_programa_fidelidade !== undefined].filter(Boolean).length,
  },
];

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  optionalLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { label: string; value: string }[];
  placeholder?: string;
  optionalLabel?: string;
}) {
  const normalized =
    typeof options[0] === "string"
      ? (options as string[]).map((o) => ({ label: o, value: o }))
      : (options as { label: string; value: string }[]);
  return (
    <div className="space-y-1.5">
      {label ? (
        <label className={WIZARD_FIELD_LABEL_CLASS}>
          {label}
          {optionalLabel ? <span className="ml-1 text-xs font-normal text-[#667085]">{optionalLabel}</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <select
          className={cx(
            WIZARD_SELECT_CLASS,
            value ? "text-[#10181B]" : "text-[#667085]",
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {normalized.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className={WIZARD_FIELD_LABEL_CLASS}>
        {label}
        {required ? <span className={WIZARD_FIELD_REQUIRED_CLASS}> *</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={WIZARD_INPUT_CLASS}
      />
    </div>
  );
}

function PctInput({
  value,
  onChange,
  placeholder,
  highlight,
}: {
  value: number | string;
  onChange: (v: number) => void;
  placeholder?: string;
  highlight?: boolean;
}) {
  const [raw, setRaw] = useState(value === 0 || value === "" ? "" : String(value));

  useEffect(() => {
    if (value === 0 || value === "") {
      setRaw("");
      return;
    }
    const numVal = typeof value === "string" ? parseFloat(value) : value;
    const numRaw = parseFloat(raw);
    if (!raw.endsWith(".") && numVal !== numRaw) setRaw(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder ?? "0"}
        className={cx(
          WIZARD_INPUT_WITH_SUFFIX_CLASS,
          highlight && "border-[#FDA29B] bg-[#FEF3F2] focus:border-[#FDA29B] focus:ring-[#F04438]/20",
        )}
        value={raw}
        onChange={(e) => {
          const normalized = e.target.value.replace(",", ".");
          if (!/^(\d{0,3}\.?\d{0,2})?$/.test(normalized)) return;
          setRaw(normalized);
          const parsed = parseFloat(normalized);
          onChange(Number.isNaN(parsed) ? 0 : Math.min(parsed, 100));
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#667085]">%</span>
    </div>
  );
}

function SectionCard({
  id,
  label,
  badge,
  children,
}: {
  id: string;
  label: string;
  badge?: "mandatory" | "optional";
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={WIZARD_SECTION_CLASS}>
      <div className={WIZARD_SECTION_HEADER_CLASS}>
        <h2 className={WIZARD_SECTION_TITLE_CLASS}>{label}</h2>
        <span
          className={cx(
            WIZARD_SECTION_BADGE_CLASS,
            badge === "mandatory" ? "bg-[#F8F9FC] text-[#363F72]" : "bg-[#F8F9FC] text-[#363F72]",
          )}
        >
          {badge === "mandatory" ? "Obrigatório" : "Desejável"}
        </span>
      </div>
      <div className={WIZARD_SECTION_BODY_CLASS}>{children}</div>
    </section>
  );
}

function NewAssessmentForm() {
  const router = useRouter();
  const t = useTranslations("calculadora.new");
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [formData, setFormData] = useState<AssessmentFormData | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(editId);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeSection, setActiveSection] = useState("perfil");
  const [notesOpen, setNotesOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const defaults = await getDefaultFormData();
      if (editId) {
        const existing = await getAssessmentById(editId);
        if (existing) {
          const { id: _id, created_at: _c, updated_at: _u, ...data } = existing;
          void _id;
          void _c;
          void _u;
          const merged = { ...defaults, ...(data as AssessmentFormData) };
          setFormData(merged);
          setAssessmentId(existing.id);
          return;
        }
      }
      setFormData(defaults);
    }
    void init();
  }, [editId]);

  const saveAsDraft = useCallback(async () => {
    if (!formData || !formData.merchant_name.trim()) return;
    setIsSaving(true);
    if (assessmentId) {
      await updateAssessment(assessmentId, { ...formData, status: "draft" });
    } else {
      const created = await createAssessment({ ...formData, status: "draft" });
      if (created) setAssessmentId(created.id);
    }
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 600);
  }, [assessmentId, formData]);

  useEffect(() => {
    if (!formData) return;
    const timeout = setTimeout(() => {
      if (formData.merchant_name.trim()) saveAsDraft();
    }, 5000);
    return () => clearTimeout(timeout);
  }, [formData, saveAsDraft]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [formData]);

  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const updateField = <K extends keyof AssessmentFormData>(field: K, value: AssessmentFormData[K]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === "taxa_aprovacao") next.taxa_decline = Math.max(0, parseFloat((100 - (value as number)).toFixed(1)));
      if (field === "taxa_decline") next.taxa_aprovacao = Math.max(0, parseFloat((100 - (value as number)).toFixed(1)));
      return next;
    });
  };

  const updateVolumeSplit = (
    field: "pct_volume_cartao" | "pct_volume_pix" | "pct_volume_apms",
    rawValue: number,
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const value = Math.max(0, Math.min(100, rawValue));
      const next = { ...prev, [field]: value };
      if (field === "pct_volume_cartao") {
        const pix = Math.max(0, 100 - value);
        next.pct_volume_pix = pix;
        next.pct_volume_apms = 0;
      } else if (field === "pct_volume_pix") {
        const cartao = Math.max(0, Math.min(100, next.pct_volume_cartao ?? 0));
        const apms = Math.max(0, 100 - cartao - value);
        next.pct_volume_apms = apms;
      } else {
        const cartao = Math.max(0, Math.min(100, next.pct_volume_cartao ?? 0));
        const pix = Math.max(0, 100 - cartao - value);
        next.pct_volume_pix = pix;
      }
      return next;
    });
  };

  const toggleArray = <T extends string>(field: "dores" | "origem_fraude", value: T) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const current = prev[field] as T[];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const finalData = { ...formData, status: "complete" as const };
      let id = assessmentId;
      if (assessmentId) {
        await updateAssessment(assessmentId, finalData);
      } else {
        const created = await createAssessment(finalData);
        if (created) id = created.id;
      }
      if (id) router.push(`/calculadora/${id}`);
      else throw new Error("ID não encontrado após salvar.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao gerar relatório.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!formData) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        <LoadingIndicator type="line-spinner" size="md" label="A carregar formulário..." />
      </div>
    );
  }

  const isFormValid =
    !!formData.merchant_name.trim() &&
    !!formData.vertical &&
    !!formData.volume_mensal &&
    !!formData.moeda &&
    formData.ticket_medio > 0 &&
    !!formData.modelo_negocio &&
    hasNumericValue(formData.pct_volume_cartao) &&
    hasNumericValue(formData.pct_volume_pix) &&
    hasNumericValue(formData.pct_volume_apms) &&
    formData.taxa_aprovacao > 0 &&
    hasNumericValue(formData.taxa_chargeback) &&
    hasNumericValue(formData.taxa_decline) &&
    !!formData.solucao_atual;

  const warnings: string[] = [];
  if (formData.taxa_chargeback > 0 && formData.taxa_aprovacao > 0 && formData.taxa_chargeback > formData.taxa_aprovacao) {
    warnings.push("Taxa de chargeback não pode ser maior que a taxa de aprovação.");
  }

  const pageTitle = formData.merchant_name.trim() || t("newAssessmentDefault");
  const currencyMeta = getCurrencyMeta(formData.moeda ?? DEFAULT_CURRENCY_CODE);

  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <div className={WIZARD_PAGE_SHELL_CLASS}>
        <CalculadoraPageBreadcrumbs
          className="mb-10"
          items={[
            { label: t("breadcrumbCalculadora"), href: "/calculadora/historico" },
            { label: t("breadcrumbAnalise"), href: "/calculadora/new" },
            { label: pageTitle, current: true },
          ]}
        />

        <div className={WIZARD_PAGE_HEADER_CLASS}>
          <div className="min-w-[320px] flex-1">
            <h1 className={WIZARD_PAGE_TITLE_CLASS}>{pageTitle}</h1>
            <p className={WIZARD_PAGE_SUBTITLE_CLASS}>Preencha os dados abaixo para calcular o ROI e acessar aos insights</p>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-[#667085]">
                {isSaving ? "Salvando..." : `Salvo às ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            )}
            <Button
              type="button"
              onClick={() => void saveAsDraft()}
              isDisabled={isSaving}
              size="md"
              color="tertiary"
              iconLeading={Save01}
              className="bg-white ring-1 ring-secondary ring-inset"
            >
              Salvar rascunho
            </Button>
          </div>
        </div>

        <div className={WIZARD_PAGE_GRID_CLASS}>
        <div className="min-w-0 flex-1 space-y-6">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF3F2] p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D92D20]" />
              <p className="text-sm font-medium text-[#B42318]">{w}</p>
            </div>
          ))}

          <SectionCard id="perfil" label="Perfil do negócio" badge="mandatory">
            <TextField
              label="Nome do Merchant / Partner"
              placeholder="Ex: Americanas, Magazine Luiza..."
              value={formData.merchant_name}
              onChange={(v) => updateField("merchant_name", v)}
              required
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormSelect
                label="Vertical"
                value={formData.vertical}
                onChange={(v) => updateField("vertical", v as Vertical)}
                options={VERTICALS}
              />
              <FormSelect
                label="Modelo de Negócio"
                value={formData.modelo_negocio}
                onChange={(v) => updateField("modelo_negocio", v as BusinessModel)}
                options={BUSINESS_MODELS}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <FormSelect
                label="Volume transaccional"
                value={formData.volume_mensal}
                onChange={(v) => updateField("volume_mensal", v as VolumeRange)}
                options={[
                  { label: "< 10k transações/mês", value: "< 10k" },
                  { label: "10k–50k transações/mês", value: "10k–50k" },
                  { label: "50k–200k transações/mês", value: "50k–200k" },
                  { label: "200k–1M transações/mês", value: "200k–1M" },
                  { label: "> 1M transações/mês", value: "> 1M" },
                ]}
              />
              <FormSelect
                label="Moeda de operação"
                value={formData.moeda ?? DEFAULT_CURRENCY_CODE}
                onChange={(v) => updateField("moeda", v)}
                options={CURRENCY_OPTIONS.map((opt) => ({ label: opt.label, value: opt.code }))}
              />
              <div className="space-y-1.5">
                <label className={WIZARD_FIELD_LABEL_CLASS}>
                  Ticket Médio <span className={WIZARD_FIELD_REQUIRED_CLASS}>*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#667085]">
                    {currencyMeta.prefix}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    className={WIZARD_INPUT_WITH_PREFIX_CLASS}
                    value={formData.ticket_medio || ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(",", ".");
                      if (/^\d*\.?\d*$/.test(v)) updateField("ticket_medio", parseFloat(v) || 0);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Volume cartão <span className="text-[#F04438]">*</span>
                </label>
                <PctInput
                  value={formData.pct_volume_cartao || ""}
                  onChange={(v) => updateVolumeSplit("pct_volume_cartao", v)}
                  placeholder="Ex: 40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Volume Pix <span className="text-[#F04438]">*</span>
                </label>
                <PctInput
                  value={formData.pct_volume_pix ?? ""}
                  onChange={(v) => updateVolumeSplit("pct_volume_pix", v || 0)}
                  placeholder="Ex: 40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Volume APMs <span className="text-[#F04438]">*</span>
                </label>
                <PctInput
                  value={formData.pct_volume_apms ?? ""}
                  onChange={(v) => updateVolumeSplit("pct_volume_apms", v || 0)}
                  placeholder="Ex: 20"
                />
              </div>
            </div>
            {(formData.pct_volume_cartao || 0) + (formData.pct_volume_pix || 0) + (formData.pct_volume_apms || 0) > 100 && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF3F2] p-4 text-sm text-[#B42318]">
                A soma de Cartão + Pix + APMs não deve exceder 100%.
              </div>
            )}
          </SectionCard>

          <SectionCard id="kpis" label="KPIs de Fraude" badge="mandatory">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#344043]">
                Solução de antifraude <span className="text-[#F04438]">*</span>
              </label>
              <FormSelect
                label=""
                value={formData.solucao_atual}
                onChange={(v) => updateField("solucao_atual", v as CurrentSolution)}
                options={SOLUTIONS}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Taxa de aprovação <span className="text-[#F04438]">*</span>
                </label>
                <PctInput value={formData.taxa_aprovacao || ""} onChange={(v) => updateField("taxa_aprovacao", v)} placeholder="Ex: 85" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Taxa de reprovação <span className="text-[#F04438]">*</span>
                </label>
                <PctInput value={formData.taxa_decline || ""} onChange={(v) => updateField("taxa_decline", v)} placeholder="Ex: 15" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Taxa de chargeback <span className="text-[#F04438]">*</span>
                </label>
                <PctInput
                  value={formData.taxa_chargeback || ""}
                  onChange={(v) => updateField("taxa_chargeback", v)}
                  placeholder="Ex: 0.80"
                  highlight={formData.taxa_chargeback > 1}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard id="avancadas" label="Métricas avançadas" badge="optional">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Revisão Manual
                </label>
                <PctInput value={formData.pct_revisao_manual ?? ""} onChange={(v) => updateField("pct_revisao_manual", v || undefined)} placeholder="Ex: 5" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Challenge Rate 3DS
                </label>
                <PctInput value={formData.challenge_rate_3ds ?? ""} onChange={(v) => updateField("challenge_rate_3ds", v || undefined)} placeholder="Ex: 20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#344043]">
                  (%) Taxa de false decline
                </label>
                <PctInput value={formData.taxa_false_decline ?? ""} onChange={(v) => updateField("taxa_false_decline", v || undefined)} placeholder="Ex: 3" />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-[#EAECEE] bg-[#F9FAFB] p-4">
              <InfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#98A2B3]" />
              <p className="text-xs leading-relaxed text-[#667085]">
                Quanto mais dados fornecidos, mais preciso e personalizado será o diagnóstico gerado para o merchant.
              </p>
            </div>
          </SectionCard>

          <SectionCard id="dores" label="Contexto" badge="optional">
            <div>
              <p className="mb-3 text-sm font-semibold text-[#344043]">
                Principal dor hoje <span className="text-[#F04438]">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {PAINS.map((pain) => (
                  <button
                    key={pain}
                    type="button"
                    onClick={() => toggleArray("dores", pain)}
                    className={cx(
                      "rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all",
                      formData.dores.includes(pain)
                        ? "border-[#10B132] bg-[#E4FBE9] text-[#0C8525]"
                        : "border-[#D0D5D7] bg-white text-[#475456] hover:border-[#10B132] hover:text-[#10B132]",
                    )}
                  >
                    {pain}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-[#EAECEE] pt-6">
              <p className="mb-1 text-sm font-semibold text-[#344043]">
                Origem principal da fraude
                <span className="ml-2 text-xs font-normal text-[#667085]">(opcional — selecione todas que se aplicam)</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {FRAUD_ORIGINS.map((origin) => (
                  <button
                    key={origin}
                    type="button"
                    onClick={() => toggleArray("origem_fraude", origin)}
                    className={cx(
                      "rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all",
                      formData.origem_fraude.includes(origin)
                        ? "border-[#F04438] bg-[#FEF3F2] text-[#D92D20]"
                        : "border-[#D0D5D7] bg-white text-[#475456] hover:border-[#F04438] hover:text-[#D92D20]",
                    )}
                  >
                    {origin}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard id="capacidades" label="Capacidades" badge="optional">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {(
                [
                  ["device_fingerprinting", "Device fingerprinting?", ["Sim", "Não", "Não sei"]],
                  ["monitora_behavioral_signals", "Behavior signal?", ["Sim", "Não", "Não sei"]],
                  ["validacao_identidade_onboarding", "Biometria no onboarding?", ["Sim", "Não", "Parcial"]],
                  ["tem_regras_customizadas", "Regras customizadas?", ["Sim", "Não", "Não sei"]],
                ] as [keyof AssessmentFormData, string, string[]][]
              ).map(([field, lbl, opts]) => (
                <FormSelect
                  key={field}
                  label={lbl}
                  optionalLabel="(opcional)"
                  value={(formData[field] as string) ?? ""}
                  onChange={(v) => updateField(field, v as YesNoUnknown | YesNoPartial)}
                  options={opts}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard id="contexto" label="Contexto Internacional" badge="optional">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormSelect
                label="Opera Cross-Border?"
                optionalLabel="(opcional)"
                value={formData.opera_crossborder !== undefined ? String(formData.opera_crossborder) : ""}
                onChange={(v) => updateField("opera_crossborder", v === "true")}
                options={[
                  { label: "Sim", value: "true" },
                  { label: "Não", value: "false" },
                ]}
              />
              <FormSelect
                label="Tem Programa de Fidelidade?"
                optionalLabel="(opcional)"
                value={formData.tem_programa_fidelidade !== undefined ? String(formData.tem_programa_fidelidade) : ""}
                onChange={(v) => updateField("tem_programa_fidelidade", v === "true")}
                options={[
                  { label: "Sim", value: "true" },
                  { label: "Não", value: "false" },
                ]}
              />
            </div>
            {formData.opera_crossborder && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#344043]">Países de operação <span className="ml-1 text-xs font-normal text-[#667085]">(opcional)</span></label>
                <p className="mb-2 text-xs text-[#667085]">Selecione todos os países onde o merchant opera.</p>
                <TagInput
                  value={
                    formData.crossborder_paises
                      ? formData.crossborder_paises
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : []
                  }
                  onChange={(tags) => updateField("crossborder_paises", tags.join(", "))}
                  suggestions={COUNTRIES}
                  placeholder="Buscar país..."
                />
              </div>
            )}
          </SectionCard>
        </div>

        <aside className={WIZARD_SIDEBAR_CLASS}>
          {SECTIONS.map((s) => (
            <ProgressCard
              key={s.id}
              icon={s.icon}
              title={s.label}
              description={s.description}
              completedCount={s.getCompleted(formData)}
              totalCount={s.totalFields}
              isMandatory={s.mandatory}
              isActive={activeSection === s.id}
              onClick={() => scrollToSection(s.id)}
            />
          ))}
          <div className="space-y-3 rounded-2xl border border-[#D0D5D7] bg-white p-4">
            {submitError && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF3F2] p-3 text-sm text-[#B42318]">
                {submitError}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!isFormValid || isSubmitting}
              className={cx(
                "flex h-11 w-full items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-all",
                isFormValid && !isSubmitting
                  ? "bg-[#0C8525] text-white hover:bg-[#0A7420]"
                  : "cursor-not-allowed bg-[#F2F4F6] text-[#667085]",
              )}
            >
              {isSubmitting ? <LoadingIndicator type="line-spinner" size="sm" /> : <ArrowLeft className="h-5 w-5 rotate-90" />}
              Gerar relatório
            </button>
            <p className="text-center text-sm font-semibold text-[#10181B]">
              {isFormValid ? "Os dados obrigatórios já permitem gerar a análise" : "Preencha os dados obrigatórios para habilitar a análise"}
            </p>
          </div>
          <div className="rounded-xl border border-[#D0D5D7] bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#344043]">
                <InfoCircle className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-[#344043]">Sobre a análise</h3>
                <p className="text-xs leading-5 text-[#475456]">
                  Os dados obrigatórios são suficientes para gerar um score de risco. Dados adicionais enriquecem a análise.
                </p>
              </div>
            </div>
          </div>
        </aside>
        </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {notesOpen && (
          <div className="w-80 overflow-hidden rounded-2xl border border-[#D0D5D7] bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-[#EAECEE] bg-[#F9FAFB] px-4 py-3">
              <div className="flex items-center gap-2">
                <Annotation className="h-4 w-4 text-[#475456]" />
                <span className="text-sm font-semibold text-[#10181B]">Notas do Comercial</span>
              </div>
              <CloseButton size="sm" label="Fechar" onClick={() => setNotesOpen(false)} />
            </div>
            <div className="p-3">
              <TextArea
                placeholder="Ex: Merchant a crescer 30%/mês, apresentação para CFO na próxima semana..."
                value={formData.notas_comercial ?? ""}
                onChange={(v) => updateField("notas_comercial", v)}
                rows={6}
                className="[&_[data-slot=textarea]]:text-sm"
              />
              <p className="mt-1.5 text-xs text-[#667085]">Contexto qualitativo, não aparece no relatório final.</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setNotesOpen((o) => !o)}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#D0D5D7] bg-white text-[#667085] shadow-lg transition-all duration-200 hover:border-[#10B132] hover:text-[#10B132] hover:shadow-xl"
          aria-label="Notas do comercial"
          title="Notas do Comercial"
        >
          <Annotation className="h-5 w-5" />
        </button>
      </div>
      </div>
    </div>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-secondary">
          <LoadingIndicator type="line-spinner" size="md" />
        </div>
      }
    >
      <NewAssessmentForm />
    </Suspense>
  );
}
