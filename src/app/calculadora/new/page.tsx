"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft, Info, Send, Save, Building2, BarChart3,
  Target, AlertCircle, Globe, Wrench, X, NotebookPen,
} from "lucide-react";
import {
  AssessmentFormData, Vertical, VolumeRange, BusinessModel,
  CurrentSolution, Pain, FraudOrigin, YesNoUnknown, YesNoPartial,
} from "@/lib/health-check/types";
import {
  createAssessment, updateAssessment, getAssessmentById, getDefaultFormData,
} from "@/lib/health-check/store";
import { ProgressCard } from "../_components/progress-card";

// ─── Constants ────────────────────────────────────────────────────────────────

const VERTICALS: Vertical[] = ["E-commerce", "Fintech", "Marketplace", "Delivery", "Digital Goods", "Travel", "Subscription", "Outro"];
const VOLUME_RANGES: VolumeRange[] = ["< 10k", "10k–50k", "50k–200k", "200k–1M", "> 1M"];
const BUSINESS_MODELS: BusinessModel[] = ["B2C", "B2B", "Marketplace (com sellers)", "Outro"];
const SOLUTIONS: CurrentSolution[] = ["Konduto", "ClearSale", "Cybersource", "SEON", "Kount", "Signifyd", "ThreatMetrix", "Nethone", "In-house", "Nenhuma", "Outra"];
const PAINS: Pain[] = ["Chargeback alto", "Muita revisão manual", "Aprovação baixa", "Fraude em crescimento", "Expansão para novos mercados", "Account Takeover (ATO)", "Compliance"];
const FRAUD_ORIGINS: FraudOrigin[] = ["Contas novas", "ATO (contas existentes)", "Friendly fraud / abuso de políticas"];
const COUNTRIES = ["Brasil", "Argentina", "México", "Chile", "Colômbia", "Peru", "Uruguai", "Paraguai", "Bolívia", "Equador", "Venezuela", "Estados Unidos", "Canadá", "Reino Unido", "Espanha", "Portugal", "França", "Alemanha", "Itália", "Países Baixos"];

// ─── Tag Input ─────────────────────────────────────────────────────────────────

function TagInput({ value, onChange, suggestions, placeholder }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[]; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()) && !value.includes(s))
    : suggestions.filter((s) => !value.includes(s)).slice(0, 8);

  const add = (item: string) => { if (!value.includes(item)) onChange([...value, item]); setQuery(""); setOpen(false); };
  const remove = (item: string) => onChange(value.filter((v) => v !== item));

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className={`min-h-[44px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border bg-gray-50 cursor-text transition-all ${open ? "border-brand-500 bg-white ring-2 ring-brand-500/10" : "border-gray-200 hover:border-gray-300"}`}
        onClick={() => setOpen(true)}
      >
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-700">
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); remove(tag); }} className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-brand-200 transition-colors">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          type="text" className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
          placeholder={value.length === 0 ? (placeholder ?? "Buscar...") : "Adicionar..."}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && query === "" && value.length > 0) remove(value[value.length - 1]);
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && filtered.length > 0) { e.preventDefault(); add(filtered[0]); }
          }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((item) => (
              <li key={item}>
                <button type="button" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors" onMouseDown={(e) => { e.preventDefault(); add(item); }}>
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

// ─── Sections config ──────────────────────────────────────────────────────────

interface SectionDef { id: string; label: string; description: string; icon: React.ElementType; mandatory: boolean; totalFields: number; getCompleted: (f: AssessmentFormData) => number; }

const SECTIONS: SectionDef[] = [
  { id: "perfil", label: "Perfil do Negócio", description: "Vertical, volume e ticket médio", icon: Building2, mandatory: true, totalFields: 5, getCompleted: (f) => [!!f.merchant_name.trim(), !!f.vertical, !!f.volume_mensal, f.ticket_medio > 0, !!f.modelo_negocio].filter(Boolean).length },
  { id: "kpis", label: "KPIs de Fraude", description: "Taxas e métricas atuais", icon: BarChart3, mandatory: true, totalFields: 4, getCompleted: (f) => [f.taxa_aprovacao > 0, f.taxa_chargeback >= 0 && f.taxa_chargeback > 0, f.taxa_decline >= 0 && f.taxa_decline > 0, !!f.solucao_atual].filter(Boolean).length },
  { id: "avancadas", label: "Métricas Avançadas", description: "Dados opcionais de enriquecimento", icon: BarChart3, mandatory: false, totalFields: 3, getCompleted: (f) => [f.pct_revisao_manual != null && f.pct_revisao_manual > 0, f.challenge_rate_3ds != null && f.challenge_rate_3ds > 0, f.taxa_false_decline != null && f.taxa_false_decline > 0].filter(Boolean).length },
  { id: "dores", label: "Dores & Contexto", description: "Problemas atuais e origem de fraude", icon: Target, mandatory: true, totalFields: 2, getCompleted: (f) => [f.dores.length > 0, f.origem_fraude.length > 0].filter(Boolean).length },
  { id: "capacidades", label: "Capacidades Técnicas", description: "Tecnologias e controles ativos", icon: Wrench, mandatory: false, totalFields: 4, getCompleted: (f) => [!!f.device_fingerprinting, !!f.monitora_behavioral_signals, !!f.validacao_identidade_onboarding, !!f.tem_regras_customizadas].filter(Boolean).length },
  { id: "contexto", label: "Contexto Internacional", description: "Cross-border e programa de fidelidade", icon: Globe, mandatory: false, totalFields: 2, getCompleted: (f) => [f.opera_crossborder !== undefined, f.tem_programa_fidelidade !== undefined].filter(Boolean).length },
];

// ─── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, required, optional, hint, children }: { label: string; required?: boolean; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}{" "}
        {required && <span className="text-error-500">*</span>}
        {optional && <span className="text-xs font-normal text-gray-400 ml-1">(opcional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function PctInput({ value, onChange, placeholder, highlight }: { value: number | string; onChange: (v: number) => void; placeholder?: string; highlight?: boolean }) {
  const [raw, setRaw] = useState(value === 0 || value === "" ? "" : String(value));

  useEffect(() => {
    if (value === 0 || value === "") { setRaw(""); return; }
    const numVal = typeof value === "string" ? parseFloat(value) : value;
    const numRaw = parseFloat(raw);
    if (!raw.endsWith(".") && numVal !== numRaw) setRaw(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text" inputMode="decimal" placeholder={placeholder ?? "0"}
        className={`w-full h-11 px-3 pr-9 rounded-xl border bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition ${highlight ? "border-error-300 bg-error-50" : "border-gray-200"}`}
        value={raw}
        onChange={(e) => {
          const normalized = e.target.value.replace(",", ".");
          if (!/^(\d{0,3}\.?\d{0,2})?$/.test(normalized)) return;
          setRaw(normalized);
          const parsed = parseFloat(normalized);
          onChange(isNaN(parsed) ? 0 : Math.min(parsed, 100));
        }}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold pointer-events-none">%</span>
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition appearance-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SectionCard({ id, icon: Icon, label, description, badge, children }: { id: string; icon: React.ElementType; label: string; description: string; badge?: "mandatory" | "optional"; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-[148px]">
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm shrink-0">
            <Icon className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{label}</h2>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        {badge === "mandatory" && <span className="text-[10px] bg-error-50 text-error-600 font-bold px-2.5 py-1 rounded-full border border-error-100 uppercase tracking-wider shrink-0">Obrigatório</span>}
        {badge === "optional" && <span className="text-[10px] bg-success-50 text-success-700 font-bold px-2.5 py-1 rounded-full border border-success-100 uppercase tracking-wider shrink-0">Desejável</span>}
      </div>
      <div className="px-8 py-7 space-y-6">{children}</div>
    </section>
  );
}

// ─── Main form ─────────────────────────────────────────────────────────────────

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

  // Initialise form data
  useEffect(() => {
    async function init() {
      if (editId) {
        const existing = await getAssessmentById(editId);
        if (existing) {
          const { id: _id, created_at: _c, updated_at: _u, ...data } = existing;
          void _id; void _c; void _u;
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

  // Auto-save every 5s
  useEffect(() => {
    if (!formData) return;
    const t = setTimeout(() => { if (formData.merchant_name.trim()) saveAsDraft(); }, 5000);
    return () => clearTimeout(t);
  }, [formData, saveAsDraft]);

  // IntersectionObserver for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setActiveSection(e.target.id); } },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => { const el = document.getElementById(id); if (el) observer.observe(el); });
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
      return { ...prev, [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
    });
  };

  const handleSubmit = async () => {
    if (!formData) return;
    setIsSubmitting(true); setSubmitError(null);
    try {
      const finalData = { ...formData, status: "complete" as const };
      let id = assessmentId;
      if (assessmentId) { await updateAssessment(assessmentId, finalData); }
      else { const created = await createAssessment(finalData); if (created) id = created.id; }
      if (id) router.push(`/calculadora/${id}`);
      else throw new Error("ID não encontrado após salvar.");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao gerar relatório.");
    } finally { setIsSubmitting(false); }
  };

  if (!formData) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
  }

  const isFormValid = !!formData.merchant_name.trim() && !!formData.vertical && !!formData.volume_mensal && formData.ticket_medio > 0 && !!formData.modelo_negocio && formData.taxa_aprovacao > 0 && formData.taxa_chargeback >= 0 && formData.taxa_decline >= 0 && !!formData.solucao_atual && formData.dores.length > 0;
  const warnings: string[] = [];
  if (formData.taxa_chargeback > 0 && formData.taxa_aprovacao > 0 && formData.taxa_chargeback > formData.taxa_aprovacao) warnings.push("Taxa de chargeback não pode ser maior que a taxa de aprovação.");

  const btnBase = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all";
  const btnPrimary = isFormValid && !isSubmitting ? `${btnBase} bg-brand-600 hover:bg-brand-700 text-white shadow-sm` : `${btnBase} bg-gray-100 text-gray-400 cursor-not-allowed`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub-bar */}
      <div className="sticky top-[100px] z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.push("/calculadora")} className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 -ml-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{formData.merchant_name.trim() || "Novo Assessment"}</p>
              <p className="text-xs text-gray-400 leading-tight">Fraud Health Check</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-gray-400 hidden md:block">
                {isSaving ? "Salvando..." : `Salvo às ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </span>
            )}
            <button type="button" onClick={saveAsDraft} disabled={isSaving} className={`${btnBase} border border-gray-200 text-gray-600 hover:bg-gray-50`}>
              <Save className="h-3.5 w-3.5" /> Salvar rascunho
            </button>
            <button type="button" disabled={!isFormValid || isSubmitting} onClick={handleSubmit} className={btnPrimary}>
              {isSubmitting ? <><div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />Gerando...</> : <><Send className="h-3.5 w-3.5" />Gerar Relatório</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 flex gap-8 items-start">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 sticky top-[148px] space-y-3 order-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Seções do formulário</p>
          {SECTIONS.map((s) => (
            <ProgressCard key={s.id} title={s.label} description={s.description} completedCount={s.getCompleted(formData)} totalCount={s.totalFields} isMandatory={s.mandatory} isActive={activeSection === s.id} onClick={() => scrollToSection(s.id)} />
          ))}
          <div className="mt-4 p-4 rounded-xl bg-brand-50 border border-brand-100">
            <p className="text-xs font-bold text-brand-800 mb-3">Progresso geral</p>
            {(() => {
              const mandatory = SECTIONS.filter((s) => s.mandatory);
              const completed = mandatory.filter((s) => s.getCompleted(formData) === s.totalFields).length;
              const pct = Math.round((completed / mandatory.length) * 100);
              return (
                <>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{completed} de {mandatory.length} obrigatórias</span>
                    <span className="text-xs font-bold text-brand-900">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-brand-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-success-500" : "bg-brand-600"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className={`text-xs mt-2 ${pct === 100 ? "text-success-700 font-semibold" : "text-brand-700"}`}>
                    {pct === 100 ? "✓ Pronto para gerar o relatório" : "Preencha todas as seções obrigatórias"}
                  </p>
                </>
              );
            })()}
          </div>
        </aside>

        {/* Form */}
        <div className="flex-1 min-w-0 space-y-6 order-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 border border-warning-200">
              <AlertCircle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
              <p className="text-sm text-warning-800 font-medium">{w}</p>
            </div>
          ))}

          {/* Seção 1 */}
          <SectionCard id="perfil" icon={Building2} label="Perfil do Negócio" description="Dados básicos para personalizar a análise" badge="mandatory">
            <Field label="Nome do Merchant / Partner" required>
              <input type="text" placeholder="Ex: Americanas, Magazine Luiza..." value={formData.merchant_name} onChange={(e) => updateField("merchant_name", e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition" />
            </Field>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Vertical" required>
                <SelectField value={formData.vertical} onChange={(v) => updateField("vertical", v as Vertical)} options={VERTICALS} placeholder="Selecione..." />
              </Field>
              <Field label="Modelo de Negócio" required>
                <SelectField value={formData.modelo_negocio} onChange={(v) => updateField("modelo_negocio", v as BusinessModel)} options={BUSINESS_MODELS} placeholder="Selecione..." />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Volume Mensal de Transações" required>
                <SelectField value={formData.volume_mensal} onChange={(v) => updateField("volume_mensal", v as VolumeRange)} options={VOLUME_RANGES.map((v) => v)} placeholder="Selecione..." />
              </Field>
              <Field label="Ticket Médio" required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm pointer-events-none">R$</span>
                  <input type="text" inputMode="decimal" placeholder="0,00"
                    className="w-full pl-10 h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition"
                    value={formData.ticket_medio || ""}
                    onChange={(e) => { const v = e.target.value.replace(",", "."); if (/^\d*\.?\d*$/.test(v)) updateField("ticket_medio", parseFloat(v) || 0); }} />
                </div>
              </Field>
            </div>
            <Field label="% Volume em Cartão" hint="Usado para calcular o impacto financeiro das projeções de ROI">
              <div className="w-1/2">
                <PctInput value={formData.pct_volume_cartao || ""} onChange={(v) => updateField("pct_volume_cartao", v)} placeholder="Ex: 80" />
              </div>
            </Field>
          </SectionCard>

          {/* Seção 2 */}
          <SectionCard id="kpis" icon={BarChart3} label="KPIs de Fraude" description="Métricas obrigatórias do funil atual" badge="mandatory">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Taxa de Aprovação" required>
                <PctInput value={formData.taxa_aprovacao || ""} onChange={(v) => updateField("taxa_aprovacao", v)} placeholder="Ex: 85" />
              </Field>
              <Field label="Taxa de Decline" required>
                <PctInput value={formData.taxa_decline || ""} onChange={(v) => updateField("taxa_decline", v)} placeholder="Ex: 15" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Taxa de Chargeback" required>
                <PctInput value={formData.taxa_chargeback || ""} onChange={(v) => updateField("taxa_chargeback", v)} placeholder="Ex: 0.80" highlight={formData.taxa_chargeback > 1} />
                {formData.taxa_chargeback > 1 && <p className="text-xs text-error-600 font-medium flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />Acima do limite de 1% das bandeiras</p>}
              </Field>
              <Field label="Solução Antifraude Atual" required>
                <SelectField value={formData.solucao_atual} onChange={(v) => updateField("solucao_atual", v as CurrentSolution)} options={SOLUTIONS} placeholder="Selecione..." />
              </Field>
            </div>
          </SectionCard>

          {/* Seção 3 */}
          <SectionCard id="avancadas" icon={BarChart3} label="Métricas Avançadas" description="Dados opcionais — enriquecem o diagnóstico" badge="optional">
            <div className="grid grid-cols-3 gap-5">
              <Field label="% Revisão Manual" optional><PctInput value={formData.pct_revisao_manual ?? ""} onChange={(v) => updateField("pct_revisao_manual", v || undefined)} placeholder="Ex: 5" /></Field>
              <Field label="Challenge Rate 3DS" optional><PctInput value={formData.challenge_rate_3ds ?? ""} onChange={(v) => updateField("challenge_rate_3ds", v || undefined)} placeholder="Ex: 20" /></Field>
              <Field label="Taxa de False Decline" optional><PctInput value={formData.taxa_false_decline ?? ""} onChange={(v) => updateField("taxa_false_decline", v || undefined)} placeholder="Ex: 3" /></Field>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">Quanto mais dados fornecidos, mais preciso e personalizado será o diagnóstico gerado para o merchant.</p>
            </div>
          </SectionCard>

          {/* Seção 4 */}
          <SectionCard id="dores" icon={Target} label="Dores & Contexto" description="Problemas atuais e origem principal de fraude" badge="mandatory">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Principal dor hoje <span className="text-error-500">*</span></p>
              <div className="flex flex-wrap gap-2">
                {PAINS.map((pain) => (
                  <button key={pain} type="button" onClick={() => toggleArray("dores", pain)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${formData.dores.includes(pain) ? "bg-brand-600 border-brand-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50"}`}>
                    {pain}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-1">Origem principal da fraude <span className="text-xs font-normal text-gray-400 ml-2">(opcional)</span></p>
              <div className="flex flex-wrap gap-2 mt-3">
                {FRAUD_ORIGINS.map((origin) => (
                  <button key={origin} type="button" onClick={() => toggleArray("origem_fraude", origin)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${formData.origem_fraude.includes(origin) ? "bg-error-600 border-error-600 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-error-300 hover:text-error-700 hover:bg-error-50"}`}>
                    {origin}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Seção 5 */}
          <SectionCard id="capacidades" icon={Wrench} label="Capacidades Técnicas" description="Tecnologias e controles antifraude ativos" badge="optional">
            <div className="grid grid-cols-2 gap-5">
              {([["device_fingerprinting", "Device Fingerprinting?", ["Sim", "Não", "Não sei"]], ["monitora_behavioral_signals", "Behavioral Signals?", ["Sim", "Não", "Não sei"]], ["validacao_identidade_onboarding", "Validação de Identidade no Onboarding?", ["Sim", "Não", "Parcial"]], ["tem_regras_customizadas", "Regras de Fraude Customizadas?", ["Sim", "Não", "Não sei"]]] as [keyof AssessmentFormData, string, string[]][]).map(([field, label, opts]) => (
                <Field key={field} label={label} optional>
                  <SelectField value={(formData[field] as string) ?? ""} onChange={(v) => updateField(field, v as YesNoUnknown | YesNoPartial)} options={opts} placeholder="Selecione..." />
                </Field>
              ))}
            </div>
          </SectionCard>

          {/* Seção 6 */}
          <SectionCard id="contexto" icon={Globe} label="Contexto Internacional" description="Cross-border e programa de fidelidade" badge="optional">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Opera Cross-Border?" optional>
                <SelectField value={formData.opera_crossborder !== undefined ? String(formData.opera_crossborder) : ""} onChange={(v) => updateField("opera_crossborder", v === "true")} options={["true", "false"]} placeholder="Selecione..." />
              </Field>
              <Field label="Tem Programa de Fidelidade?" optional>
                <SelectField value={formData.tem_programa_fidelidade !== undefined ? String(formData.tem_programa_fidelidade) : ""} onChange={(v) => updateField("tem_programa_fidelidade", v === "true")} options={["true", "false"]} placeholder="Selecione..." />
              </Field>
            </div>
            {formData.opera_crossborder && (
              <Field label="Países de operação" optional hint="Selecione todos os países onde o merchant opera">
                <TagInput value={formData.crossborder_paises ? formData.crossborder_paises.split(",").map((s) => s.trim()).filter(Boolean) : []} onChange={(tags) => updateField("crossborder_paises", tags.join(", "))} suggestions={COUNTRIES} placeholder="Buscar país..." />
              </Field>
            )}
          </SectionCard>

          {/* Footer CTA */}
          <div className="pt-4 pb-12 space-y-3">
            {submitError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-error-50 border border-error-200">
                <AlertCircle className="h-4 w-4 text-error-600 shrink-0 mt-0.5" />
                <p className="text-sm text-error-800 font-medium">{submitError}</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">{isFormValid ? "✓ Todos os campos obrigatórios preenchidos" : "Preencha todos os campos obrigatórios para continuar"}</p>
              <button type="button" disabled={!isFormValid || isSubmitting} onClick={handleSubmit}
                className={`inline-flex items-center gap-2 h-11 px-8 rounded-xl font-bold text-sm transition-all ${isFormValid && !isSubmitting ? "bg-brand-600 hover:bg-brand-700 text-white shadow-lg" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                {isSubmitting ? <><div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />Gerando...</> : <><Send className="h-4 w-4" />Gerar Relatório</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notes */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {notesOpen && (
          <div className="w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-bold text-gray-800">Notas do Comercial</span>
              </div>
              <button type="button" onClick={() => setNotesOpen(false)} className="h-6 w-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-3">
              <textarea rows={6} autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-400 focus:bg-white transition-all resize-none leading-relaxed"
                placeholder="Ex: Merchant crescendo 30%/mês, apresentação para CFO na próxima semana..."
                value={formData.notas_comercial ?? ""}
                onChange={(e) => updateField("notas_comercial", e.target.value)} />
              <p className="text-[10px] text-gray-400 mt-1.5">Contexto qualitativo — não aparece no relatório final</p>
            </div>
          </div>
        )}
        <button type="button" onClick={() => setNotesOpen((o) => !o)}
          className={`relative h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${notesOpen ? "bg-brand-600 text-white scale-95" : "bg-white border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-300"}`}
          title="Notas do Comercial">
          <NotebookPen className="h-5 w-5" />
          {(formData.notas_comercial ?? "").trim().length > 0 && !notesOpen && (
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-brand-500 border-2 border-white" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent" /></div>}>
      <NewAssessmentForm />
    </Suspense>
  );
}
