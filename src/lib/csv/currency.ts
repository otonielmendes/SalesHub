import type { CurrencyInfo } from "@/types/backtest";

/** Default currency when detection fails or for legacy saved records. */
export const DEFAULT_CURRENCY: CurrencyInfo = {
  code: "ARS",
  prefix: "ARS",
  locale: "es-AR",
};

/**
 * Detect currency from a sample of raw amount strings from the CSV.
 * Checks the first 20 non-empty values.
 *
 * Rules (in priority order):
 *  1. Contains "R$"          → BRL (pt-BR)
 *  2. Contains "MXN" / "MX$" → MXN (es-MX)
 *  3. $ + dot-thousands      → ARS (es-AR)  e.g. "$ 1.029.649"
 *  4. $ + comma-thousands    → USD (en-US)  e.g. "$1,029,649"
 *  Default: ARS
 */
export function detectCurrency(rawAmountSamples: string[]): CurrencyInfo {
  const samples = rawAmountSamples.filter(Boolean).slice(0, 20);
  const joined = samples.join(" ");

  if (/R\$/.test(joined)) {
    return { code: "BRL", prefix: "R$", locale: "pt-BR" };
  }

  if (/MXN|MX\$/.test(joined)) {
    return { code: "MXN", prefix: "MXN", locale: "es-MX" };
  }

  // ARS pattern: dollar sign followed by digits+dots (dot = thousands separator)
  // e.g. "$ 1.029.649" or "$1.029,49"
  if (/\$\s*\d{1,3}(\.\d{3})+/.test(joined)) {
    return { code: "ARS", prefix: "ARS", locale: "es-AR" };
  }

  // USD pattern: dollar sign followed by digits+commas (comma = thousands separator)
  // e.g. "$1,029,649"
  if (/\$\s*\d{1,3}(,\d{3})+/.test(joined)) {
    return { code: "USD", prefix: "USD", locale: "en-US" };
  }

  return DEFAULT_CURRENCY;
}

/**
 * Compact formatter for hero numbers.
 * e.g. formatCompact(58_035_747_549, arsInfo) → "ARS 58.04B"
 */
export function formatCompact(
  n: number | null | undefined,
  currency: CurrencyInfo,
): string {
  if (n == null || !isFinite(n)) return "—";
  const { prefix } = currency;
  if (n >= 1_000_000_000) return `${prefix} ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${prefix} ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix} ${(n / 1_000).toFixed(1)}K`;
  return `${prefix} ${n.toLocaleString(currency.locale, { maximumFractionDigits: 0 })}`;
}

/**
 * Full formatter for table cells.
 * e.g. formatFull(1_029_649, arsInfo) → "ARS 1.029.649"
 */
export function formatFull(
  n: number | null | undefined,
  currency: CurrencyInfo,
): string {
  if (n == null || !isFinite(n)) return "—";
  return `${currency.prefix} ${n.toLocaleString(currency.locale, {
    maximumFractionDigits: 0,
  })}`;
}
