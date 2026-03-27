import type { CsvColumnMap, ParsedRow } from "@/types/backtest";

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

/** Detect columns by scanning CSV header row. */
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
  const amount = amountRaw ? parseFloat(amountRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) : null;

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
 * Parse a full CSV text string into typed rows.
 * Returns headers, column map and parsed rows.
 */
export function parseCsv(csvText: string): {
  headers: string[];
  colMap: CsvColumnMap;
  rows: ParsedRow[];
} {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], colMap: detectColumns([]), rows: [] };

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map((h) => h.trim().replace(/^"|"$/g, ""));
  const colMap = detectColumns(headers);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map((v) => v.trim().replace(/^"|"$/g, ""));
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = values[idx] ?? "";
    });
    rows.push(parseRow(raw, colMap));
  }

  return { headers, colMap, rows };
}
