import type { CsvColumnMap, CurrencyInfo, ParsedRow } from "@/types/backtest";
import { DEFAULT_CURRENCY, detectCurrency } from "@/lib/csv/currency";

/** Keywords for each internal field (case-insensitive, substring match). */
const COLUMN_KEYWORDS: Record<keyof CsvColumnMap, string[]> = {
  amount: ["amount", "total", "valor", "monto"],
  paymentStatus: ["payment status", "status", "estado"],
  fraud: ["fraud", "fraude", "chargeback"],
  koinDecision: ["veredicto", "koin", "decision", "resultado"],
  item: ["item", "product", "producto", "categoria"],
  cardBrand: ["card brand", "brand", "marca", "bandeira"],
  date: ["date", "fecha", "data"],
  delivery: ["delivery", "envio", "entrega"],
  document: ["identification", "document", "cpf", "dni", "documento"],
  email: ["email", "correo", "e-mail"],
  phone: ["phone", "telefono", "celular", "tel"],
  bin: ["bin"],
  orderId: ["order", "pedido", "orden"],
};

/** Detect columns by scanning CSV header row.
 *  Two-pass: exact match (trimmed, case-insensitive) wins over substring match.
 *  This prevents e.g. "Fraud Type" from stealing the slot from "Fraud". */
export function detectColumns(headers: string[]): CsvColumnMap {
  const result: CsvColumnMap = {
    amount: null,
    paymentStatus: null,
    fraud: null,
    koinDecision: null,
    item: null,
    cardBrand: null,
    date: null,
    delivery: null,
    document: null,
    email: null,
    phone: null,
    bin: null,
    orderId: null,
  };

  // Pass 1 — exact keyword match
  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS) as [keyof CsvColumnMap, string[]][]) {
      if (result[field] === null && keywords.some((kw) => lower === kw)) {
        result[field] = header;
      }
    }
  }

  // Pass 2 — substring match (only for fields not yet assigned)
  for (const header of headers) {
    const lower = header.toLowerCase();
    for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS) as [keyof CsvColumnMap, string[]][]) {
      if (result[field] === null && keywords.some((kw) => lower.includes(kw))) {
        result[field] = header;
      }
    }
  }

  return result;
}

/** Value classifiers */
export const isFraud = (val: string): boolean =>
  val !== "" && val !== "0" && val.toLowerCase() !== "false" && val.toLowerCase() !== "no";

export const isKoinReject = (val: string): boolean =>
  ["reject", "rejected", "recusado", "rechazado", "negado"].some((k) =>
    val.toLowerCase().includes(k),
  );

export const isMerchantApproved = (val: string): boolean =>
  ["acreditada", "aprovad", "approved"].some((k) => val.toLowerCase().includes(k)) ||
  val.toLowerCase() === "paid";

export const isMerchantRejected = (val: string): boolean =>
  ["rechazada", "rejected", "recusad"].some((k) => val.toLowerCase().includes(k)) ||
  val.toLowerCase() === "denied";

export const isDevolucion = (val: string): boolean =>
  ["devol", "anulaci", "devuelta", "cancel"].some((k) => val.toLowerCase().includes(k));

/** Parse a single CSV raw row into a typed ParsedRow. */
export function parseRow(raw: Record<string, string>, colMap: CsvColumnMap): ParsedRow {
  const get = (col: string | null) => (col ? (raw[col] ?? "") : "");

  const amountRaw = get(colMap.amount);
  // Argentine format: "$ 1.029.649" — dots are thousand separators, comma is decimal.
  // Strip $, whitespace and dots first, then convert comma → dot for parseFloat.
  const amount = amountRaw
    ? parseFloat(amountRaw.replace(/[$\s.]/g, "").replace(",", "."))
    : null;

  const fraudRaw = get(colMap.fraud);
  const fraud = colMap.fraud ? isFraud(fraudRaw) : null;

  const koinRaw = get(colMap.koinDecision);
  const paymentRaw = get(colMap.paymentStatus);

  return {
    amount: isNaN(amount ?? NaN) ? null : amount,
    paymentStatus: colMap.paymentStatus ? paymentRaw : null,
    fraud,
    koinDecision: colMap.koinDecision ? koinRaw : null,
    item: colMap.item ? get(colMap.item) : null,
    cardBrand: colMap.cardBrand ? get(colMap.cardBrand) : null,
    date: colMap.date ? get(colMap.date) : null,
    delivery: colMap.delivery ? get(colMap.delivery) : null,
    document: colMap.document ? get(colMap.document) : null,
    email: colMap.email ? get(colMap.email) : null,
    phone: colMap.phone ? get(colMap.phone) : null,
    bin: colMap.bin ? get(colMap.bin) : null,
    orderId: colMap.orderId ? get(colMap.orderId) : null,
    _raw: raw,
  };
}

/**
 * RFC 4180-compliant CSV line splitter.
 * Handles quoted fields that contain the separator character or newlines.
 */
function splitCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  const sepLen = separator.length;

  for (let i = 0; i < line.length; ) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          // Escaped double-quote inside quoted field
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (line.slice(i, i + sepLen) === separator) {
        result.push(current.trim());
        current = "";
        i += sepLen;
      } else {
        current += ch;
        i++;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse a full CSV text string into typed rows.
 * Returns headers, column map, parsed rows, and detected currency.
 */
export function parseCsv(csvText: string): {
  headers: string[];
  colMap: CsvColumnMap;
  rows: ParsedRow[];
  currency: CurrencyInfo;
} {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], colMap: detectColumns([]), rows: [], currency: DEFAULT_CURRENCY };
  }

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = splitCsvLine(lines[0], separator).map((h) => h.replace(/^"|"$/g, "").trim());
  const colMap = detectColumns(headers);

  const rows: ParsedRow[] = [];

  // Collect raw amount strings for currency detection (first 20 non-empty)
  const amountSamples: string[] = [];
  const amountColIdx = colMap.amount ? headers.indexOf(colMap.amount) : -1;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCsvLine(lines[i], separator);

    // Collect amount samples before building ParsedRow
    if (amountColIdx >= 0 && amountSamples.length < 20) {
      const raw = (values[amountColIdx] ?? "").trim();
      if (raw) amountSamples.push(raw);
    }

    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] ?? "";
    });
    rows.push(parseRow(raw, colMap));
  }

  const currency = detectCurrency(amountSamples);

  return { headers, colMap, rows, currency };
}
