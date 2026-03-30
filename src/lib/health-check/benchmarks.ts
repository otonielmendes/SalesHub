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
