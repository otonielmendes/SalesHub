"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Download, TrendingUp, AlertCircle, ShieldCheck, Info, DollarSign, Users, CheckCircle2, XCircle } from "lucide-react";
import { KOIN_PERFORMANCE_DEFAULTS, getCostSettings } from "@/lib/health-check/benchmarks";
import { Assessment } from "@/lib/health-check/types";
import { getAssessmentById } from "@/lib/health-check/store";
import { generateDiagnostics, DiagnosticInsight } from "@/lib/health-check/diagnostic-rules";
import { calculateProjections } from "@/lib/health-check/projections";
import { formatCurrency, formatPercent, formatDate } from "@/lib/health-check/utils";
import { InsightCard } from "../_components/insight-card";

// ─── Health Score Ring ─────────────────────────────────────────────────────────

function HealthScoreRing({ score }: { score: number }) {
  const isGood = score >= 70;
  const isMid = score >= 40;
  const color = isGood ? "text-success-600" : isMid ? "text-warning-600" : "text-error-600";
  const bg = isGood ? "bg-success-50 border-success-200" : isMid ? "bg-warning-50 border-warning-200" : "bg-error-50 border-error-200";
  const label = isGood ? "Saudável" : isMid ? "Atenção" : "Crítico";

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl p-4 min-w-[100px] border-2 ${bg}`}>
      <span className={`text-4xl font-bold font-mono ${color}`}>{score}</span>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">/100</span>
      <span className={`text-xs font-bold mt-1.5 ${color}`}>{label}</span>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ title, icon: Icon, iconColor, today, koin, delta, deltaBg, highlight }: {
  title: string; icon: React.ElementType; iconColor: string;
  today: React.ReactNode; koin: React.ReactNode; delta: string; deltaBg?: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${highlight ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${highlight ? "text-green-400" : iconColor}`} />
          <span className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "text-gray-400" : "text-gray-500"}`}>{title}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${deltaBg ?? "bg-green-50 text-green-700"}`}>{delta}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-3 ${highlight ? "bg-white/10" : "bg-gray-50"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${highlight ? "text-gray-400" : "text-gray-400"}`}>Hoje</p>
          <div className={`text-2xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{today}</div>
        </div>
        <div className={`rounded-xl p-3 border ${highlight ? "bg-green-900/30 border-green-700/30" : "bg-green-50 border-green-100"}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${highlight ? "text-green-400" : "text-green-600"}`}>Com Koin</p>
          <div className={`text-2xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{koin}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getAssessmentById(id);
      if (!data) { router.push("/calculadora"); return; }
      setAssessment(data);
    }
    void load();
  }, [id, router]);

  const diagnostics = useMemo((): DiagnosticInsight[] => {
    if (!assessment) return [];
    return generateDiagnostics({
      vertical: assessment.vertical, ticket_medio: assessment.ticket_medio,
      taxa_aprovacao: assessment.taxa_aprovacao, taxa_chargeback: assessment.taxa_chargeback,
      taxa_decline: assessment.taxa_decline, taxa_false_decline: assessment.taxa_false_decline,
      pct_revisao_manual: assessment.pct_revisao_manual ?? 0, solucao_atual: assessment.solucao_atual,
      challenge_rate_3ds: assessment.challenge_rate_3ds ?? 0, challenge_rate_outras: assessment.challenge_rate_outras ?? 0,
      device_fingerprinting: assessment.device_fingerprinting ?? "Não sei", origem_fraude: assessment.origem_fraude ?? [],
      dor: assessment.dores, validacao_identidade_onboarding: assessment.validacao_identidade_onboarding ?? "Não",
      tem_programa_fidelidade: assessment.tem_programa_fidelidade ? "Sim" : "Não",
      monitora_behavioral_signals: assessment.monitora_behavioral_signals ?? "Não sei",
      modelo_negocio: assessment.modelo_negocio, tem_regras_customizadas: assessment.tem_regras_customizadas ?? "Não sei",
      opera_crossborder: assessment.opera_crossborder ? "Sim" : "Não",
    });
  }, [assessment]);

  const projection = useMemo(() => {
    if (!assessment) return null;
    return calculateProjections({
      volume_faixa: assessment.volume_mensal, pct_volume_cartao: assessment.pct_volume_cartao,
      ticket_medio: assessment.ticket_medio, taxa_aprovacao: assessment.taxa_aprovacao,
      taxa_chargeback: assessment.taxa_chargeback,
      pct_revisao_manual: assessment.pct_revisao_manual,
      challenge_rate_3ds: assessment.challenge_rate_3ds,
      costs: getCostSettings(),
    });
  }, [assessment]);

  if (!assessment || !projection) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent" />
        <p className="text-gray-400 font-medium text-sm">Analisando dados e gerando insights...</p>
      </div>
    );
  }

  const criticalCount = diagnostics.filter((d) => d.priority === "CRITICAL").length;
  const warningCount = diagnostics.filter((d) => d.priority === "WARNING").length;
  const healthScore = Math.max(0, 100 - criticalCount * 15 - warningCount * 5);

  const koinBenchmark = KOIN_PERFORMANCE_DEFAULTS[assessment.vertical] ?? KOIN_PERFORMANCE_DEFAULTS["Outro"];
  const aprAtual = assessment.taxa_aprovacao;
  const aprKoin = Math.min(100, aprAtual + (koinBenchmark.lift_aprovacao ?? 3));
  const aprDelta = aprKoin - aprAtual;
  const decAtual = assessment.taxa_decline;
  const decKoin = Math.max(0, decAtual - aprDelta);
  const cbAtual = assessment.taxa_chargeback;
  const cbKoin = cbAtual * (1 - (koinBenchmark.reducao_chargeback ?? 44) / 100);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-4">
        <Link href="/calculadora" className="text-gray-400 hover:text-gray-600 transition-colors">Calculadora</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium truncate">{assessment.merchant_name}</span>
      </nav>

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">{assessment.merchant_name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{assessment.merchant_name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{assessment.vertical}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{assessment.modelo_negocio}</span>
            </div>
            <p className="text-gray-400 text-xs mt-1 flex flex-wrap gap-x-3">
              <span>Gerado em {formatDate(assessment.updated_at)}</span>
              <span>·</span><span>{assessment.volume_mensal} transações/mês</span>
              <span>·</span><span>Ticket médio {formatCurrency(assessment.ticket_medio)}</span>
              <span>·</span><span>{assessment.pct_volume_cartao}% cartão</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/calculadora/${id}/export`} target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Exportar PDF
          </Link>
          <Link href={`/calculadora/new?id=${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors">
            Editar dados
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        <KpiCard title="Aprovação" icon={CheckCircle2} iconColor="text-green-500"
          today={<>{formatPercent(aprAtual, 1)}<p className="text-[11px] text-gray-400 mt-1">{Math.round(projection.volume_cartao * (aprAtual / 100)).toLocaleString("pt-BR")} txns</p></>}
          koin={<>{formatPercent(aprKoin, 1)}<p className="text-[11px] text-gray-500 mt-1">{Math.round(projection.volume_cartao * (aprKoin / 100)).toLocaleString("pt-BR")} txns</p></>}
          delta={`+${aprDelta.toFixed(1)}pp`} deltaBg="bg-green-50 text-green-700" />
        <KpiCard title="Decline" icon={XCircle} iconColor="text-gray-400"
          today={<>{formatPercent(decAtual, 1)}<p className="text-[11px] text-gray-400 mt-1">{Math.round(projection.volume_cartao * (decAtual / 100)).toLocaleString("pt-BR")} txns</p></>}
          koin={<>{formatPercent(decKoin, 1)}<p className="text-[11px] text-gray-500 mt-1">{Math.round(projection.volume_cartao * (decKoin / 100)).toLocaleString("pt-BR")} txns</p></>}
          delta={`-${aprDelta.toFixed(1)}pp`} deltaBg="bg-green-50 text-green-700" />
        <KpiCard title="Chargeback" icon={AlertCircle} iconColor={cbAtual > 1 ? "text-error-500" : "text-gray-400"}
          today={<span className={cbAtual > 1 ? "text-error-700" : ""}>{formatPercent(cbAtual, 2)}<p className="text-[11px] text-gray-400 mt-1">{cbAtual > 1 ? "Acima do limite" : "Dentro do limite"}</p></span>}
          koin={<>{formatPercent(cbKoin, 2)}<p className="text-[11px] text-gray-500 mt-1">Estimativa</p></>}
          delta={`-${koinBenchmark.reducao_chargeback}%`} deltaBg="bg-green-50 text-green-700" />
        {/* ROI card */}
        <div className="h-full flex flex-col bg-[#10181B] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-[#10B132]" />
            <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wide">ROI Anual</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(projection.roi_anual_estimado)}</p>
          <p className="text-xs text-[#98A2B3] mb-3">Estimativa conservadora</p>
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="flex justify-between text-xs">
              <span className="text-[#98A2B3]">Lift de aprovação</span>
              <span className="text-[#10B132] font-semibold">+{formatCurrency(projection.lift_receita_anual)}</span>
            </div>
            {projection.economia_chargeback_anual > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#98A2B3]">Redução chargeback</span>
                <span className="text-[#10B132] font-semibold">+{formatCurrency(projection.economia_chargeback_anual)}</span>
              </div>
            )}
            {projection.economia_revisao_anual > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#98A2B3]">Revisão manual</span>
                <span className="text-[#10B132] font-semibold">+{formatCurrency(projection.economia_revisao_anual)}</span>
              </div>
            )}
            {projection.economia_3ds_anual > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-[#98A2B3]">3DS / abandono</span>
                <span className="text-[#10B132] font-semibold">+{formatCurrency(projection.economia_3ds_anual)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs pt-1 border-t border-white/10">
              <span className="text-[#98A2B3]">Segmento</span>
              <span className="text-[#D0D5DD] font-medium">{assessment.vertical}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div>
        {/* Tab headers */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-6 shadow-sm">
          {[{ id: "diagnostic", label: "Diagnóstico", icon: ShieldCheck }, { id: "projection", label: "Projeção de ROI", icon: TrendingUp }].map(({ id: tabId, label, icon: Icon }) => (
            <button key={tabId} type="button" onClick={() => document.getElementById(tabId)?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
              <Icon className="h-4 w-4" />{label}
              {tabId === "diagnostic" && criticalCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">{criticalCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Diagnostic section */}
        <div id="diagnostic" className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Diagnóstico Inteligente</h2>
              <p className="text-sm text-gray-500 mt-1">{diagnostics.length} gatilho{diagnostics.length !== 1 ? "s" : ""} detectado{diagnostics.length !== 1 ? "s" : ""}</p>
            </div>
            <HealthScoreRing score={healthScore} />
          </div>

          {criticalCount > 0 && (
            <div className="p-4 rounded-xl bg-error-50 border border-error-200 flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-error-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-error-800">{criticalCount} alerta{criticalCount !== 1 ? "s" : ""} crítico{criticalCount !== 1 ? "s" : ""} identificado{criticalCount !== 1 ? "s" : ""}</p>
                <p className="text-xs text-error-600 mt-0.5">Riscos imediatos que devem ser endereçados com prioridade.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagnostics.map((insight) => (
              <InsightCard key={insight.id} title={insight.title} priority={insight.priority} category={insight.category} insight={insight.insight} ruleId={insight.id} />
            ))}
          </div>
        </div>

        {/* Projection section */}
        <div id="projection">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Projeção de ROI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-900">Detalhamento Financeiro</h3>
              </div>
              <div className="p-6 space-y-0">
                {[
                  { label: "Receita atual em cartão (mês)", value: formatCurrency(projection.receita_atual_cartao), color: "" },
                  { label: "↑ Lift aprovação (mensal)", value: `+${formatCurrency(projection.lift_receita_mensal)}`, color: "text-green-600" },
                  { label: "↑ Lift aprovação (anual)", value: `+${formatCurrency(projection.lift_receita_anual)}`, color: "text-green-600" },
                  { label: "↑ Economia chargeback (anual)", value: `+${formatCurrency(projection.economia_chargeback_anual)}`, color: "text-green-600", hide: projection.economia_chargeback_anual === 0 },
                  { label: "↑ Economia revisão manual (anual)", value: `+${formatCurrency(projection.economia_revisao_anual)}`, color: "text-green-600", hide: projection.economia_revisao_anual === 0 },
                  { label: "↑ Economia 3DS / abandono (anual)", value: `+${formatCurrency(projection.economia_3ds_anual)}`, color: "text-green-600", hide: projection.economia_3ds_anual === 0 },
                  { label: "ROI anual estimado", value: formatCurrency(projection.roi_anual_estimado), color: "text-gray-900 font-bold" },
                ].filter((row) => !("hide" in row && row.hide)).map(({ label, value, color }, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{label}</span>
                    <span className={`text-sm font-semibold text-gray-600 ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Context */}
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Solução atual: {assessment.solucao_atual}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{assessment.modelo_negocio} · {assessment.pct_volume_cartao}% cartão · Ticket {formatCurrency(assessment.ticket_medio)}</p>
                  </div>
                </div>
              </div>
              {projection.disclaimer && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">{projection.disclaimer}</p>
                </div>
              )}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
                <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 leading-relaxed">Projeções baseadas em benchmarks conservadores (+3pp de lift). Não inclui custo da solução Koin. Resultados reais dependem de implementação e qualidade dos dados.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
