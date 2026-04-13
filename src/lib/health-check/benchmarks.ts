export interface BenchmarkData {
  vertical: string;
  taxa_aprovacao: number;
  taxa_chargeback: number;
}

export interface KoinPerformanceData {
  vertical: string;
  taxa_aprovacao_koin: number;
  taxa_chargeback_koin: number;
  lift_aprovacao: number;
  reducao_chargeback: number;
}

export const BENCHMARKS: Record<string, BenchmarkData> = {
  "E-commerce":    { vertical: "E-commerce",    taxa_aprovacao: 88, taxa_chargeback: 0.8 },
  "Fintech":       { vertical: "Fintech",        taxa_aprovacao: 91, taxa_chargeback: 0.4 },
  "Marketplace":   { vertical: "Marketplace",    taxa_aprovacao: 85, taxa_chargeback: 1.2 },
  "Delivery":      { vertical: "Delivery",       taxa_aprovacao: 87, taxa_chargeback: 0.9 },
  "Digital Goods": { vertical: "Digital Goods",  taxa_aprovacao: 92, taxa_chargeback: 0.5 },
  "Travel":        { vertical: "Travel",         taxa_aprovacao: 86, taxa_chargeback: 1.0 },
  "Subscription":  { vertical: "Subscription",   taxa_aprovacao: 90, taxa_chargeback: 0.6 },
  "Outro":         { vertical: "Outro",          taxa_aprovacao: 88, taxa_chargeback: 0.8 },
};

export const KOIN_PERFORMANCE_DEFAULTS: Record<string, KoinPerformanceData> = {
  "E-commerce":    { vertical: "E-commerce",    taxa_aprovacao_koin: 91, taxa_chargeback_koin: 0.45, lift_aprovacao: 3, reducao_chargeback: 44 },
  "Fintech":       { vertical: "Fintech",        taxa_aprovacao_koin: 94, taxa_chargeback_koin: 0.22, lift_aprovacao: 3, reducao_chargeback: 45 },
  "Marketplace":   { vertical: "Marketplace",    taxa_aprovacao_koin: 88, taxa_chargeback_koin: 0.65, lift_aprovacao: 3, reducao_chargeback: 46 },
  "Delivery":      { vertical: "Delivery",       taxa_aprovacao_koin: 90, taxa_chargeback_koin: 0.50, lift_aprovacao: 3, reducao_chargeback: 44 },
  "Digital Goods": { vertical: "Digital Goods",  taxa_aprovacao_koin: 95, taxa_chargeback_koin: 0.28, lift_aprovacao: 3, reducao_chargeback: 44 },
  "Travel":        { vertical: "Travel",         taxa_aprovacao_koin: 89, taxa_chargeback_koin: 0.55, lift_aprovacao: 3, reducao_chargeback: 45 },
  "Subscription":  { vertical: "Subscription",   taxa_aprovacao_koin: 93, taxa_chargeback_koin: 0.33, lift_aprovacao: 3, reducao_chargeback: 45 },
  "Outro":         { vertical: "Outro",          taxa_aprovacao_koin: 91, taxa_chargeback_koin: 0.45, lift_aprovacao: 3, reducao_chargeback: 44 },
};

export const VOLUME_MAP: Record<string, number> = {
  "< 10k":      5_000,
  "10k–50k":   30_000,
  "50k–200k": 125_000,
  "200k–1M":  600_000,
  "> 1M":   1_500_000,
};

export const KOIN_EXPECTED_LIFT = 3;

// ---------------------------------------------------------------------------
// Custos Operacionais
// ---------------------------------------------------------------------------

export interface CostSettings {
  /** Custo médio por transação em revisão manual (R$) — salário analista + overhead */
  custo_por_revisao_manual: number;
  /** Redução esperada na fila de revisão manual com Koin (%) */
  reducao_revisao_manual_koin: number;
  /** Taxa direta de rede/processador por transação com 3DS challenge (R$) */
  custo_por_3ds_challenge: number;
  /** Taxa estimada de abandono de carrinho por challenge 3DS (%) */
  taxa_abandono_3ds: number;
}

/**
 * Defaults baseados em benchmarks da indústria:
 * - Revisão manual: ~R$ 4,50/análise (analista júnior Brasil + encargos, ~5,6 min/análise — MRC 2024)
 * - Redução revisão: 70% (automação de triagem com Koin)
 * - Custo 3DS: R$ 0,30/challenge (taxa direta de rede — Braintree/Adyen: $0,10–$0,30)
 * - Abandono 3DS: 15% das transações com challenge (benchmarks de conversão e-commerce)
 */
export const KOIN_COST_DEFAULTS: CostSettings = {
  custo_por_revisao_manual: 4.5,
  reducao_revisao_manual_koin: 70,
  custo_por_3ds_challenge: 0.3,
  taxa_abandono_3ds: 15,
};

export const KOIN_COST_SETTINGS_KEY = "koin_cost_settings";

export function getCostSettings(): CostSettings {
  if (typeof window === "undefined") return KOIN_COST_DEFAULTS;
  try {
    const raw = localStorage.getItem(KOIN_COST_SETTINGS_KEY);
    if (!raw) return KOIN_COST_DEFAULTS;
    return { ...KOIN_COST_DEFAULTS, ...(JSON.parse(raw) as Partial<CostSettings>) };
  } catch {
    return KOIN_COST_DEFAULTS;
  }
}

export const KOIN_SETTINGS_KEY = "koin_performance_settings";

export function getKoinSettings(): Record<string, KoinPerformanceData> {
  if (typeof window === "undefined") return KOIN_PERFORMANCE_DEFAULTS;
  try {
    const raw = localStorage.getItem(KOIN_SETTINGS_KEY);
    if (!raw) return KOIN_PERFORMANCE_DEFAULTS;
    const saved = JSON.parse(raw) as Partial<Record<string, Partial<KoinPerformanceData>>>;
    const merged: Record<string, KoinPerformanceData> = { ...KOIN_PERFORMANCE_DEFAULTS };
    for (const [vertical, override] of Object.entries(saved)) {
      if (merged[vertical] && override) {
        merged[vertical] = { ...merged[vertical], ...override };
      }
    }
    return merged;
  } catch {
    return KOIN_PERFORMANCE_DEFAULTS;
  }
}
