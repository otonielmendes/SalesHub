import { NextRequest, NextResponse } from "next/server";

const EXPECTED_HEADERS = [
  "Identification Document",
  "Transaction Date",
  "Email",
  "Phone",
  "Bin",
  "Card Brand",
  "Last Digits",
  "Payment Status",
  "Shipping Cost",
  "IP",
  "Item",
  "Item Quantity",
  "Total Amount",
  "Order ID",
  "Delivery Type",
  "Fraud",
  "Veredicto Koin",
] as const;

const OPTIONAL_HEADERS = ["Shipping Cost", "IP", "Item Quantity"] as const;

const OPTIONAL_HEADER_SET = new Set<string>(OPTIONAL_HEADERS);

const HEADER_ALIASES: Record<(typeof EXPECTED_HEADERS)[number], string[]> = {
  "Identification Document": [
    "identification document",
    "document",
    "documento",
    "cpf",
    "dni",
    "identification",
    "id document",
    "document number",
    "identification number",
  ],
  "Transaction Date": [
    "transaction date",
    "date",
    "data",
    "fecha",
    "order date",
    "purchase date",
  ],
  Email: ["email", "e-mail", "correo"],
  Phone: ["phone", "telefone", "telefono", "celular", "mobile"],
  Bin: ["bin", "card bin"],
  "Card Brand": ["card brand", "brand", "bandeira", "card type", "card_type"],
  "Last Digits": [
    "last digits",
    "last4",
    "last 4",
    "last four",
    "final digits",
    "ultimos 4",
    "ultimos quatro",
    "4 digits",
  ],
  "Payment Status": ["payment status", "status", "estado", "payment result", "payment_state"],
  "Shipping Cost": ["shipping cost", "freight", "frete", "shipping", "delivery cost", "shipping_amount"],
  IP: ["ip", "ip address", "ip origem"],
  Item: ["item", "product", "produto", "product name", "item name", "categoria", "category"],
  "Item Quantity": ["item quantity", "quantity", "qty", "quantidade", "items quantity"],
  "Total Amount": ["total amount", "amount", "valor", "monto", "total", "order amount", "grand total"],
  "Order ID": ["order id", "order", "pedido", "orden", "order number", "order_number", "purchase id"],
  "Delivery Type": ["delivery type", "delivery", "entrega", "shipping type", "tipo de entrega", "delivery method"],
  Fraud: ["fraud", "fraude", "chargeback", "cbk", "fraud result"],
  "Veredicto Koin": ["veredicto koin", "koin decision", "koin verdict", "veredicto", "koin", "resultado koin"],
};

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

function splitCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  const sepLen = separator.length;

  for (let i = 0; i < line.length; ) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === "\"") {
        if (line[i + 1] === "\"") {
          current += "\"";
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
      if (ch === "\"") {
        inQuotes = true;
        i++;
      } else if (line.slice(i, i + sepLen) === separator) {
        result.push(current);
        current = "";
        i += sepLen;
      } else {
        current += ch;
        i++;
      }
    }
  }
  result.push(current);
  return result;
}

function escapeCsvValue(value: string, separator: string) {
  if (value.includes("\"") || value.includes("\n") || value.includes(separator)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

export async function POST(req: NextRequest) {
  let payload: { csvText?: string };
  try {
    payload = (await req.json()) as { csvText?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const csvText = payload.csvText?.trim();
  if (!csvText) {
    return NextResponse.json({ error: "CSV is empty" }, { status: 400 });
  }

  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV is empty" }, { status: 400 });
  }

  const separator = lines[0].includes(";") ? ";" : ",";
  const rawHeaders = splitCsvLine(lines[0], separator).map((h) => h.replace(/^"|"$/g, "").trim());
  const normalizedHeaders = rawHeaders.map((h) => normalizeKey(h));
  const normalizedMap = new Map<string, string>();

  rawHeaders.forEach((header, idx) => {
    if (!normalizedMap.has(normalizedHeaders[idx])) {
      normalizedMap.set(normalizedHeaders[idx], header);
    }
  });

  const columnMap = new Map<(typeof EXPECTED_HEADERS)[number], string>();
  const changes: { from: string; to: string }[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (const canonical of EXPECTED_HEADERS) {
    const canonicalKey = normalizeKey(canonical);
    let source = normalizedMap.get(canonicalKey);
    if (!source) {
      const aliases = HEADER_ALIASES[canonical].map(normalizeKey);
      const aliasKey = aliases.find((alias) => normalizedMap.has(alias));
      if (aliasKey) source = normalizedMap.get(aliasKey);
    }

    if (!source) {
      if (OPTIONAL_HEADER_SET.has(canonical)) {
        missingOptional.push(canonical);
      } else {
        missingRequired.push(canonical);
      }
      continue;
    }

    columnMap.set(canonical, source);
    if (source !== canonical) {
      changes.push({ from: source, to: canonical });
    }
  }

  if (missingRequired.length > 0) {
    return NextResponse.json(
      { error: "Missing required columns", missing: missingRequired },
      { status: 422 },
    );
  }

  const mappedSourceHeaders = new Set(Array.from(columnMap.values()));
  const extraColumns = rawHeaders.filter((header) => !mappedSourceHeaders.has(header));
  const outputHeaders = [...EXPECTED_HEADERS, ...extraColumns];

  const headerMatches =
    rawHeaders.length === outputHeaders.length &&
    missingOptional.length === 0 &&
    extraColumns.length === 0 &&
    rawHeaders.every((header, idx) => header === outputHeaders[idx]);

  if (headerMatches) {
    return NextResponse.json({
      adjusted: false,
      normalizedCsv: csvText,
      changes: [],
      missingRequired: [],
      missingOptional: [],
      extraColumns: [],
      expectedColumns: EXPECTED_HEADERS,
      receivedColumns: rawHeaders,
    });
  }

  const rows = lines.slice(1).filter((line) => line.trim().length > 0);
  const normalizedLines: string[] = [];
  normalizedLines.push(outputHeaders.join(separator));

  for (const row of rows) {
    const values = splitCsvLine(row, separator);
    const rowMap: Record<string, string> = {};
    rawHeaders.forEach((header, idx) => {
      rowMap[header] = values[idx] ?? "";
    });

    const normalizedRow = outputHeaders.map((header) => {
      if (extraColumns.includes(header)) {
        return escapeCsvValue(rowMap[header] ?? "", separator);
      }
      const sourceHeader = columnMap.get(header as (typeof EXPECTED_HEADERS)[number]);
      if (!sourceHeader) return "";
      return escapeCsvValue(rowMap[sourceHeader] ?? "", separator);
    });
    normalizedLines.push(normalizedRow.join(separator));
  }

  return NextResponse.json({
    adjusted: true,
    normalizedCsv: normalizedLines.join("\n"),
    changes,
    missingRequired: [],
    missingOptional,
    extraColumns,
    expectedColumns: EXPECTED_HEADERS,
    receivedColumns: rawHeaders,
  });
}
