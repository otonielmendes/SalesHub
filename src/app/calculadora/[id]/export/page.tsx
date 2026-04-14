"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { KOIN_PERFORMANCE_DEFAULTS, getCostSettings } from "@/lib/health-check/benchmarks";
import { Assessment } from "@/lib/health-check/types";
import { getAssessmentById } from "@/lib/health-check/store";
import { generateDiagnostics } from "@/lib/health-check/diagnostic-rules";
import { calculateProjections } from "@/lib/health-check/projections";
import { formatCurrency, formatPercent, formatDate } from "@/lib/health-check/utils";

const PRIORITY_LABELS: Record<string, string> = { CRITICAL: "CRÍTICO", WARNING: "ATENÇÃO", INFO: "INFORMATIVO" };
const PRIORITY_COLORS: Record<string, string> = { CRITICAL: "#EF4444", WARNING: "#F59E0B", INFO: "#3B82F6" };

interface CompareCardProps {
  title: string;
  deltaText: string;
  todayValue: string;
  todaySub?: string;
  koinValue: string;
  koinSub?: string;
}

function CompareCard({ title, deltaText, todayValue, todaySub, koinValue, koinSub }: CompareCardProps) {
  return (
    <div style={{ border: "1px solid #E5E7EB", borderRadius: "16px", padding: "16px", background: "#FFFFFF" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.6px" }}>{title}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#12B76A", background: "#E7F9F0", padding: "4px 8px", borderRadius: "999px" }}>{deltaText}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "12px" }}>
          <p style={{ fontSize: "10px", color: "#667085", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Hoje</p>
          <p style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#101828" }}>{todayValue}</p>
          {todaySub && <p style={{ fontSize: "11px", color: "#98A2B3", margin: "6px 0 0" }}>{todaySub}</p>}
        </div>
        <div style={{ border: "1px solid #D1FADF", borderRadius: "12px", padding: "12px", background: "#F6FEF9" }}>
          <p style={{ fontSize: "10px", color: "#12B76A", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 700 }}>Com Koin</p>
          <p style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "#101828" }}>{koinValue}</p>
          {koinSub && <p style={{ fontSize: "11px", color: "#667085", margin: "6px 0 0" }}>{koinSub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ExportPage() {
  const params = useParams();
  const id = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getAssessmentById(id);
      if (data) setAssessment(data);
    }
    void load();
  }, [id]);

  useEffect(() => {
    if (assessment) {
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [assessment]);

  const diagnostics = useMemo(() => {
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "14px", color: "#667085" }}>Carregando relatório…</p>
      </div>
    );
  }

  const currencyCode = assessment.moeda;
  const koinBenchmark = KOIN_PERFORMANCE_DEFAULTS[assessment.vertical] ?? KOIN_PERFORMANCE_DEFAULTS["Outro"];
  const aprKoin = Math.min(100, assessment.taxa_aprovacao + koinBenchmark.lift_aprovacao);
  const cbKoin = assessment.taxa_chargeback * (1 - koinBenchmark.reducao_chargeback / 100);
  const decKoin = Math.max(0, assessment.taxa_decline - (aprKoin - assessment.taxa_aprovacao));
  const tdsAtual = assessment.challenge_rate_3ds ?? 0;
  const revisaoAtual = assessment.pct_revisao_manual ?? 0;

  const receitaAtualCartaoAnual = projection.receita_atual_cartao * 12;
  const economiaChargeback = Math.max(0, projection.economia_chargeback_anual);
  const economiaRevisao = Math.max(0, projection.economia_revisao_anual);
  const economia3ds = Math.max(0, projection.economia_3ds_anual);

  const roiRows = [
    { label: "Processamento atual (cartão/ano)", value: formatCurrency(receitaAtualCartaoAnual, currencyCode) },
    { label: "Lift de aprovação (receita/ano)", value: `+${formatCurrency(projection.lift_receita_anual, currencyCode)}` },
    ...(economiaChargeback > 0 ? [{ label: "Economia com chargeback", value: `+${formatCurrency(economiaChargeback, currencyCode)}` }] : []),
    ...(economiaRevisao > 0 ? [{ label: "Economia com revisão manual", value: `+${formatCurrency(economiaRevisao, currencyCode)}` }] : []),
    ...(economia3ds > 0 ? [{ label: "Economia com 3DS / abandono", value: `+${formatCurrency(economia3ds, currencyCode)}` }] : []),
  ];

  const summaryRows = [
    { label: "Merchant", value: assessment.merchant_name },
    { label: "Vertical", value: assessment.vertical },
    { label: "Modelo de negócio", value: assessment.modelo_negocio },
    { label: "Volume transacional", value: assessment.volume_mensal },
    { label: "Ticket médio", value: formatCurrency(assessment.ticket_medio, currencyCode) },
    { label: "% Cartão", value: `${assessment.pct_volume_cartao}%` },
    { label: "% Pix", value: `${assessment.pct_volume_pix ?? 0}%` },
    { label: "% APMs", value: `${assessment.pct_volume_apms ?? 0}%` },
    { label: "Taxa de aprovação", value: formatPercent(assessment.taxa_aprovacao, 1) },
    { label: "Taxa de decline", value: formatPercent(assessment.taxa_decline, 1) },
    { label: "Taxa de chargeback", value: formatPercent(assessment.taxa_chargeback, 2) },
    { label: "Solução atual", value: assessment.solucao_atual },
  ];

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: "#fff",
        color: "#111827",
        maxWidth: "980px",
        margin: "0 auto",
        padding: "56px 48px 48px",
        fontSize: "13px",
        lineHeight: "1.6",
      }}
    >
      <style>{`
        @page { size: A4; margin: 18mm 14mm; }
        @media print { body { margin: 0; } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/koin-logomark.svg" alt="Koin" style={{ width: "28px", height: "28px" }} />
          <div>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Análise Koin</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#667085" }}>Relatório executivo</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#98A2B3" }}>Atualizado em</p>
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 700 }}>{formatDate(assessment.updated_at)}</p>
        </div>
      </div>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>ROI (incremento)</h2>
        <div style={{ marginBottom: "10px", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "14px", background: "#FFFFFF" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#98A2B3", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>ROI anual (incremento estimado)</p>
          <p style={{ margin: "6px 0 0", fontSize: "20px", fontWeight: 800, color: "#111827" }}>{formatCurrency(projection.roi_anual_estimado, currencyCode)}</p>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#667085" }}>Estimativa conservadora de incremento</p>
        </div>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "14px", background: "#F9FAFB" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {roiRows.map((row, index) => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "16px", textAlign: "center", color: "#98A2B3", fontWeight: 700 }}>{index === 0 ? "=" : "+"}</span>
                  <span style={{ color: "#667085", fontSize: "12px" }}>{row.label}</span>
                </div>
                <span style={{ fontWeight: 700, color: "#111827", fontSize: "12px" }}>{row.value}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "16px", textAlign: "center", color: "#98A2B3", fontWeight: 700 }}>=</span>
                <span style={{ fontWeight: 700, color: "#111827", fontSize: "12px" }}>ROI anual estimado</span>
              </div>
              <span style={{ fontWeight: 800, color: "#12B76A", fontSize: "13px" }}>{formatCurrency(projection.roi_anual_estimado, currencyCode)}</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>Comparativo</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          <CompareCard
            title="Aprovação"
            deltaText={`+${(aprKoin - assessment.taxa_aprovacao).toFixed(1)}pp`}
            todayValue={`${assessment.taxa_aprovacao.toFixed(1)}%`}
            todaySub={`${Math.round(projection.volume_cartao * (assessment.taxa_aprovacao / 100)).toLocaleString("pt-BR")} transações`}
            koinValue={`${aprKoin.toFixed(1)}%`}
            koinSub={`${Math.round(projection.volume_cartao * (aprKoin / 100)).toLocaleString("pt-BR")} transações`}
          />
          <CompareCard
            title="Rejeição"
            deltaText={`−${(aprKoin - assessment.taxa_aprovacao).toFixed(1)}pp`}
            todayValue={`${assessment.taxa_decline.toFixed(1)}%`}
            todaySub={`${Math.round(projection.volume_cartao * (assessment.taxa_decline / 100)).toLocaleString("pt-BR")} transações`}
            koinValue={`${decKoin.toFixed(1)}%`}
            koinSub={`${Math.round(projection.volume_cartao * (decKoin / 100)).toLocaleString("pt-BR")} transações`}
          />
          <CompareCard
            title="Chargeback"
            deltaText={`−${koinBenchmark.reducao_chargeback.toFixed(0)}%`}
            todayValue={`${assessment.taxa_chargeback.toFixed(2)}%`}
            todaySub={assessment.taxa_chargeback > 1 ? "Acima do limite" : "Dentro do limite"}
            koinValue={`${cbKoin.toFixed(2)}%`}
            koinSub="Estimativa"
          />
          <CompareCard
            title="3DS Rate"
            deltaText={formatPositiveReductionDelta(tdsAtual, 8, 1)}
            todayValue={`${tdsAtual.toFixed(2)}%`}
            todaySub={tdsAtual === 0 ? "Não informado" : undefined}
            koinValue="8.00%"
            koinSub="Com 3DS inteligente"
          />
          <CompareCard
            title="Revisão Manual"
            deltaText={formatPositiveReductionDelta(revisaoAtual, 2, 1)}
            todayValue={`${revisaoAtual.toFixed(2)}%`}
            todaySub={revisaoAtual === 0 ? "Não informado" : undefined}
            koinValue="2.00%"
            koinSub="Estimativa Koin"
          />
        </div>

      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>Insights</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {diagnostics.map((d) => (
            <div key={d.id} style={{ border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", background: "#FFFFFF" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>{PRIORITY_LABELS[d.priority]}</span>
                <span style={{ fontSize: "10px", color: "#D1D5DB" }}>{d.id}</span>
              </div>
              <p style={{ fontSize: "12px", fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{d.title}</p>
              <p style={{ fontSize: "11px", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>{d.insight}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>Resumo da análise</h2>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {summaryRows.map((row) => (
              <div key={row.label} style={{ border: "1px solid #F2F4F7", borderRadius: "10px", padding: "10px 12px", background: "#FFFFFF" }}>
                <p style={{ margin: 0, fontSize: "10px", color: "#98A2B3", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700 }}>
                  {row.label}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: 700, color: "#111827" }}>{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px", display: "flex", justifyContent: "space-between", color: "#9CA3AF", fontSize: "11px" }}>
        <p style={{ margin: 0 }}>Projeções baseadas em benchmarks conservadores. Não inclui custo da solução Koin. Resultados reais dependem de implementação e qualidade dos dados.</p>
        <p style={{ margin: 0 }}>koin.com.br</p>
      </div>
    </div>
  );
}

function formatPositiveReductionDelta(todayValue: number, koinValue: number, decimals = 1): string {
  const reduction = todayValue - koinValue;
  if (!Number.isFinite(reduction) || reduction <= 0) return "—";
  return `+${reduction.toFixed(decimals)}pp`;
}
