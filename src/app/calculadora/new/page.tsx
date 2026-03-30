"use client";

import type { ComponentType, FC, SVGProps } from "react";
import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Annotation,
  ArrowLeft,
  BarChart01,
  Building07,
  Globe01,
  InfoCircle,
  Save01,
  Send01,
  Target04,
  Tool01,
  XClose,
} from "@untitledui/icons";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { LoadingIndicator } from "@/components/application/loading-indicators/loading-indicator";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { TextArea } from "@/components/base/textarea/textarea";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
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
import { cx } from "@/utils/cx";
import { ProgressCard } from "../_components/progress-card";

type IconComp = ComponentType<SVGProps<SVGSVGElement>>;
const asFeatured = (Icon: IconComp) => Icon as FC<{ className?: string }>;

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
const VOLUME_RANGES: VolumeRange[] = ["< 10k", "10k–50k", "50k–200k", "200k–1M", "> 1M"];
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
  "Brasil",
  "Argentina",
  "México",
  "Chile",
  "Colômbia",
  "Peru",
  "Uruguai",
  "Paraguai",
  "Bolívia",
  "Equador",
  "Venezuela",
  "Estados Unidos",
  "Canadá",
  "Reino Unido",
  "Espanha",
  "Portugal",
  "França",
  "Alemanha",
  "Itália",
  "Países Baixos",
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
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()) && !value.includes(s))
    : suggestions.filter((s) => !value.includes(s)).slice(0, 8);

  const add = (item: string) => {
    if (!value.includes(item)) onChange([...value, item]);
    setQuery("");
    setOpen(false);
  };
  const remove = (item: string) => onChange(value.filter((v) => v !== item));

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
          "flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-secondary bg-secondary px-3 py-2 transition-all ring-inset",
          open && "border-border-brand bg-primary ring-2 ring-border-brand",
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
          className="min-w-[120px] flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder"
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
              add(filtered[0]);
            }
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-secondary bg-primary shadow-lg">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm text-secondary transition-colors hover:bg-brand-primary_alt hover:text-brand-secondary"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(item);
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
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
    label: "Perfil do Negócio",
    description: "Vertical, volume e ticket médio",
    icon: Building07,
    mandatory: true,
    totalFields: 5,
    getCompleted: (f) =>
      [!!f.merchant_name.trim(), !!f.vertical, !!f.volume_mensal, f.ticket_medio > 0, !!f.modelo_negocio].filter(Boolean).length,
  },
  {
    id: "kpis",
    label: "KPIs de Fraude",
    description: "Taxas e métricas atuais",
    icon: BarChart01,
    mandatory: true,
    totalFields: 4,
    getCompleted: (f) =>
      [
        f.taxa_aprovacao > 0,
        f.taxa_chargeback >= 0 && f.taxa_chargeback > 0,
        f.taxa_decline >= 0 && f.taxa_decline > 0,
        !!f.solucao_atual,
      ].filter(Boolean).length,
  },
  {
    id: "avancadas",
    label: "Métricas Avançadas",
    description: "Dados opcionais de enriquecimento",
    icon: BarChart01,
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
    label: "Dores & Contexto",
    description: "Problemas atuais e origem de fraude",
    icon: Target04,
    mandatory: true,
    totalFields: 2,
    getCompleted: (f) => [f.dores.length > 0, f.origem_fraude.length > 0].filter(Boolean).length,
  },
  {
    id: "capacidades",
    label: "Capacidades Técnicas",
    description: "Tecnologias e controles ativos",
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
    description: "Cross-border e programa de fidelidade",
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { label: string; value: string }[];
  placeholder?: string;
}) {
  const normalized =
    typeof options[0] === "string"
      ? (options as string[]).map((o) => ({ label: o, value: o }))
      : (options as { label: string; value: string }[]);
  return (
    <NativeSelect
      label={label}
      options={[{ label: placeholder, value: "" }, ...normalized]}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
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
          "h-11 w-full rounded-xl border bg-secondary px-3 pr-9 text-sm text-primary shadow-xs ring-1 ring-primary ring-inset transition placeholder:text-placeholder focus:bg-primary focus:outline-hidden focus:ring-2 focus:ring-border-brand",
          highlight ? "border-error-300 bg-error-primary" : "border-secondary",
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
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-quaternary">%</span>
    </div>
  );
}

function SectionCard({
  id,
  icon: Icon,
  label,
  description,
  badge,
  children,
}: {
  id: string;
  icon: IconComp;
  label: string;
  description: string;
  badge?: "mandatory" | "optional";
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[148px] overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs ring-1 ring-secondary ring-inset"
    >
      <div className="flex items-center justify-between border-b border-secondary px-8 py-6">
        <div className="flex items-center gap-3">
          <FeaturedIcon icon={asFeatured(Icon)} color="brand" theme="gradient" size="md" />
          <div>
            <h2 className="text-base font-semibold text-primary">{label}</h2>
            <p className="text-xs text-tertiary">{description}</p>
          </div>
        </div>
        {badge === "mandatory" && (
          <Badge type="pill-color" color="error" size="sm">
            Obrigatório
          </Badge>
        )}
        {badge === "optional" && (
          <Badge type="pill-color" color="gray" size="sm">
            Desejável
          </Badge>
        )}
      </div>
      <div className="space-y-6 px-8 py-7">{children}</div>
    </section>
  );
}

function NewAssessmentForm() {
  const router = useRouter();
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
      if (editId) {
        const existing = await getAssessmentById(editId);
        if (existing) {
          const { id: _id, created_at: _c, updated_at: _u, ...data } = existing;
          void _id;
          void _c;
          void _u;
          setFormData(data as AssessmentFormData);
          setAssessmentId(existing.id);
          return;
        }
      }
      const defaults = await getDefaultFormData();
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
    const t = setTimeout(() => {
      if (formData.merchant_name.trim()) saveAsDraft();
    }, 5000);
    return () => clearTimeout(t);
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
    formData.ticket_medio > 0 &&
    !!formData.modelo_negocio &&
    formData.taxa_aprovacao > 0 &&
    formData.taxa_chargeback >= 0 &&
    formData.taxa_decline >= 0 &&
    !!formData.solucao_atual &&
    formData.dores.length > 0;

  const warnings: string[] = [];
  if (formData.taxa_chargeback > 0 && formData.taxa_aprovacao > 0 && formData.taxa_chargeback > formData.taxa_aprovacao) {
    warnings.push("Taxa de chargeback não pode ser maior que a taxa de aprovação.");
  }

  const pageTitle = formData.merchant_name.trim() || "Novo assessment";

  return (
    <div className="min-h-screen bg-secondary">
      <div className="sticky top-[100px] z-30 border-b border-secondary bg-primary shadow-xs">
        <div className="mx-auto flex h-auto max-w-[1400px] flex-col gap-3 px-6 py-3 md:h-16 md:flex-row md:items-center md:justify-between">
          <Breadcrumbs className="order-2 md:order-1">
            <Breadcrumbs.Item href="/calculadora">Calculadora</Breadcrumbs.Item>
            <Breadcrumbs.Item href="/calculadora/new">Análise</Breadcrumbs.Item>
            <Breadcrumbs.Item>{pageTitle}</Breadcrumbs.Item>
          </Breadcrumbs>
          <div className="order-1 flex items-center gap-3 md:order-2">
            <Button color="tertiary" size="sm" onClick={() => router.push("/calculadora")} iconLeading={ArrowLeft}>
              Histórico
            </Button>
            {lastSaved && (
              <span className="hidden text-xs text-quaternary md:inline">
                {isSaving ? "Salvando..." : `Salvo às ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            )}
            <Button color="secondary" size="sm" onClick={() => void saveAsDraft()} isDisabled={isSaving} iconLeading={Save01}>
              Salvar rascunho
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={() => void handleSubmit()}
              isDisabled={!isFormValid || isSubmitting}
              isLoading={isSubmitting}
              iconLeading={Send01}
            >
              Gerar relatório
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-start gap-8 px-6 py-8">
        <aside className="sticky top-[148px] order-2 w-72 shrink-0 space-y-3">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-quaternary">Seções do formulário</p>
          {SECTIONS.map((s) => (
            <ProgressCard
              key={s.id}
              title={s.label}
              description={s.description}
              completedCount={s.getCompleted(formData)}
              totalCount={s.totalFields}
              isMandatory={s.mandatory}
              isActive={activeSection === s.id}
              onClick={() => scrollToSection(s.id)}
            />
          ))}
          <div className="mt-4 rounded-xl border border-utility-brand-200 bg-utility-brand-50 p-4 ring-1 ring-utility-brand-100 ring-inset">
            <p className="mb-3 text-xs font-semibold text-utility-brand-800">Progresso geral</p>
            {(() => {
              const mandatory = SECTIONS.filter((s) => s.mandatory);
              const completed = mandatory.filter((s) => s.getCompleted(formData) === s.totalFields).length;
              const pct = Math.round((completed / mandatory.length) * 100);
              return (
                <>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                      {completed} de {mandatory.length} obrigatórias
                    </span>
                    <span className="text-xs font-semibold text-primary">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-primary_alt">
                    <div
                      className={cx("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-success-solid" : "bg-brand-solid")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className={cx("mt-2 text-xs", pct === 100 ? "font-semibold text-success-primary" : "text-brand-secondary")}>
                    {pct === 100 ? "Pronto para gerar o relatório" : "Preencha todas as seções obrigatórias"}
                  </p>
                </>
              );
            })()}
          </div>
        </aside>

        <div className="order-1 min-w-0 flex-1 space-y-6">
          <div>
            <h1 className="text-display-xs font-semibold text-primary md:text-xl">{pageTitle}</h1>
            <p className="mt-1 text-sm text-tertiary">Fraud Health Check — preencha os dados do merchant para gerar o diagnóstico.</p>
          </div>

          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-primary p-4 ring-1 ring-warning-100 ring-inset"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-fg-warning-secondary" />
              <p className="text-sm font-medium text-warning-primary">{w}</p>
            </div>
          ))}

          <SectionCard id="perfil" icon={Building07} label="Perfil do Negócio" description="Dados básicos para personalizar a análise" badge="mandatory">
            <Input
              label="Nome do Merchant / Partner"
              placeholder="Ex: Americanas, Magazine Luiza..."
              value={formData.merchant_name}
              onChange={(v) => updateField("merchant_name", v)}
              isRequired
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSelect
                label="Volume mensal de transações"
                value={formData.volume_mensal}
                onChange={(v) => updateField("volume_mensal", v as VolumeRange)}
                options={VOLUME_RANGES}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Ticket médio <span className="text-brand-secondary">*</span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-quaternary">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    className="h-11 w-full rounded-lg bg-primary pl-10 pr-3.5 text-md font-medium text-primary shadow-xs ring-1 ring-primary ring-inset transition placeholder:text-placeholder focus:outline-hidden focus:ring-2 focus:ring-border-brand"
                    value={formData.ticket_medio || ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(",", ".");
                      if (/^\d*\.?\d*$/.test(v)) updateField("ticket_medio", parseFloat(v) || 0);
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary">% volume em cartão</label>
              <p className="mb-2 text-xs text-quaternary">Usado para calcular o impacto financeiro das projeções de ROI.</p>
              <div className="w-full sm:w-1/2">
                <PctInput
                  value={formData.pct_volume_cartao || ""}
                  onChange={(v) => updateField("pct_volume_cartao", v)}
                  placeholder="Ex: 80"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard id="kpis" icon={BarChart01} label="KPIs de Fraude" description="Métricas obrigatórias do funil atual" badge="mandatory">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Taxa de aprovação <span className="text-brand-secondary">*</span>
                </label>
                <PctInput value={formData.taxa_aprovacao || ""} onChange={(v) => updateField("taxa_aprovacao", v)} placeholder="Ex: 85" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Taxa de decline <span className="text-brand-secondary">*</span>
                </label>
                <PctInput value={formData.taxa_decline || ""} onChange={(v) => updateField("taxa_decline", v)} placeholder="Ex: 15" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">
                  Taxa de chargeback <span className="text-brand-secondary">*</span>
                </label>
                <PctInput
                  value={formData.taxa_chargeback || ""}
                  onChange={(v) => updateField("taxa_chargeback", v)}
                  placeholder="Ex: 0.80"
                  highlight={formData.taxa_chargeback > 1}
                />
                {formData.taxa_chargeback > 1 && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-error-primary">
                    <AlertCircle className="size-3" />
                    Acima do limite de 1% das bandeiras
                  </p>
                )}
              </div>
              <FormSelect
                label="Solução antifraude atual"
                value={formData.solucao_atual}
                onChange={(v) => updateField("solucao_atual", v as CurrentSolution)}
                options={SOLUTIONS}
              />
            </div>
          </SectionCard>

          <SectionCard id="avancadas" icon={BarChart01} label="Métricas Avançadas" description="Dados opcionais — enriquecem o diagnóstico" badge="optional">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">% revisão manual (opcional)</label>
                <PctInput
                  value={formData.pct_revisao_manual ?? ""}
                  onChange={(v) => updateField("pct_revisao_manual", v || undefined)}
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">Challenge rate 3DS (opcional)</label>
                <PctInput
                  value={formData.challenge_rate_3ds ?? ""}
                  onChange={(v) => updateField("challenge_rate_3ds", v || undefined)}
                  placeholder="Ex: 20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary">Taxa de false decline (opcional)</label>
                <PctInput
                  value={formData.taxa_false_decline ?? ""}
                  onChange={(v) => updateField("taxa_false_decline", v || undefined)}
                  placeholder="Ex: 3"
                />
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-secondary bg-secondary p-4 ring-1 ring-primary ring-inset">
              <FeaturedIcon icon={InfoCircle} color="gray" theme="modern" size="sm" className="shrink-0" />
              <p className="text-xs leading-relaxed text-tertiary">
                Quanto mais dados fornecidos, mais preciso e personalizado será o diagnóstico gerado para o merchant.
              </p>
            </div>
          </SectionCard>

          <SectionCard id="dores" icon={Target04} label="Dores & Contexto" description="Problemas atuais e origem principal de fraude" badge="mandatory">
            <div>
              <p className="mb-3 text-sm font-semibold text-secondary">
                Principal dor hoje <span className="text-brand-secondary">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {PAINS.map((pain) => (
                  <button
                    key={pain}
                    type="button"
                    onClick={() => toggleArray("dores", pain)}
                    className={cx(
                      "rounded-xl px-4 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset transition-all",
                      formData.dores.includes(pain)
                        ? "bg-brand-solid text-white ring-brand-solid"
                        : "bg-primary text-secondary ring-primary hover:bg-brand-primary_alt hover:text-brand-secondary",
                    )}
                  >
                    {pain}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-secondary pt-6">
              <p className="mb-3 text-sm font-semibold text-secondary">
                Origem principal da fraude <span className="ml-2 text-xs font-normal text-quaternary">(opcional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {FRAUD_ORIGINS.map((origin) => (
                  <button
                    key={origin}
                    type="button"
                    onClick={() => toggleArray("origem_fraude", origin)}
                    className={cx(
                      "rounded-xl px-4 py-2 text-sm font-semibold shadow-xs ring-1 ring-inset transition-all",
                      formData.origem_fraude.includes(origin)
                        ? "bg-error-solid text-white ring-error-solid"
                        : "bg-primary text-secondary ring-primary hover:bg-error-primary hover:text-error-primary",
                    )}
                  >
                    {origin}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard id="capacidades" icon={Tool01} label="Capacidades Técnicas" description="Tecnologias e controles antifraude ativos" badge="optional">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {(
                [
                  ["device_fingerprinting", "Device fingerprinting?", ["Sim", "Não", "Não sei"]],
                  ["monitora_behavioral_signals", "Behavioral signals?", ["Sim", "Não", "Não sei"]],
                  ["validacao_identidade_onboarding", "Validação de identidade no onboarding?", ["Sim", "Não", "Parcial"]],
                  ["tem_regras_customizadas", "Regras de fraude customizadas?", ["Sim", "Não", "Não sei"]],
                ] as [keyof AssessmentFormData, string, string[]][]
              ).map(([field, lbl, opts]) => (
                <FormSelect
                  key={field}
                  label={`${lbl} (opcional)`}
                  value={(formData[field] as string) ?? ""}
                  onChange={(v) => updateField(field, v as YesNoUnknown | YesNoPartial)}
                  options={opts}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard id="contexto" icon={Globe01} label="Contexto Internacional" description="Cross-border e programa de fidelidade" badge="optional">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSelect
                label="Opera cross-border? (opcional)"
                value={formData.opera_crossborder !== undefined ? String(formData.opera_crossborder) : ""}
                onChange={(v) => updateField("opera_crossborder", v === "true")}
                options={[
                  { label: "Sim", value: "true" },
                  { label: "Não", value: "false" },
                ]}
              />
              <FormSelect
                label="Tem programa de fidelidade? (opcional)"
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
                <label className="mb-1.5 block text-sm font-medium text-secondary">Países de operação (opcional)</label>
                <p className="mb-2 text-xs text-quaternary">Selecione todos os países onde o merchant opera.</p>
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

          <div className="space-y-3 pb-12 pt-4">
            {submitError && (
              <div className="flex items-start gap-3 rounded-xl border border-error-200 bg-error-primary p-4 ring-1 ring-error-100 ring-inset">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-fg-error-secondary" />
                <p className="text-sm font-medium text-error-primary">{submitError}</p>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-quaternary">
                {isFormValid ? "Todos os campos obrigatórios preenchidos." : "Preencha todos os campos obrigatórios para continuar."}
              </p>
              <Button
                color="primary"
                size="md"
                onClick={() => void handleSubmit()}
                isDisabled={!isFormValid || isSubmitting}
                isLoading={isSubmitting}
                iconLeading={Send01}
              >
                Gerar relatório
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {notesOpen && (
          <div className="w-80 overflow-hidden rounded-2xl border border-secondary bg-primary shadow-lg ring-1 ring-secondary ring-inset">
            <div className="flex items-center justify-between border-b border-secondary bg-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <Annotation className="size-4 text-brand-secondary" />
                <span className="text-sm font-semibold text-primary">Notas do comercial</span>
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
              <p className="mt-1.5 text-[10px] text-quaternary">Contexto qualitativo — não aparece no relatório final.</p>
            </div>
          </div>
        )}
        <Button
          color="secondary"
          size="md"
          onClick={() => setNotesOpen((o) => !o)}
          className="rounded-full shadow-lg"
          iconLeading={Annotation}
          aria-label="Notas do comercial"
        />
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
