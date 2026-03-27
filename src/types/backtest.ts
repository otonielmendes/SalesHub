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
}

export interface RiskEntry {
  key: string;
  total: number;
  fraudCount: number;
  fraudRate: number;
}

export interface VelocityEntry {
  document: string;
  total: number;
  fraudCount: number;
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
