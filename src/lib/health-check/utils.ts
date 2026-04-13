import { DEFAULT_CURRENCY_CODE, getCurrencyMeta } from "./currency";

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatCurrency(value: number, currencyCode: string = DEFAULT_CURRENCY_CODE): string {
  const meta = getCurrencyMeta(currencyCode);
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
