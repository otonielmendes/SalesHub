import { cookies } from "next/headers";

export const SUPPORTED_LOCALES = ["pt-BR", "en", "es"] as const;
export const DEFAULT_LOCALE = "pt-BR" as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export async function getLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("sales-hub-locale")?.value ?? "";
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

export async function loadMessages(locale: SupportedLocale) {
  try {
    const messages = (await import(`../../../messages/${locale}.json`)) as { default: Record<string, unknown> };
    return messages.default;
  } catch {
    const fallback = (await import("../../../messages/pt-BR.json")) as { default: Record<string, unknown> };
    return fallback.default;
  }
}
