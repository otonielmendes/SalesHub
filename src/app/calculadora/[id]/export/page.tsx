"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { KOIN_PERFORMANCE_DEFAULTS } from "@/lib/health-check/benchmarks";
import { Assessment } from "@/lib/health-check/types";
import { getAssessmentById } from "@/lib/health-check/store";
import { generateDiagnostics } from "@/lib/health-check/diagnostic-rules";
import { calculateProjections } from "@/lib/health-check/projections";
import { formatCurrency, formatPercent, formatDate } from "@/lib/health-check/utils";

const PRIORITY_LABELS: Record<string, string> = { CRITICAL: "CRÍTICO", WARNING: "ATENÇÃO", INFO: "INFORMATIVO" };
const PRIORITY_COLORS: Record<string, string> = { CRITICAL: "#EF4444", WARNING: "#F59E0B", INFO: "#3B82F6" };

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
    });
  }, [assessment]);

  if (!assessment || !projection) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "#6B7280", fontFamily: "system-ui, sans-serif" }}>Carregando relatório...</p>
      </div>
    );
  }

  const criticalCount = diagnostics.filter((d) => d.priority === "CRITICAL").length;
  const warningCount = diagnostics.filter((d) => d.priority === "WARNING").length;
  const healthScore = Math.max(0, 100 - criticalCount * 15 - warningCount * 5);
  const scoreColor = healthScore >= 70 ? "#16A34A" : healthScore >= 40 ? "#D97706" : "#DC2626";

  const koinBenchmark = KOIN_PERFORMANCE_DEFAULTS[assessment.vertical] ?? KOIN_PERFORMANCE_DEFAULTS["Outro"];
  const aprKoin = Math.min(100, assessment.taxa_aprovacao + koinBenchmark.lift_aprovacao);
  const cbKoin = assessment.taxa_chargeback * (1 - koinBenchmark.reducao_chargeback / 100);

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: "#fff",
        color: "#111827",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "60px 56px",
        fontSize: "13px",
        lineHeight: "1.6",
      }}
    >
      <style>{`
        @page { size: A4; margin: 20mm 16mm; }
        @media print { body { margin: 0; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", paddingBottom: "24px", borderBottom: "2px solid #111827" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>Koin Fraud Health Check</h1>
          <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>Relatório de Diagnóstico Antifraude</p>
          <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Gerado em {formatDate(assessment.updated_at)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Confidencial</p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>koin.com.br</p>
        </div>
      </div>

      {/* Merchant info + score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "32px", marginBottom: "40px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px 0" }}>{assessment.merchant_name}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[assessment.vertical, assessment.modelo_negocio, assessment.volume_mensal + " txns/mês", `Ticket: ${formatCurrency(assessment.ticket_medio)}`, `${assessment.pct_volume_cartao}% cartão`].map((tag) => (
              <span key={tag} style={{ background: "#F3F4F6", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, color: "#374151" }}>{tag}</span>
            ))}
          </div>
          <div style={{ marginTop: "16px", display: "flex", gap: "24px" }}>
            <div><p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>Solução Atual</p><p style={{ fontWeight: 700, margin: "2px 0 0" }}>{assessment.solucao_atual}</p></div>
            <div><p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>Taxa Aprovação</p><p style={{ fontWeight: 700, margin: "2px 0 0" }}>{formatPercent(assessment.taxa_aprovacao, 1)}</p></div>
            <div><p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>Taxa Chargeback</p><p style={{ fontWeight: 700, margin: "2px 0 0", color: assessment.taxa_chargeback > 1 ? "#DC2626" : undefined }}>{formatPercent(assessment.taxa_chargeback, 2)}</p></div>
            <div><p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>Taxa Decline</p><p style={{ fontWeight: 700, margin: "2px 0 0" }}>{formatPercent(assessment.taxa_decline, 1)}</p></div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `2px solid ${scoreColor}`, borderRadius: "16px", padding: "20px 28px", background: scoreColor + "10" }}>
          <p style={{ fontSize: "40px", fontWeight: 900, color: scoreColor, lineHeight: 1, margin: 0 }}>{healthScore}</p>
          <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "4px 0 0" }}>/100</p>
          <p style={{ fontSize: "12px", fontWeight: 700, color: scoreColor, marginTop: "4px" }}>{healthScore >= 70 ? "Saudável" : healthScore >= 40 ? "Atenção" : "Crítico"}</p>
        </div>
      </div>

      {/* KPI comparison */}
      <h3 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6B7280", marginBottom: "12px" }}>KPI Hoje vs. Com Koin</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "40px" }}>
        {[
          { label: "Taxa de Aprovação", today: `${assessment.taxa_aprovacao}%`, koin: `${aprKoin}%`, delta: `+${(aprKoin - assessment.taxa_aprovacao).toFixed(1)}pp` },
          { label: "Taxa de Chargeback", today: `${assessment.taxa_chargeback}%`, koin: `${cbKoin.toFixed(2)}%`, delta: `-${koinBenchmark.reducao_chargeback}%` },
          { label: "Lift Receita Anual", today: "Atual", koin: formatCurrency(projection.lift_receita_anual), delta: `+${formatCurrency(projection.lift_receita_mensal)}/mês` },
        ].map(({ label, today, koin, delta }) => (
          <div key={label} style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "16px", background: "#FAFAFA" }}>
            <p style={{ fontSize: "11px", color: "#6B7280", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>{label}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#F3F4F6", borderRadius: "8px", padding: "8px" }}>
                <p style={{ fontSize: "10px", color: "#9CA3AF", margin: "0 0 4px" }}>Hoje</p>
                <p style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>{today}</p>
              </div>
              <div style={{ background: "#ECFDF5", borderRadius: "8px", padding: "8px", border: "1px solid #D1FAE5" }}>
                <p style={{ fontSize: "10px", color: "#059669", margin: "0 0 4px" }}>Com Koin</p>
                <p style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>{koin}</p>
              </div>
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#059669", marginTop: "10px" }}>{delta}</p>
          </div>
        ))}
      </div>

      {/* Diagnostics */}
      <h3 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6B7280", marginBottom: "12px" }}>
        Diagnóstico — {diagnostics.length} gatilho{diagnostics.length !== 1 ? "s" : ""} detectado{diagnostics.length !== 1 ? "s" : ""}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "40px" }}>
        {diagnostics.map((d) => (
          <div key={d.id} style={{ border: `1px solid #E5E7EB`, borderLeft: `4px solid ${PRIORITY_COLORS[d.priority]}`, borderRadius: "8px", padding: "14px 14px 14px 16px", background: PRIORITY_COLORS[d.priority] + "08" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: PRIORITY_COLORS[d.priority], textTransform: "uppercase", letterSpacing: "0.5px" }}>{PRIORITY_LABELS[d.priority]}</span>
              <span style={{ fontSize: "10px", color: "#D1D5DB" }}>{d.id}</span>
            </div>
            <p style={{ fontSize: "12px", fontWeight: 700, margin: "0 0 4px", color: "#111827" }}>{d.title}</p>
            <p style={{ fontSize: "11px", color: "#4B5563", margin: 0, lineHeight: 1.5 }}>{d.insight}</p>
          </div>
        ))}
      </div>

      {/* Projection */}
      <h3 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6B7280", marginBottom: "12px" }}>Projeção Financeira</h3>
      <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", overflow: "hidden", marginBottom: "32px" }}>
        {[
          { label: "Receita atual em cartão (mês)", value: formatCurrency(projection.receita_atual_cartao) },
          { label: "Lift de receita mensal estimado", value: `+${formatCurrency(projection.lift_receita_mensal)}` },
          { label: "Lift de receita anual estimado", value: formatCurrency(projection.lift_receita_anual), bold: true },
          { label: "ROI anual estimado", value: formatCurrency(projection.roi_anual_estimado), bold: true },
        ].map(({ label, value, bold }, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 18px", background: i % 2 === 0 ? "#fff" : "#F9FAFB", borderBottom: i < 3 ? "1px solid #F3F4F6" : "none" }}>
            <span style={{ color: "#6B7280", fontSize: "12px" }}>{label}</span>
            <span style={{ fontWeight: bold ? 800 : 600, color: "#111827", fontSize: bold ? "14px" : "12px" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "16px", display: "flex", justifyContent: "space-between", color: "#9CA3AF", fontSize: "11px" }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Koin. Uso confidencial — distribuição restrita.</p>
        <p style={{ margin: 0 }}>koin.com.br · Documento gerado automaticamente</p>
      </div>
    </div>
  );
}
