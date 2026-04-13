import { VOLUME_MAP, KOIN_EXPECTED_LIFT, type CostSettings, KOIN_COST_DEFAULTS } from "./benchmarks";

export interface ProjectionInput {
  volume_faixa: string;
  pct_volume_cartao: number;
  ticket_medio: number;
  taxa_aprovacao: number;
  taxa_chargeback: number;
  // Campos opcionais — quando presentes, enriquecem o ROI com custos operacionais
  pct_revisao_manual?: number;
  challenge_rate_3ds?: number;
  costs?: CostSettings;
}

export interface ProjectionResult {
  volume_mensal: number;
  volume_cartao: number;
  receita_atual_cartao: number;
  receita_projetada_koin: number;
  lift_receita_mensal: number;
  lift_receita_anual: number;
  reducao_chargeback_estimada: number;
  // Economia operacional (zero quando campos opcionais não são fornecidos)
  economia_revisao_mensal: number;
  economia_revisao_anual: number;
  economia_3ds_mensal: number;
  economia_3ds_anual: number;
  economia_chargeback_mensal: number;
  economia_chargeback_anual: number;
  // ROI final consolidado
  roi_anual_estimado: number;
  disclaimer?: string;
}

export function calculateProjections(input: ProjectionInput): ProjectionResult {
  const costs = input.costs ?? KOIN_COST_DEFAULTS;

  const volume_mensal = VOLUME_MAP[input.volume_faixa] || 0;
  const volume_cartao = volume_mensal * (input.pct_volume_cartao / 100);

  // --- Receita: lift de aprovação ---
  const taxa_aprovacao_atual = input.taxa_aprovacao / 100;
  const receita_atual_cartao = volume_cartao * input.ticket_medio * taxa_aprovacao_atual;

  const lift_pp = Math.min(KOIN_EXPECTED_LIFT, 100 - input.taxa_aprovacao);
  const taxa_aprovacao_koin = (input.taxa_aprovacao + lift_pp) / 100;
  const receita_projetada_koin = volume_cartao * input.ticket_medio * taxa_aprovacao_koin;

  const lift_receita_mensal = receita_projetada_koin - receita_atual_cartao;
  const lift_receita_anual = lift_receita_mensal * 12;

  // --- Chargeback: redução estimada e monetização ---
  const reducao_chargeback_estimada = input.taxa_chargeback * 0.2;
  const economia_chargeback_mensal =
    volume_cartao * input.ticket_medio * (reducao_chargeback_estimada / 100);
  const economia_chargeback_anual = economia_chargeback_mensal * 12;

  // --- Revisão manual ---
  const transacoes_em_revisao =
    input.pct_revisao_manual != null
      ? volume_cartao * (input.pct_revisao_manual / 100)
      : 0;
  const economia_revisao_mensal =
    transacoes_em_revisao *
    costs.custo_por_revisao_manual *
    (costs.reducao_revisao_manual_koin / 100);
  const economia_revisao_anual = economia_revisao_mensal * 12;

  // --- 3DS challenge ---
  const transacoes_com_challenge =
    input.challenge_rate_3ds != null
      ? volume_cartao * (input.challenge_rate_3ds / 100)
      : 0;
  // Custo direto de rede + receita recuperada pelo menor abandono
  const economia_custo_direto_3ds =
    transacoes_com_challenge * costs.custo_por_3ds_challenge * 0.6; // Koin reduz ~60% dos challenges
  const receita_recuperada_3ds =
    transacoes_com_challenge *
    (costs.taxa_abandono_3ds / 100) *
    input.ticket_medio *
    0.6;
  const economia_3ds_mensal = economia_custo_direto_3ds + receita_recuperada_3ds;
  const economia_3ds_anual = economia_3ds_mensal * 12;

  // --- ROI consolidado ---
  const custo_koin_estimado = receita_projetada_koin * 0.005;
  const roi_anual_estimado =
    lift_receita_anual +
    economia_revisao_anual +
    economia_3ds_anual +
    economia_chargeback_anual -
    custo_koin_estimado * 12;

  let disclaimer = "";
  if (input.pct_volume_cartao === 0) {
    disclaimer = "Sem volume em cartão, projeção de ROI não aplicável.";
  } else if (input.ticket_medio > 50000) {
    disclaimer =
      "Projeção de ROI pode ser superestimada para tickets muito altos. Validar com dados históricos reais.";
  }

  return {
    volume_mensal,
    volume_cartao,
    receita_atual_cartao,
    receita_projetada_koin,
    lift_receita_mensal,
    lift_receita_anual,
    reducao_chargeback_estimada,
    economia_revisao_mensal,
    economia_revisao_anual,
    economia_3ds_mensal,
    economia_3ds_anual,
    economia_chargeback_mensal,
    economia_chargeback_anual,
    roi_anual_estimado,
    disclaimer,
  };
}
