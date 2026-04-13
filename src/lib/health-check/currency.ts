export interface CurrencyMeta {
  code: string;
  label: string;
  prefix: string;
  locale: string;
}

export const DEFAULT_CURRENCY_CODE = "BRL";

export const CURRENCY_OPTIONS: CurrencyMeta[] = [
  { code: "ARS", label: "Peso Argentino (ARS)", prefix: "ARS", locale: "es-AR" },
  { code: "BOB", label: "Boliviano (BOB)", prefix: "BOB", locale: "es-BO" },
  { code: "BRL", label: "Real (BRL)", prefix: "R$", locale: "pt-BR" },
  { code: "BSD", label: "Dólar Bahamense (BSD)", prefix: "BSD", locale: "en-BS" },
  { code: "BBD", label: "Dólar Barbadense (BBD)", prefix: "BBD", locale: "en-BB" },
  { code: "BZD", label: "Dólar Belizenho (BZD)", prefix: "BZD", locale: "en-BZ" },
  { code: "CLP", label: "Peso Chileno (CLP)", prefix: "CLP", locale: "es-CL" },
  { code: "COP", label: "Peso Colombiano (COP)", prefix: "COP", locale: "es-CO" },
  { code: "CRC", label: "Colón Costarriquenho (CRC)", prefix: "CRC", locale: "es-CR" },
  { code: "CUP", label: "Peso Cubano (CUP)", prefix: "CUP", locale: "es-CU" },
  { code: "DOP", label: "Peso Dominicano (DOP)", prefix: "DOP", locale: "es-DO" },
  { code: "EUR", label: "Euro (EUR)", prefix: "€", locale: "en-IE" },
  { code: "GTQ", label: "Quetzal (GTQ)", prefix: "GTQ", locale: "es-GT" },
  { code: "GYD", label: "Dólar Guianense (GYD)", prefix: "GYD", locale: "en-GY" },
  { code: "HNL", label: "Lempira (HNL)", prefix: "HNL", locale: "es-HN" },
  { code: "HTG", label: "Gourde (HTG)", prefix: "HTG", locale: "fr-HT" },
  { code: "JMD", label: "Dólar Jamaicano (JMD)", prefix: "JMD", locale: "en-JM" },
  { code: "MXN", label: "Peso Mexicano (MXN)", prefix: "MXN", locale: "es-MX" },
  { code: "NIO", label: "Córdoba (NIO)", prefix: "NIO", locale: "es-NI" },
  { code: "PAB", label: "Balboa (PAB)", prefix: "PAB", locale: "es-PA" },
  { code: "PEN", label: "Sol (PEN)", prefix: "PEN", locale: "es-PE" },
  { code: "PYG", label: "Guarani (PYG)", prefix: "PYG", locale: "es-PY" },
  { code: "SRD", label: "Dólar Surinamês (SRD)", prefix: "SRD", locale: "nl-SR" },
  { code: "TTD", label: "Dólar de Trinidad e Tobago (TTD)", prefix: "TTD", locale: "en-TT" },
  { code: "USD", label: "Dólar Americano (USD)", prefix: "US$", locale: "en-US" },
  { code: "UYU", label: "Peso Uruguaio (UYU)", prefix: "UYU", locale: "es-UY" },
  { code: "VES", label: "Bolívar Venezuelano (VES)", prefix: "VES", locale: "es-VE" },
  { code: "XCD", label: "Dólar do Caribe Oriental (XCD)", prefix: "XCD", locale: "en-AG" },
];

export function getCurrencyMeta(code?: string | null): CurrencyMeta {
  if (!code) return CURRENCY_OPTIONS[0];
  return CURRENCY_OPTIONS.find((c) => c.code === code) ?? CURRENCY_OPTIONS[0];
}
