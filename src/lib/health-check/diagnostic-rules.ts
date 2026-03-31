import { BENCHMARKS } from "./benchmarks";
export type { DiagnosticInsight } from "./types";
import { DiagnosticInsight } from "./types";

export interface DashboardInput {
  vertical: string;
  ticket_medio: number;
  taxa_aprovacao: number;
  taxa_chargeback: number;
  taxa_decline: number;
  taxa_false_decline?: number;
  pct_revisao_manual: number;
  solucao_atual: string;
  challenge_rate_3ds: number;
  challenge_rate_outras: number;
  device_fingerprinting: string;
  origem_fraude: string[];
  dor: string[];
  validacao_identidade_onboarding: string;
  tem_programa_fidelidade: string;
  monitora_behavioral_signals: string;
  modelo_negocio: string;
  tem_regras_customizadas: string;
  opera_crossborder: string;
}

export function generateDiagnostics(input: DashboardInput): DiagnosticInsight[] {
  const insights: DiagnosticInsight[] = [];
  const benchmark = BENCHMARKS[input.vertical] || BENCHMARKS["Outro"];

  // REGRA 01 — Chargeback acima do limite
  if (input.taxa_chargeback > 1.0) {
    insights.push({
      id: "REGRA 01",
      priority: "CRITICAL",
      title: "Chargeback acima do limite",
      category: "Chargeback",
      insight:
        "Sua taxa de chargeback está acima do limite de 1% das bandeiras. Isso pode resultar em multas, programas de monitoramento (VDMP/BRAM) ou até perda do merchant account. Implementar 3DS condicional pode reduzir chargebacks em 30-50%.",
      recommendation:
        "Implementar 3DS condicional para transações de alto risco e revisar as regras de aprovação. Programas de monitoramento como VDMP e BRAM têm tolerância zero — é urgente reverter essa tendência antes de penalidades.",
    });
  }

  // REGRA 02 — False declines silenciosos
  if (input.taxa_decline > 15 && (!input.taxa_false_decline || input.taxa_false_decline > 5)) {
    insights.push({
      id: "REGRA 02",
      priority: "CRITICAL",
      title: "False declines silenciosos",
      category: "Aprovação",
      insight: `Com ${input.taxa_decline}% de declines, você está potencialmente recusando um volume significativo de clientes legítimos. False declines custam até 75x mais que a fraude em si.`,
      recommendation:
        "Calibrar o modelo de risco com dados históricos para identificar padrões de falso declínio. Machine learning supervisionado pode reduzir falsos positivos em 60-70%, recuperando receita perdida desnecessariamente.",
    });
  }

  // REGRA 03 — Revisão manual sobrecarregada
  if (input.pct_revisao_manual > 10) {
    insights.push({
      id: "REGRA 03",
      priority: "WARNING",
      title: "Revisão manual sobrecarregada",
      category: "Operação",
      insight: `Com ${input.pct_revisao_manual}% das transações indo para revisão manual, sua operação está sobrecarregada. Automatizar a triagem pode reduzir revisão manual em até 80%.`,
      recommendation:
        "Implementar triagem automatizada baseada em score de risco para reduzir filas manuais. Regras customizadas de pré-aprovação para perfis conhecidos podem eliminar até 80% do volume de revisão.",
    });
  }

  // REGRA 04 — Dependência excessiva de 3DS
  if (input.challenge_rate_3ds > 40) {
    insights.push({
      id: "REGRA 04",
      priority: "WARNING",
      title: "Dependência excessiva de 3DS",
      category: "Conversão",
      insight: `Enviar ${input.challenge_rate_3ds}% das transações para 3DS indica dependência do issuer. 3DS em excesso cria fricção desnecessária.`,
      recommendation:
        "Adotar 3DS inteligente com friction-less para clientes conhecidos e challenge apenas para perfis de alto risco. A aplicação seletiva reduz abandono de carrinho sem comprometer a segurança.",
    });
  }

  // REGRA 06 — Sem device fingerprinting + fraude de contas novas
  if (input.device_fingerprinting === "Não" && input.origem_fraude.includes("Contas novas")) {
    insights.push({
      id: "REGRA 06",
      priority: "CRITICAL",
      title: "Fraude em contas novas s/ Fingerprint",
      category: "Tecnologia",
      insight:
        "Sem device fingerprinting, emuladores e multi-accounting passam despercebidos. Implementar verificação de integridade do device é prioridade imediata.",
      recommendation:
        "Implementar device fingerprinting e behavioral analytics para detectar emuladores, device farms e padrões de multi-accounting antes da transação ser processada.",
    });
  }

  // REGRA 07 — ATO sem validação de identidade
  if (
    input.dor.includes("Account Takeover (ATO)") &&
    (input.validacao_identidade_onboarding === "Não" ||
      input.validacao_identidade_onboarding === "Parcial")
  ) {
    insights.push({
      id: "REGRA 07",
      priority: "CRITICAL",
      title: "ATO sem validação de identidade",
      category: "ATO",
      insight:
        "Se Account Takeover é uma dor e o onboarding não valida identidade de forma robusta, o atacante já entra com vantagem.",
      recommendation:
        "Implementar validação de identidade robusta no onboarding: biometria facial, verificação de documento e análise comportamental para detectar ATOs em tempo real.",
    });
  }

  // REGRA 15 — Taxa de aprovação saudável mas chargeback alto
  if (input.taxa_aprovacao > 90 && input.taxa_chargeback > 0.8) {
    insights.push({
      id: "REGRA 15",
      priority: "CRITICAL",
      title: "Aprovação alta com Chargeback alto",
      category: "Chargeback",
      insight:
        "Indica que o sistema está deixando fraude passar. O equilíbrio está comprometido — aprovar mais não é bom se as aprovações são fraudulentas.",
      recommendation:
        "Revisar os critérios de aprovação e implementar regras baseadas em velocidade e padrão de comportamento. A aprovação sem análise de risco adequada está gerando perdas financeiras futuras.",
    });
  }

  // REGRA 16 — Taxa de aprovação muito abaixo do benchmark
  if (input.taxa_aprovacao < benchmark.taxa_aprovacao - 10) {
    insights.push({
      id: "REGRA 16",
      priority: "WARNING",
      title: "Aprovação abaixo do benchmark",
      category: "Aprovação",
      insight: `Sua taxa de aprovação está significativamente abaixo do benchmark do setor (${benchmark.taxa_aprovacao}%). Isso representa uma oportunidade substancial de recuperação de receita.`,
      recommendation:
        "Revisar as regras de declínio com dados históricos e implementar modelo de score mais preciso. A lacuna em relação ao benchmark representa receita significativa sendo deixada para trás.",
    });
  }

  // REGRA 17 — Sem solução antifraude
  if (input.solucao_atual === "Nenhuma") {
    insights.push({
      id: "REGRA 17",
      priority: "CRITICAL",
      title: "Sem Antifraude: Risco Velado",
      category: "Risco",
      insight: `O merchant opera sem nenhuma solução antifraude dedicada, uma vulnerabilidade crítica para um ${input.vertical} ${input.modelo_negocio}. Embora a taxa de chargeback de ${input.taxa_chargeback}% possa estar aparentemente controlada, isso representa um risco velado e insustentável, pois fraudadores focam em alvos desprotegidos. A projeção da Koin de reduzir significativamente o chargeback indica um potencial de 80% de chargebacks evitáveis.`,
      recommendation:
        "Implementar imediatamente uma solução antifraude robusta e baseada em machine learning. Isso não só protegerá contra fraudes futuras, mas também trará visibilidade sobre os reais vetores de risco e perdas ocultas.",
    });
  }

  // REGRA 18 — KPIs essenciais ausentes
  if (!input.pct_revisao_manual && !input.challenge_rate_3ds && !input.taxa_false_decline) {
    insights.push({
      id: "REGRA 18",
      priority: "CRITICAL",
      title: "Falta de KPIs Essenciais",
      category: "Operação",
      insight:
        "A ausência de métricas cruciais como percentual de revisão manual, challenge rate 3DS e taxa de falso declínio impede qualquer análise e otimização da performance de pagamentos e prevenção de fraudes. Sem esses dados, o merchant opera às cegas, incapaz de calibrar seu risco ou entender perdas de conversão.",
      recommendation:
        "Com a implementação de uma solução antifraude, priorizar a coleta e análise contínua desses KPIs. Isso permitirá a calibração de regras, otimização da experiência do cliente e maximização da aprovação legítima.",
    });
  }

  // REGRA 19 — Catch-all
  if (insights.length < 2) {
    insights.push({
      id: "REGRA 19",
      priority: "INFO",
      title: "Oportunidade de Otimização",
      category: "Geral",
      insight: `Com base no perfil de ${input.vertical}, os benchmarks do setor indicam oportunidades de otimização na calibração do modelo de risco.`,
      recommendation:
        "Agendar uma revisão completa dos parâmetros de risco com o time de fraudes. Pequenos ajustes calibrados em modelos existentes podem gerar ganhos expressivos de aprovação e redução de perdas.",
    });
  }

  return insights.sort((a, b) => {
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return a.id.localeCompare(b.id);
  });
}
