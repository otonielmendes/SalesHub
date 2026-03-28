export type BacktestStatus = "processing" | "ready" | "error";

export interface Backtest {
  id: string;
  user_id: string;
  prospect_name: string;
  filename: string;
  created_at: string;
  row_count: number | null;
  fraud_count: number | null;
  metrics_json: BacktestMetrics | null;
  ai_insights_json: AiInsights | null;
}

export interface BacktestFile {
  id: string;
  backtest_id: string;
  storage_path: string;
  uploaded_at: string;
}

/** Which analysis blocks apply to this dataset (from column detection). */
export interface BacktestCapabilities {
  comparativo: boolean;
  revenueRecovery: boolean;
  confusionMatrix: boolean;
  financialImpact: boolean;
  riskByItem: boolean;
  riskByBin: boolean;
  riskByEmail: boolean;
  riskByDocument: boolean;
  riskByEmailDomain: boolean;
  riskByPhone: boolean;
  highVelocity: boolean;
  cardBrand: boolean;
  delivery: boolean;
  devoluciones: boolean;
  /** Valor protegido / GMV — precisa coluna amount */
  roi: boolean;
}

/** Detected CSV columns — null means the column was not found in this CSV. */
export interface CsvColumnMap {
  amount: string | null;
  paymentStatus: string | null;
  fraud: string | null;
  koinDecision: string | null;
  item: string | null;
  cardBrand: string | null;
  date: string | null;
  delivery: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  bin: string | null;
  orderId: string | null;
}

export interface ParsedRow {
  amount: number | null;
  paymentStatus: string | null;
  fraud: boolean | null;
  koinDecision: string | null;
  item: string | null;
  cardBrand: string | null;
  date: string | null;
  delivery: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  bin: string | null;
  orderId: string | null;
  /** Raw original row, preserved for export. */
  _raw: Record<string, string>;
}

export interface ConfusionMatrix {
  tp: number;
  fn: number;
  fp: number;
  tn: number;
  detectionRate: number;
}

export interface BacktestMetrics {
  totalRows: number;

  /** Present when calculated from a fresh parse; omitted in legacy saved JSON. */
  capabilities?: BacktestCapabilities;

  /** Payment status comparison */
  approvalRateToday: number;
  approvalRateKoin: number;
  rejectionRateToday: number;
  rejectionRateKoin: number;
  fraudRateApprovedToday: number;
  fraudRateApprovedKoin: number;

  /** Revenue Recovery */
  recoverableTransactions: number;
  recoverableVolume: number;
  recoveredRejectionPct: number;

  /** Confusion matrix */
  confusionMatrix: ConfusionMatrix | null;

  /** Financial impact */
  totalFraudAmount: number | null;
  preventedFraudAmount: number | null;
  residualFraudAmount: number | null;
  preventedPct: number | null;

  /** Risk tables */
  riskByItem: RiskEntry[] | null;
  riskByBin: RiskEntry[] | null;
  riskByEmail: RiskEntry[] | null;
  riskByDocument: RiskEntry[] | null;
  riskByEmailDomain: RiskEntry[] | null;
  riskByPhone: RiskEntry[] | null;
  highVelocityDocuments: VelocityEntry[] | null;

  /** Distribution */
  cardBrandDistribution: DistributionEntry[] | null;
  deliveryDistribution: DistributionEntry[] | null;
  devolucionCount: number | null;
  /** Devoluções cruzadas com veredicto Koin (PRD) */
  devolucionKoinRejectCount: number | null;
  devolucionAvoidablePct: number | null;

  /** GMV = soma dos amounts; valor protegido = fraude prevenida + volume recuperável */
  totalGmv: number | null;
  protectedValue: number | null;
  /** protectedValue / totalGmv quando GMV > 0 */
  valueImpactRatio: number | null;

  /** Documentos com ≥2 fraudes: quantas a Koin teria rejeitado */
  recurrentFraudKoin: RecurrentFraudKoinEntry[] | null;
}

export interface RecurrentFraudKoinEntry {
  document: string;
  fraudEvents: number;
  koinRejected: number;
}

export interface RiskEntry {
  key: string;
  total: number;
  fraudCount: number;
  fraudRate: number;
  /** Soma de amount nas linhas com fraude para esta chave; null se sem coluna amount */
  fraudAmount?: number | null;
}

export interface VelocityEntry {
  document: string;
  total: number;
  fraudCount: number;
  koinRejectCount: number;
  /** Soma de amount para o documento; null se sem coluna amount */
  volume: number | null;
}

export interface DistributionEntry {
  key: string;
  count: number;
  pct: number;
}

export interface AiInsightItem {
  severity: "critical" | "moderate" | "informative";
  title: string;
  description: string;
}

export interface AiInsights {
  insights: AiInsightItem[];
  generatedAt: string;
}
