"use client";

import { useEffect, useState, useMemo } from "react";
import { Download01 } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/application/loading-indicators/loading-indicator";
import { getKoinSettings, getCostSettings } from "@/lib/health-check/benchmarks";
import { Assessment } from "@/lib/health-check/types";
import { getAssessmentById } from "@/lib/health-check/store";
import { generateDiagnostics, type DiagnosticInsight } from "@/lib/health-check/diagnostic-rules";
import { calculateProjections } from "@/lib/health-check/projections";
import { formatCurrency } from "@/lib/health-check/utils";
import { CalculadoraPageBreadcrumbs } from "../_components/page-shell";
import { InsightCard } from "../_components/insight-card";

// ─── Inline KoinCompareCard matching reference design ───────────────────────

interface KoinCompareCardProps {
  title: string;
  todayValue: number;
  koinValue: number;
  deltaText: string;
  todaySub?: string;
  koinSub?: string;
  decimals?: number;
}

function fmt(value: number, decimals: number): string {
  return `${value.toFixed(decimals)}%`;
}

function formatPositiveReductionDelta(todayValue: number, koinValue: number, decimals = 1): string {
  const reduction = todayValue - koinValue;
  if (!Number.isFinite(reduction) || reduction <= 0) return "—";
  return `+${reduction.toFixed(decimals)}pp`;
}

function KoinCompareCard({
  title,
  todayValue,
  koinValue,
  deltaText,
  todaySub,
  koinSub,
  decimals = 1,
}: KoinCompareCardProps) {
  return (
    <div className="h-[180px] flex flex-col bg-[#F9FAFB] border border-[#E4E7EC] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Concentric circles icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#10B132" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="3" stroke="#10B132" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8" cy="8" r="0.75" fill="#10B132" />
          </svg>
          <span className="text-xs font-semibold text-[#667085] uppercase tracking-wide">{title}</span>
        </div>
        <span className="text-xs font-bold text-[#10B132] bg-[#DCFAE6] px-2 py-0.5 rounded-full">
          {deltaText}
        </span>
      </div>

      {/* Body */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Hoje */}
        <div className="rounded-xl p-3 bg-white border border-[#EAECEE]">
          <p className="text-[10px] font-bold text-[#667085] uppercase tracking-widest mb-1">Hoje</p>
          <p className="text-2xl font-bold text-[#10181B]">{fmt(todayValue, decimals)}</p>
          {todaySub && <p className="text-[11px] text-[#98A2B3] mt-1">{todaySub}</p>}
        </div>
        {/* Com Koin */}
        <div className="bg-[#F6FEF9] rounded-xl p-3 border border-[#DCFAE6]">
          <p className="text-[10px] font-bold text-[#10B132] uppercase tracking-widest mb-1">Com Koin</p>
          <p className="text-2xl font-bold text-[#10181B]">{fmt(koinValue, decimals)}</p>
          {koinSub && <p className="text-[11px] text-[#667085] mt-1">{koinSub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [showRoiCalc, setShowRoiCalc] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getAssessmentById(id);
      if (!data) {
        router.push("/calculadora");
        return;
      }
      setAssessment(data);
    }
    void load();
  }, [id, router]);

  const diagnostics = useMemo((): DiagnosticInsight[] => {
    if (!assessment) return [];
    return generateDiagnostics({
      vertical: assessment.vertical,
      ticket_medio: assessment.ticket_medio,
      taxa_aprovacao: assessment.taxa_aprovacao,
      taxa_chargeback: assessment.taxa_chargeback,
      taxa_decline: assessment.taxa_decline,
      taxa_false_decline: assessment.taxa_false_decline,
      pct_revisao_manual: assessment.pct_revisao_manual ?? 0,
      solucao_atual: assessment.solucao_atual,
      challenge_rate_3ds: assessment.challenge_rate_3ds ?? 0,
      challenge_rate_outras: assessment.challenge_rate_outras ?? 0,
      device_fingerprinting: assessment.device_fingerprinting ?? "Não sei",
      origem_fraude: assessment.origem_fraude ?? [],
      dor: assessment.dores,
      validacao_identidade_onboarding: assessment.validacao_identidade_onboarding ?? "Não",
      tem_programa_fidelidade: assessment.tem_programa_fidelidade ? "Sim" : "Não",
      monitora_behavioral_signals: assessment.monitora_behavioral_signals ?? "Não sei",
      modelo_negocio: assessment.modelo_negocio,
      tem_regras_customizadas: assessment.tem_regras_customizadas ?? "Não sei",
      opera_crossborder: assessment.opera_crossborder ? "Sim" : "Não",
    });
  }, [assessment]);

  const projection = useMemo(() => {
    if (!assessment) return null;
    return calculateProjections({
      volume_faixa: assessment.volume_mensal,
      pct_volume_cartao: assessment.pct_volume_cartao,
      ticket_medio: assessment.ticket_medio,
      taxa_aprovacao: assessment.taxa_aprovacao,
      taxa_chargeback: assessment.taxa_chargeback,
      pct_revisao_manual: assessment.pct_revisao_manual,
      challenge_rate_3ds: assessment.challenge_rate_3ds,
      costs: getCostSettings(),
    });
  }, [assessment]);

  if (!assessment || !projection) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <LoadingIndicator type="line-spinner" size="md" label="A gerar análise..." />
      </div>
    );
  }

  const criticalCount = diagnostics.filter((d) => d.priority === "CRITICAL").length;
  const warningCount = diagnostics.filter((d) => d.priority === "WARNING").length;
  const healthScore = Math.max(0, 100 - criticalCount * 15 - warningCount * 5);

  const koinSettings = getKoinSettings();
  const koinBenchmark = koinSettings[assessment.vertical] ?? koinSettings["Outro"];

  const aprAtual = assessment.taxa_aprovacao;
  const aprKoin = Math.min(100, aprAtual + (koinBenchmark.lift_aprovacao ?? 3));
  const aprDelta = aprKoin - aprAtual;

  const decAtual = assessment.taxa_decline;
  const decKoin = Math.max(0, decAtual - aprDelta);

  const cbAtual = assessment.taxa_chargeback;
  const cbKoin = cbAtual * (1 - (koinBenchmark.reducao_chargeback ?? 44) / 100);

  const vol = projection.volume_cartao;
  const txnApr = Math.round(vol * (aprAtual / 100)).toLocaleString("pt-BR");
  const txnAprK = Math.round(vol * (aprKoin / 100)).toLocaleString("pt-BR");
  const txnDec = Math.round(vol * (decAtual / 100)).toLocaleString("pt-BR");
  const txnDecK = Math.round(vol * (decKoin / 100)).toLocaleString("pt-BR");

  const tdsAtual = assessment.challenge_rate_3ds ?? 0;
  const revisaoAtual = assessment.pct_revisao_manual ?? 0;

  const healthColor =
    healthScore >= 70 ? "#067647" : healthScore >= 40 ? "#B54708" : "#B42318";
  const currencyCode = assessment.moeda;
  const receitaAtualCartaoAnual = projection.receita_atual_cartao * 12;
  const receitaIncrementalAnual = projection.lift_receita_anual;
  const economiaChargeback = Math.max(0, projection.economia_chargeback_anual);
  const economiaRevisao = Math.max(0, projection.economia_revisao_anual);
  const economia3ds = Math.max(0, projection.economia_3ds_anual);

  const roiRows = [
    { label: "Processamento atual (cartão/ano)", value: formatCurrency(receitaAtualCartaoAnual, currencyCode) },
    { label: "Lift de aprovação (receita/ano)", value: `+${formatCurrency(receitaIncrementalAnual, currencyCode)}` },
    ...(economiaChargeback > 0 ? [{ label: "Economia com chargeback", value: `+${formatCurrency(economiaChargeback, currencyCode)}` }] : []),
    ...(economiaRevisao > 0 ? [{ label: "Economia com revisão manual", value: `+${formatCurrency(economiaRevisao, currencyCode)}` }] : []),
    ...(economia3ds > 0 ? [{ label: "Economia com 3DS / abandono", value: `+${formatCurrency(economia3ds, currencyCode)}` }] : []),
  ];

  return (
    <main className="mx-auto w-full max-w-container px-6 pb-24 pt-8 lg:px-8">
      <CalculadoraPageBreadcrumbs
        className="mb-6"
        items={[
          { label: "Calculadora", href: "/calculadora/historico" },
          { label: assessment.merchant_name, current: true },
        ]}
      />

      {/* Header section */}
      <section className="w-full p-6 bg-white rounded-2xl border border-[#D0D5DD] flex flex-col justify-center items-start gap-4 mb-8">
        {/* Title row */}
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex justify-start items-center gap-4 flex-wrap min-w-0">
            <h1 className="text-2xl font-semibold text-[#10181B] leading-8">
              Análise {assessment.merchant_name}
            </h1>
            <div className="flex justify-start items-center gap-2">
              <span className="px-2.5 py-1 bg-[#F2F4F6] text-[#475456] rounded-full text-sm font-medium leading-5">
                {assessment.vertical}
              </span>
              <span className="px-2.5 py-1 bg-[#F2F4F6] text-[#475456] rounded-full text-sm font-medium leading-5">
                {assessment.modelo_negocio}
              </span>
              <span className="px-2.5 py-1 bg-[#F2F4F6] text-[#475456] rounded-full text-sm font-medium leading-5">
                {assessment.solucao_atual}
              </span>
            </div>
          </div>
          <div className="flex justify-start items-center gap-3 shrink-0">
            <a
              className="px-3.5 py-2.5 border border-[#D0D5DD] bg-white hover:bg-[#F9FAFB] text-[#475456] rounded-lg flex justify-center items-center gap-1.5 text-sm font-semibold leading-5 transition-colors"
              href={`/calculadora/new?id=${id}`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.3333 2.00001C11.5095 1.82391 11.7159 1.68103 11.9416 1.57925C12.1673 1.47747 12.4085 1.41867 12.6533 1.40584C12.8981 1.39301 13.1424 1.42641 13.3746 1.50424C13.6068 1.58207 13.8228 1.70296 14.012 1.86001C14.2012 2.01705 14.3601 2.20752 14.4813 2.42139C14.6025 2.63526 14.6838 2.86877 14.7213 3.11001C14.7588 3.35124 14.7518 3.59604 14.7007 3.83474C14.6495 4.07345 14.555 4.30163 14.422 4.50667L5.00001 14H2.00001V11L11.3333 2.00001Z"
                  stroke="currentColor"
                  strokeWidth="1.33"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Editar dados
            </a>
            <a
              className="px-3.5 py-2.5 bg-[#10181B] hover:bg-[#182225] text-white rounded-lg flex justify-center items-center gap-1.5 text-sm font-semibold leading-5 transition-colors"
              href={`/calculadora/${id}/export`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download01 className="h-4 w-4" />
              Baixar análise
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#EAECEE]" />

        {/* Summary bar */}
        <div className="w-full flex justify-start items-center gap-4 flex-wrap">
          {/* Health */}
          <div className="flex justify-start items-center gap-1">
            <div className="w-8 h-8 flex justify-center items-center bg-[#F2F4F6] rounded-full shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 5.24C14 3.5 12.5 2 10.76 2C9.5 2 8.42 2.72 8 3.8C7.58 2.72 6.5 2 5.24 2C3.5 2 2 3.5 2 5.24C2 7.5 4 9.5 8 12.5C12 9.5 14 7.5 14 5.24Z" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-normal text-[#475456] leading-6">
              Health:{" "}
              <span className="font-medium" style={{ color: healthColor }}>
                {healthScore}/100
              </span>
            </span>
          </div>

          {/* Transações */}
          <div className="flex justify-start items-center gap-1">
            <div className="w-8 h-8 flex justify-center items-center bg-[#F2F4F6] rounded-full shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M9.33333 1.33333H4C3.26362 1.33333 2.66667 1.93029 2.66667 2.66667V13.3333C2.66667 14.0697 3.26362 14.6667 4 14.6667H12C12.7364 14.6667 13.3333 14.0697 13.3333 13.3333V5.33333L9.33333 1.33333Z" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.33333 1.33333V5.33333H13.3333" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-normal text-[#475456] leading-6">
              Transações: <span className="font-semibold text-[#10181B]">{assessment.volume_mensal}</span>
            </span>
          </div>

          {/* Ticket Médio */}
          <div className="flex justify-start items-center gap-1">
            <div className="w-8 h-8 flex justify-center items-center bg-[#F2F4F6] rounded-full shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 5.33333V10.6667" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 7.33333C6 6.59695 6.59695 6 7.33333 6H8.66667C9.40305 6 10 6.59695 10 7.33333C10 8.06971 9.40305 8.66667 8.66667 8.66667H7.33333C6.59695 8.66667 6 9.26362 6 10C6 10.7364 6.59695 11.3333 7.33333 11.3333H8.66667" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-normal text-[#475456] leading-6">
              Ticket Médio: <span className="font-semibold text-[#10181B]">{formatCurrency(assessment.ticket_medio, currencyCode)}</span>
            </span>
          </div>

          {/* Cartão */}
          <div className="flex justify-start items-center gap-1">
            <div className="w-8 h-8 flex justify-center items-center bg-[#F2F4F6] rounded-full shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.33333" y="4" width="13.3333" height="9.33333" rx="1.33" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1.33333 6.66667H14.6667" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-normal text-[#475456] leading-6">
              Cartão: <span className="font-semibold text-[#10181B]">{assessment.pct_volume_cartao}%</span>
            </span>
          </div>

          {/* Pix */}
          <div className="flex justify-start items-center gap-1">
            <div className="w-8 h-8 flex justify-center items-center bg-[#F2F4F6] rounded-full shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6L14 8L10 10L8 14L6 10L2 8L6 6L8 2Z" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-normal text-[#475456] leading-6">
              Pix: <span className="font-semibold text-[#10181B]">{assessment.pct_volume_pix ?? 0}%</span>
            </span>
          </div>

          {/* APMs */}
          <div className="flex justify-start items-center gap-1">
            <div className="w-8 h-8 flex justify-center items-center bg-[#F2F4F6] rounded-full shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2.66667 4H13.3333" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.66667 8H13.3333" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.66667 12H13.3333" stroke="#98A2B3" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-normal text-[#475456] leading-6">
              APMs: <span className="font-semibold text-[#10181B]">{assessment.pct_volume_apms ?? 0}%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Comparativo */}
      <section className="mb-8">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#10181B]">Comparativo</h2>
          <p className="text-sm text-[#667085] mt-0.5">
            Projeção comparativa entre a operação atual e a performance estimada com Koin
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[15px] items-stretch">
          {/* ROI Anual — dark card */}
          <div className="h-[180px] flex flex-col bg-[#10181B] rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0.666664V15.3333M11.3333 3.33333H6.33334C5.71451 3.33333 5.121 3.57917 4.68342 4.01675C4.24584 4.45434 4.00001 5.04783 4.00001 5.66666C4.00001 6.2855 4.24584 6.87899 4.68342 7.31657C5.121 7.75416 5.71451 8 6.33334 8H9.66668C10.2855 8 10.879 8.24583 11.3166 8.68342C11.7542 9.121 12 9.71449 12 10.3333C12 10.9522 11.7542 11.5457 11.3166 11.9832C10.879 12.4208 10.2855 12.6667 9.66668 12.6667H4.00001" stroke="#10B132" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wide">ROI Anual</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{formatCurrency(projection.roi_anual_estimado, currencyCode)}</p>
            <p className="text-xs text-[#98A2B3] mb-2">Estimativa conservadora de incremento</p>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setShowRoiCalc(true)}
              className="mt-2 inline-flex items-center gap-1.5 self-start rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ver cálculo
            </button>
          </div>

          {/* Aprovação */}
          <KoinCompareCard
            title="Aprovação"
            todayValue={aprAtual}
            koinValue={aprKoin}
            deltaText={`+${aprDelta.toFixed(1)}pp`}
            todaySub={`${txnApr} transações`}
            koinSub={`${txnAprK} transações`}
            decimals={1}
          />

          {/* Rejeição */}
          <KoinCompareCard
            title="Rejeição"
            todayValue={decAtual}
            koinValue={decKoin}
            deltaText={`−${aprDelta.toFixed(1)}pp`}
            todaySub={`${txnDec} transações`}
            koinSub={`${txnDecK} transações`}
            decimals={1}
          />

          {/* Chargeback */}
          <KoinCompareCard
            title="Chargeback"
            todayValue={cbAtual}
            koinValue={cbKoin}
            deltaText={`−${koinBenchmark.reducao_chargeback.toFixed(0)}%`}
            todaySub={cbAtual > 1 ? "Acima do limite" : "Dentro do limite"}
            koinSub="Estimativa"
            decimals={2}
          />

          {/* 3DS Rate */}
          <KoinCompareCard
            title="3DS Rate"
            todayValue={tdsAtual}
            koinValue={8}
            deltaText={formatPositiveReductionDelta(tdsAtual, 8, 1)}
            todaySub={tdsAtual === 0 ? "Não informado" : undefined}
            koinSub="Com 3DS inteligente"
            decimals={2}
          />

          {/* Revisão Manual */}
          <KoinCompareCard
            title="Revisão Manual"
            todayValue={revisaoAtual}
            koinValue={2}
            deltaText={formatPositiveReductionDelta(revisaoAtual, 2, 1)}
            todaySub={revisaoAtual === 0 ? "Não informado" : undefined}
            koinSub="Estimativa Koin"
            decimals={2}
          />
        </div>
      </section>

      {/* Insights */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-[#10181B] mb-2">Insights</h2>

        <div className="p-4 bg-[#F9FAFB] rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#E4E7EC] flex flex-col max-h-[480px] overflow-hidden">
          {/* Insights header */}
          <div className="self-stretch inline-flex justify-start items-center gap-4 shrink-0">
            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#10B132] text-white shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M1.16667 7C1.16667 10.2217 3.77834 12.8333 7 12.8333C10.2217 12.8333 12.8333 10.2217 12.8333 7C12.8333 3.77834 10.2217 1.16667 7 1.16667C4.86917 1.16667 3.00667 2.33667 1.985 4.08333M1.16667 1.16667V4.08333H4.08333"
                  stroke="currentColor"
                  strokeWidth="1.17"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="flex-1 flex justify-between items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#667085]">Diagnóstico</span>
              <div className="flex items-center gap-2 flex-wrap">
                {criticalCount > 0 && (
                  <span className="px-2.5 py-1 bg-[#FEF3F2] rounded-full text-[#B42318] text-sm font-medium">
                    {criticalCount} crítico{criticalCount !== 1 ? "s" : ""}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-2.5 py-1 bg-[#FFF7ED] rounded-full text-[#B54708] text-sm font-medium">
                    {warningCount} moderado{warningCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
            <button className="flex items-center gap-1 px-3.5 py-2.5 bg-[#10181B] hover:bg-[#182225] text-white rounded-lg text-sm font-semibold transition-colors shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M1.16667 7C1.16667 10.2217 3.77834 12.8333 7 12.8333C10.2217 12.8333 12.8333 10.2217 12.8333 7C12.8333 3.77834 10.2217 1.16667 7 1.16667C4.86917 1.16667 3.00667 2.33667 1.985 4.08333M1.16667 1.16667V4.08333H4.08333"
                  stroke="currentColor"
                  strokeWidth="1.17"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Adicionar mais
            </button>
          </div>

          {/* Divider */}
          <div className="self-stretch h-px bg-[#E4E7EC] shrink-0 mt-4" />

          {/* Scrollable insights list */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-4">
            <div className="flex flex-col gap-4 pr-1">
              {diagnostics.map((insight) => (
                <InsightCard
                  key={insight.id}
                  title={insight.title}
                  priority={insight.priority}
                  category={insight.category}
                  insight={insight.insight}
                  recommendation={insight.recommendation}
                  ruleId={insight.id}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {showRoiCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#10181B]">Como calculamos o ROI</h3>
                <p className="mt-1 text-sm text-[#667085]">Detalhamento da estimativa conservadora.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRoiCalc(false)}
                className="rounded-md p-1 text-[#667085] hover:bg-[#F2F4F6]"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] p-4">
              <p className="text-sm font-semibold text-[#344043]">Equação do ROI anual</p>
              <div className="mt-3 space-y-2 text-sm">
                {roiRows.map((row, index) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#98A2B3] w-5 text-center">
                        {index === 0 ? "=" : "+"}
                      </span>
                      <span className="text-[#667085]">{row.label}</span>
                    </div>
                    <span className="font-semibold text-[#10181B]">{row.value}</span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-[#E4E7EC] pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#98A2B3] w-5 text-center">=</span>
                    <span className="text-[#344043] font-semibold">ROI anual estimado</span>
                  </div>
                  <span className="text-[#0C8525] font-bold">
                    {formatCurrency(projection.roi_anual_estimado, currencyCode)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-[#667085]">
              Estimativa conservadora baseada nas taxas informadas pelo merchant e benchmarks de mercado.
            </div>
          </div>
        </div>
      )}

      {/* Floating chat button */}
      <button className="fixed z-50 bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg transition-all duration-200 bg-white border border-[#E4E7EC] text-[#475456] hover:text-[#10B132] hover:border-[#10B132] hover:shadow-xl">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <path
            d="M17.5 9.58333C17.5023 10.6832 17.2454 11.7648 16.75 12.75C16.2343 13.7822 15.4582 14.6575 14.4917 15.2917C13.5251 15.9258 12.3991 16.2974 11.2333 16.3667C10.1335 16.369 9.05188 16.1121 8.06667 15.6167L2.5 17.5L4.38333 11.9333C3.88793 10.9481 3.63102 9.86652 3.63333 8.76667C3.70265 7.60087 4.07424 6.4749 4.70833 5.50833C5.34243 4.54177 6.21774 3.76568 7.25 3.25C8.23521 2.75459 9.31684 2.49769 10.4167 2.5H10.8333C12.0563 2.54532 13.2478 2.96666 14.2583 3.71667C15.2689 4.46667 16.0534 5.50999 16.5167 6.725C16.98 7.94 17.1024 9.27749 16.8667 10.5667L17.5 9.58333Z"
            stroke="currentColor"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-sm font-semibold">Pergunte sobre a análise</span>
      </button>

      {/* Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-[#F9FAFB] border border-[#EAECEE] flex items-start gap-3">
        <span className="text-[#98A2B3] shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 10.6667V8M8 5.33333H8.00667M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.31811 14.6667 1.33334 11.6819 1.33334 8C1.33334 4.31811 4.31811 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.31811 14.6667 8Z"
              stroke="currentColor"
              strokeWidth="1.33"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="text-xs text-[#667085] leading-relaxed">
          Projeções baseadas em benchmarks conservadores. Não inclui custo da solução Koin. Resultados reais dependem de implementação e qualidade dos dados.
        </p>
      </div>
    </main>
  );
}
