"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  CurrencyDollar,
  Download01,
  Edit01,
  InfoCircle,
  MessageChatCircle,
  ShieldTick,
  TrendUp01,
  Users01,
} from "@untitledui/icons";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { LoadingIndicator } from "@/components/application/loading-indicators/loading-indicator";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { CompareCard } from "@/components/backtest/CompareCard";
import { KOIN_PERFORMANCE_DEFAULTS } from "@/lib/health-check/benchmarks";
import { Assessment } from "@/lib/health-check/types";
import { getAssessmentById } from "@/lib/health-check/store";
import { generateDiagnostics, type DiagnosticInsight } from "@/lib/health-check/diagnostic-rules";
import { calculateProjections } from "@/lib/health-check/projections";
import { formatCurrency, formatPercent, formatDate } from "@/lib/health-check/utils";
import { cx } from "@/utils/cx";
import { InsightCard } from "../_components/insight-card";

function HealthScoreRing({ score }: { score: number }) {
  const isGood = score >= 70;
  const isMid = score >= 40;
  return (
    <div
      className={cx(
        "flex min-w-[100px] flex-col items-center justify-center rounded-2xl border-2 p-4",
        isGood && "border-success-200 bg-success-50",
        !isGood && isMid && "border-warning-200 bg-warning-50",
        !isGood && !isMid && "border-error-200 bg-error-50",
      )}
    >
      <span
        className={cx(
          "font-mono text-4xl font-bold",
          isGood && "text-success-600",
          isMid && "text-warning-600",
          !isGood && !isMid && "text-error-600",
        )}
      >
        {score}
      </span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-quaternary">/100</span>
      <span
        className={cx(
          "mt-1.5 text-xs font-bold",
          isGood && "text-success-700",
          isMid && "text-warning-700",
          !isGood && !isMid && "text-error-700",
        )}
      >
        {isGood ? "Saudável" : isMid ? "Atenção" : "Crítico"}
      </span>
    </div>
  );
}

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);

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

  const koinBenchmark = KOIN_PERFORMANCE_DEFAULTS[assessment.vertical] ?? KOIN_PERFORMANCE_DEFAULTS["Outro"];
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

  return (
    <div className="mx-auto max-w-[1400px] animate-in px-4 py-8 fade-in duration-700 sm:px-6 lg:px-8">
      <Breadcrumbs className="mb-4">
        <Breadcrumbs.Item href="/calculadora">Calculadora</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/calculadora/new">Análise</Breadcrumbs.Item>
        <Breadcrumbs.Item>{assessment.merchant_name}</Breadcrumbs.Item>
      </Breadcrumbs>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-secondary bg-primary px-6 py-5 shadow-xs ring-1 ring-secondary ring-inset sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gray-900">
            <span className="text-sm font-bold text-white">{assessment.merchant_name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-primary">{assessment.merchant_name}</h1>
              <Badge type="pill-color" color="gray" size="sm">
                {assessment.vertical}
              </Badge>
              <Badge type="pill-color" color="gray" size="sm">
                {assessment.modelo_negocio}
              </Badge>
              <Badge type="pill-color" color="gray" size="sm">
                {assessment.solucao_atual}
              </Badge>
            </div>
            <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-quaternary">
              <span>Gerado em {formatDate(assessment.updated_at)}</span>
              <span aria-hidden>·</span>
              <span>{assessment.volume_mensal} transações/mês</span>
              <span aria-hidden>·</span>
              <span>Ticket médio {formatCurrency(assessment.ticket_medio)}</span>
              <span aria-hidden>·</span>
              <span>{assessment.pct_volume_cartao}% cartão</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            color="secondary"
            size="md"
            href={`/calculadora/${id}/export`}
            target="_blank"
            rel="noopener noreferrer"
            iconLeading={Download01}
          >
            Exportar PDF
          </Button>
          <Button color="primary" size="md" href={`/calculadora/new?id=${id}`} iconLeading={Edit01}>
            Editar dados
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompareCard
          title="Aprovação"
          todayLabel="Hoje"
          koinLabel="Com Koin"
          todayValue={aprAtual}
          koinValue={aprKoin}
          delta={aprDelta}
          format="percent"
          deltaFormat="pp"
          todaySub={`${txnApr} txns`}
          koinSub={`${txnAprK} txns`}
        />
        <CompareCard
          title="Decline"
          todayLabel="Hoje"
          koinLabel="Com Koin"
          todayValue={decAtual}
          koinValue={decKoin}
          delta={decKoin - decAtual}
          format="percent"
          deltaFormat="pp"
          invertDelta
          todaySub={`${txnDec} txns`}
          koinSub={`${txnDecK} txns`}
        />
        <CompareCard
          title="Chargeback"
          todayLabel="Hoje"
          koinLabel="Com Koin"
          todayValue={cbAtual}
          koinValue={cbKoin}
          delta={-koinBenchmark.reducao_chargeback}
          format="percent"
          deltaFormat="pct"
          invertDelta
          todaySub={cbAtual > 1 ? "Acima do limite" : "Dentro do limite"}
          koinSub="Estimativa"
        />
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5 text-white shadow-xs ring-1 ring-gray-800 ring-inset">
          <div className="mb-4 flex items-center gap-2">
            <CurrencyDollar className="size-4 text-success-400" data-icon />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">ROI anual</span>
          </div>
          <p className="mb-1 text-3xl font-bold text-white">{formatCurrency(projection.roi_anual_estimado)}</p>
          <p className="mb-4 text-xs text-gray-400">Estimativa conservadora</p>
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Lift mensal</span>
              <span className="font-semibold text-success-400">+{formatCurrency(projection.lift_receita_mensal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Segmento</span>
              <span className="font-medium text-gray-300">{assessment.vertical}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex w-full max-w-2xl gap-1 rounded-xl border border-secondary bg-primary p-1 shadow-xs ring-1 ring-secondary ring-inset sm:w-fit">
        <Button
          color="tertiary"
          size="md"
          className="flex-1 sm:flex-none"
          onClick={() => document.getElementById("diagnostic")?.scrollIntoView({ behavior: "smooth" })}
          iconLeading={ShieldTick}
        >
          {criticalCount > 0 ? `Diagnóstico (${criticalCount})` : "Diagnóstico"}
        </Button>
        <Button
          color="tertiary"
          size="md"
          className="flex-1 sm:flex-none"
          onClick={() => document.getElementById("projection")?.scrollIntoView({ behavior: "smooth" })}
          iconLeading={TrendUp01}
        >
          Projeção de ROI
        </Button>
      </div>

      <div id="diagnostic" className="mb-10 scroll-mt-32">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-primary">Diagnóstico inteligente</h2>
              <span className="text-sm text-tertiary">
                {criticalCount} crítico{criticalCount !== 1 ? "s" : ""}
                {warningCount > 0 && (
                  <>
                    {" "}
                    · {warningCount} moderado{warningCount !== 1 ? "s" : ""}
                  </>
                )}
              </span>
              <Button color="tertiary" size="sm" isDisabled>
                Adicionar mais
              </Button>
            </div>
            <p className="mt-1 text-sm text-tertiary">
              {diagnostics.length} gatilho{diagnostics.length !== 1 ? "s" : ""} detectado{diagnostics.length !== 1 ? "s" : ""}
            </p>
          </div>
          <HealthScoreRing score={healthScore} />
        </div>

        {criticalCount > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-error-200 bg-error-50 p-4 ring-1 ring-error-100 ring-inset">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-fg-error-secondary" />
            <div>
              <p className="text-sm font-semibold text-error-primary">
                {criticalCount} alerta{criticalCount !== 1 ? "s" : ""} crítico{criticalCount !== 1 ? "s" : ""} identificado
                {criticalCount !== 1 ? "s" : ""}
              </p>
              <p className="mt-0.5 text-xs text-error-primary">Riscos imediatos a tratar com prioridade.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {diagnostics.map((insight) => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              priority={insight.priority}
              category={insight.category}
              insight={insight.insight}
              ruleId={insight.id}
            />
          ))}
        </div>
      </div>

      <div id="projection" className="scroll-mt-32">
        <h2 className="mb-6 text-xl font-semibold text-primary">Projeção de ROI</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs ring-1 ring-secondary ring-inset">
            <div className="border-b border-secondary px-6 pb-4 pt-6">
              <h3 className="text-base font-semibold text-primary">Detalhamento financeiro</h3>
            </div>
            <div className="p-6">
              {[
                { label: "Receita atual em cartão (mês)", value: formatCurrency(projection.receita_atual_cartao), color: "" },
                { label: "Lift de receita mensal (estimado)", value: `+${formatCurrency(projection.lift_receita_mensal)}`, color: "text-success-primary" },
                {
                  label: "Lift de receita anual (estimado)",
                  value: formatCurrency(projection.lift_receita_anual),
                  color: "font-bold text-primary",
                },
                {
                  label: "Redução de chargeback estimada",
                  value: `-${formatPercent(projection.reducao_chargeback_estimada * 100, 2)}`,
                  color: "text-success-primary",
                },
                { label: "ROI anual estimado", value: formatCurrency(projection.roi_anual_estimado), color: "font-bold text-primary" },
              ].map(({ label, value, color }, i) => (
                <div
                  key={label}
                  className={cx(
                    "flex items-center justify-between border-b border-secondary py-3 last:border-0",
                    i === 0 && "pt-0",
                  )}
                >
                  <span className="text-sm text-tertiary">{label}</span>
                  <span className={cx("text-sm font-semibold text-secondary", color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs ring-1 ring-secondary ring-inset">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Users01 className="size-4 text-fg-quaternary" />
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold text-primary">Solução atual: {assessment.solucao_atual}</p>
                  <p className="text-xs leading-relaxed text-tertiary">
                    {assessment.modelo_negocio} · {assessment.pct_volume_cartao}% cartão · Ticket {formatCurrency(assessment.ticket_medio)}
                  </p>
                </div>
              </div>
            </div>
            {projection.disclaimer && (
              <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-primary p-4 ring-1 ring-warning-100 ring-inset">
                <InfoCircle className="mt-0.5 size-4 shrink-0 text-fg-warning-secondary" />
                <p className="text-xs leading-relaxed text-warning-primary">{projection.disclaimer}</p>
              </div>
            )}
            <div className="flex items-start gap-3 rounded-xl border border-secondary bg-secondary p-4 ring-1 ring-primary ring-inset">
              <InfoCircle className="mt-0.5 size-4 shrink-0 text-quaternary" />
              <p className="text-xs leading-relaxed text-tertiary">
                Projeções com benchmarks conservadores (+3pp de lift). Não inclui custo da solução Koin. Resultados reais dependem de implementação e qualidade dos dados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button color="secondary" size="md" className="shadow-lg" iconLeading={MessageChatCircle} isDisabled>
          Pergunte sobre a análise
        </Button>
      </div>
    </div>
  );
}
