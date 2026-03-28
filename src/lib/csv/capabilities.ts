import type { BacktestCapabilities, ParsedRow } from "@/types/backtest";

/** Derive which dashboard blocks are valid for this CSV (blueprint / PRD). */
export function deriveCapabilities(rows: ParsedRow[]): BacktestCapabilities {
  if (rows.length === 0) {
    return {
      comparativo: false,
      revenueRecovery: false,
      confusionMatrix: false,
      financialImpact: false,
      riskByItem: false,
      riskByBin: false,
      riskByEmail: false,
      riskByDocument: false,
      riskByEmailDomain: false,
      riskByPhone: false,
      highVelocity: false,
      cardBrand: false,
      delivery: false,
      devoluciones: false,
      roi: false,
    };
  }

  const r = rows[0];
  const hasPayment = r.paymentStatus !== null;
  const hasKoin = r.koinDecision !== null;
  const hasFraud = r.fraud !== null;
  const hasAmount = r.amount !== null;

  return {
    comparativo: hasPayment && hasKoin && hasFraud,
    revenueRecovery: hasPayment && hasKoin && hasFraud && hasAmount,
    confusionMatrix: hasKoin && hasFraud,
    financialImpact: hasKoin && hasFraud && hasAmount,
    riskByItem: r.item !== null && hasFraud,
    riskByBin: r.bin !== null && hasFraud,
    riskByEmail: r.email !== null && hasFraud,
    riskByDocument: r.document !== null && hasFraud,
    riskByEmailDomain: r.email !== null && hasFraud,
    riskByPhone: r.phone !== null && hasFraud,
    highVelocity: r.document !== null,
    cardBrand: r.cardBrand !== null,
    delivery: r.delivery !== null,
    devoluciones: hasPayment,
    roi: hasAmount && (hasFraud || (hasPayment && hasKoin)),
  };
}
