import type {
  BacktestMetrics,
  CurrencyInfo,
  DistributionEntry,
  ParsedRow,
  RiskEntry,
  VelocityEntry,
} from "@/types/backtest";
import { DEFAULT_CURRENCY } from "@/lib/csv/currency";
import { deriveCapabilities } from "./capabilities";
import { isDevolucion, isKoinReject, isMerchantApproved, isMerchantRejected } from "./parser";

function riskEntries(
  rows: ParsedRow[],
  keyFn: (r: ParsedRow) => string | null,
  minTotal = 1,
  minFraud = 1,
): RiskEntry[] {
  const hasAmount = rows[0]?.amount !== null;
  const map = new Map<string, { total: number; fraud: number; fraudAmount: number }>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    const entry = map.get(key) ?? { total: 0, fraud: 0, fraudAmount: 0 };
    entry.total++;
    if (row.fraud) {
      entry.fraud++;
      if (hasAmount && row.amount != null) entry.fraudAmount += row.amount;
    }
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .filter(([, v]) => v.total >= minTotal && v.fraud >= minFraud)
    .map(([key, v]) => ({
      key,
      total: v.total,
      fraudCount: v.fraud,
      fraudRate: v.fraud / v.total,
      fraudAmount: hasAmount ? v.fraudAmount : null,
    }))
    .sort((a, b) => b.fraudRate - a.fraudRate);
}

function distribution(rows: ParsedRow[], keyFn: (r: ParsedRow) => string | null): DistributionEntry[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const total = rows.length;
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count, pct: count / total }))
    .sort((a, b) => b.count - a.count);
}

function emptyMetrics(): BacktestMetrics {
  const caps = deriveCapabilities([]);
  return {
    totalRows: 0,
    capabilities: caps,
    approvalRateToday: 0,
    approvalRateKoin: 0,
    rejectionRateToday: 0,
    rejectionRateKoin: 0,
    fraudRateApprovedToday: 0,
    fraudRateApprovedKoin: 0,
    recoverableTransactions: 0,
    recoverableVolume: 0,
    recoveredRejectionPct: 0,
    confusionMatrix: null,
    totalFraudAmount: null,
    preventedFraudAmount: null,
    residualFraudAmount: null,
    preventedPct: null,
    riskByItem: null,
    riskByBin: null,
    riskByEmail: null,
    riskByDocument: null,
    riskByEmailDomain: null,
    riskByPhone: null,
    highVelocityDocuments: null,
    cardBrandDistribution: null,
    deliveryDistribution: null,
    devolucionCount: null,
    devolucionKoinRejectCount: null,
    devolucionAvoidablePct: null,
    totalGmv: null,
    protectedValue: null,
    valueImpactRatio: null,
    recurrentFraudKoin: null,
  };
}

/** Calculate all backtest metrics from parsed rows. */
export function calculateMetrics(rows: ParsedRow[], currency: CurrencyInfo = DEFAULT_CURRENCY): BacktestMetrics {
  const total = rows.length;
  if (total === 0) {
    return emptyMetrics();
  }

  const capabilities = deriveCapabilities(rows);

  const hasPaymentStatus = rows[0].paymentStatus !== null;
  const hasKoinDecision = rows[0].koinDecision !== null;
  const hasFraud = rows[0].fraud !== null;
  const hasAmount = rows[0].amount !== null;

  // --- Payment status counts ---
  const approvedToday = hasPaymentStatus ? rows.filter((r) => isMerchantApproved(r.paymentStatus ?? "")) : [];
  const rejectedToday = hasPaymentStatus ? rows.filter((r) => isMerchantRejected(r.paymentStatus ?? "")) : [];
  const acceptedKoin = hasKoinDecision ? rows.filter((r) => !isKoinReject(r.koinDecision ?? "")) : [];
  const rejectedKoin = hasKoinDecision ? rows.filter((r) => isKoinReject(r.koinDecision ?? "")) : [];

  const approvalRateToday = approvedToday.length / total;
  const approvalRateKoin = acceptedKoin.length / total;
  const rejectionRateToday = rejectedToday.length / total;
  const rejectionRateKoin = rejectedKoin.length / total;

  // --- Fraud rate in approved ---
  const fraudInApprovedToday = hasFraud ? approvedToday.filter((r) => r.fraud).length : 0;
  const fraudInApprovedKoin = hasFraud ? acceptedKoin.filter((r) => r.fraud).length : 0;
  const fraudRateApprovedToday = approvedToday.length ? fraudInApprovedToday / approvedToday.length : 0;
  const fraudRateApprovedKoin = acceptedKoin.length ? fraudInApprovedKoin / acceptedKoin.length : 0;

  // --- Revenue Recovery ---
  const recoverable =
    hasPaymentStatus && hasKoinDecision && hasFraud
      ? rows.filter(
          (r) =>
            isMerchantRejected(r.paymentStatus ?? "") &&
            !isKoinReject(r.koinDecision ?? "") &&
            !r.fraud,
        )
      : [];
  const recoverableVolume = hasAmount ? recoverable.reduce((sum, r) => sum + (r.amount ?? 0), 0) : 0;
  const recoveredRejectionPct = rejectedToday.length ? recoverable.length / rejectedToday.length : 0;

  // --- Confusion Matrix ---
  let confusionMatrix = null;
  if (hasKoinDecision && hasFraud) {
    const tp = rows.filter((r) => r.fraud && isKoinReject(r.koinDecision ?? "")).length;
    const fn = rows.filter((r) => r.fraud && !isKoinReject(r.koinDecision ?? "")).length;
    const fp = rows.filter((r) => !r.fraud && isKoinReject(r.koinDecision ?? "")).length;
    const tn = rows.filter((r) => !r.fraud && !isKoinReject(r.koinDecision ?? "")).length;
    confusionMatrix = { tp, fn, fp, tn, detectionRate: tp + fn > 0 ? tp / (tp + fn) : 0 };
  }

  // --- Financial Impact ---
  let totalFraudAmount = null;
  let preventedFraudAmount = null;
  let residualFraudAmount = null;
  let preventedPct = null;
  if (hasKoinDecision && hasFraud && hasAmount) {
    const fraudRows = rows.filter((r) => r.fraud);
    totalFraudAmount = fraudRows.reduce((s, r) => s + (r.amount ?? 0), 0);
    const prevented = fraudRows.filter((r) => isKoinReject(r.koinDecision ?? ""));
    preventedFraudAmount = prevented.reduce((s, r) => s + (r.amount ?? 0), 0);
    residualFraudAmount = totalFraudAmount - preventedFraudAmount;
    preventedPct = totalFraudAmount > 0 ? preventedFraudAmount / totalFraudAmount : 0;
  }

  // --- Risk tables ---
  const riskByItem = rows[0].item !== null ? riskEntries(rows, (r) => r.item) : null;

  const riskByBin = rows[0].bin !== null ? riskEntries(rows, (r) => r.bin, 5, 1) : null;

  const riskByEmail = rows[0].email !== null ? riskEntries(rows, (r) => r.email) : null;

  const riskByDocument = rows[0].document !== null ? riskEntries(rows, (r) => r.document) : null;

  const riskByEmailDomain = rows[0].email !== null
    ? riskEntries(rows, (r) => r.email?.split("@")[1] ?? null)
    : null;

  const riskByPhone = rows[0].phone !== null
    ? riskEntries(rows, (r) => {
        const p = r.phone ?? "";
        const digits = p.replace(/\D/g, "");
        return digits.length >= 2 ? digits.slice(0, 2) : null;
      })
    : null;

  // --- High velocity (PRD: Koin rejects + volume) ---
  let highVelocityDocuments: VelocityEntry[] | null = null;
  if (rows[0].document !== null) {
    const docMap = new Map<string, { total: number; fraud: number }>();
    for (const row of rows) {
      if (!row.document) continue;
      const entry = docMap.get(row.document) ?? { total: 0, fraud: 0 };
      entry.total++;
      if (row.fraud) entry.fraud++;
      docMap.set(row.document, entry);
    }
    highVelocityDocuments = Array.from(docMap.entries())
      .filter(([, v]) => v.total >= 10)
      .map(([doc, v]) => {
        const docRows = rows.filter((r) => r.document === doc);
        const koinRejectCount = hasKoinDecision
          ? docRows.filter((r) => isKoinReject(r.koinDecision ?? "")).length
          : 0;
        const volume = hasAmount ? docRows.reduce((s, r) => s + (r.amount ?? 0), 0) : null;
        return {
          document: doc,
          total: v.total,
          fraudCount: v.fraud,
          koinRejectCount,
          volume,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }

  // --- Distributions ---
  const cardBrandDistribution =
    rows[0].cardBrand !== null ? distribution(rows, (r) => r.cardBrand) : null;

  const deliveryDistribution =
    rows[0].delivery !== null ? distribution(rows, (r) => r.delivery) : null;

  // --- Devoluciones (PRD) ---
  const devolucionRows = hasPaymentStatus
    ? rows.filter((r) => isDevolucion(r.paymentStatus ?? ""))
    : [];
  const devolucionCount = hasPaymentStatus ? devolucionRows.length : null;
  let devolucionKoinRejectCount: number | null = null;
  let devolucionAvoidablePct: number | null = null;
  if (hasPaymentStatus && hasKoinDecision && devolucionRows.length > 0) {
    const kr = devolucionRows.filter((r) => isKoinReject(r.koinDecision ?? "")).length;
    devolucionKoinRejectCount = kr;
    devolucionAvoidablePct = kr / devolucionRows.length;
  } else if (hasPaymentStatus && hasKoinDecision && devolucionRows.length === 0) {
    devolucionKoinRejectCount = 0;
  }

  // --- Recurrent fraud × Koin (blocklist PRD) ---
  let recurrentFraudKoin = null;
  if (rows[0].document !== null && hasFraud && hasKoinDecision) {
    const m = new Map<string, { fraud: number; koinRej: number }>();
    for (const row of rows) {
      if (!row.document || !row.fraud) continue;
      const e = m.get(row.document) ?? { fraud: 0, koinRej: 0 };
      e.fraud++;
      if (isKoinReject(row.koinDecision ?? "")) e.koinRej++;
      m.set(row.document, e);
    }
    recurrentFraudKoin = Array.from(m.entries())
      .filter(([, v]) => v.fraud >= 2)
      .map(([document, v]) => ({
        document,
        fraudEvents: v.fraud,
        koinRejected: v.koinRej,
      }))
      .sort((a, b) => b.fraudEvents - a.fraudEvents);
  }

  // --- ROI proxy: valor protegido / GMV ---
  const totalGmv = hasAmount ? rows.reduce((s, r) => s + (r.amount ?? 0), 0) : null;
  const preventedNum = preventedFraudAmount ?? 0;
  const protectedValue = hasAmount ? preventedNum + recoverableVolume : null;
  const valueImpactRatio =
    totalGmv != null && totalGmv > 0 && protectedValue != null ? protectedValue / totalGmv : null;

  return {
    totalRows: total,
    capabilities,
    currency,
    approvalRateToday,
    approvalRateKoin,
    rejectionRateToday,
    rejectionRateKoin,
    fraudRateApprovedToday,
    fraudRateApprovedKoin,
    recoverableTransactions: recoverable.length,
    recoverableVolume,
    recoveredRejectionPct,
    confusionMatrix,
    totalFraudAmount,
    preventedFraudAmount,
    residualFraudAmount,
    preventedPct,
    riskByItem,
    riskByBin,
    riskByEmail,
    riskByDocument,
    riskByEmailDomain,
    riskByPhone,
    highVelocityDocuments,
    cardBrandDistribution,
    deliveryDistribution,
    devolucionCount,
    devolucionKoinRejectCount,
    devolucionAvoidablePct,
    totalGmv,
    protectedValue,
    valueImpactRatio,
    recurrentFraudKoin,
  };
}
