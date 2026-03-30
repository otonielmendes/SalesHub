import { VOLUME_MAP, KOIN_EXPECTED_LIFT } from "./benchmarks";

export interface ProjectionInput {
  volume_faixa: string;
  pct_volume_cartao: number;
  ticket_medio: number;
  taxa_aprovacao: number;
  taxa_chargeback: number;
}

export interface ProjectionResult {
  volume_mensal: number;
  volume_cartao: number;
  receita_atual_cartao: number;
  receita_projetada_koin: number;
  lift_receita_mensal: number;
  lift_receita_anual: number;
  reducao_chargeback_estimada: number;
  roi_anual_estimado: number;
  disclaimer?: string;
}

export function calculateProjections(input: ProjectionInput): ProjectionResult {
  const volume_mensal = VOLUME_MAP[input.volume_faixa] || 0;
  const volume_cartao = volume_mensal * (input.pct_volume_cartao / 100);

  const taxa_aprovacao_atual = input.taxa_aprovacao / 100;
  const receita_atual_cartao = volume_cartao * input.ticket_medio * taxa_aprovacao_atual;

  const lift_pp = Math.min(KOIN_EXPECTED_LIFT, 100 - input.taxa_aprovacao);
  const taxa_aprovacao_koin = (input.taxa_aprovacao + lift_pp) / 100;
  const receita_projetada_koin = volume_cartao * input.ticket_medio * taxa_aprovacao_koin;

  const lift_receita_mensal = receita_projetada_koin - receita_atual_cartao;
  const lift_receita_anual = lift_receita_mensal * 12;

  const reducao_chargeback_estimada = input.taxa_chargeback * 0.2;

  const custo_koin_estimado = receita_projetada_koin * 0.005;
  const roi_anual_estimado = lift_receita_anual - custo_koin_estimado * 12;

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
    roi_anual_estimado,
    disclaimer,
  };
}
