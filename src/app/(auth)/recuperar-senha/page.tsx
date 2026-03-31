import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { KoinSalesHubLogo } from "@/components/foundations/logo/koin-sales-hub-logo";

export const metadata: Metadata = {
  title: "Recuperar senha — Koin Sales Hub",
};

interface PageProps {
  searchParams: Promise<{ message?: string; error?: string }>;
}

export default async function RecuperarSenhaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations("auth.recoverPassword");

  const MESSAGES = {
    sent: t("messages.sent"),
    missing_email: t("messages.missing_email"),
    config: t("messages.config"),
  } as Record<string, string>;

  const ERRORS = {
    missing_email: t("errors.missing_email"),
    config: t("errors.config"),
  } as Record<string, string>;

  const info = params.message ? MESSAGES[params.message] ?? null : null;
  const err = params.error ? ERRORS[params.error] ?? null : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="w-full max-w-sm rounded-2xl border border-secondary bg-primary p-8 shadow-lg">
        <div className="mb-8 text-center">
          <KoinSalesHubLogo className="mx-auto mb-3" />
          <h1 className="text-display-xs font-semibold text-primary">{t("title")}</h1>
          <p className="mt-2 text-sm text-tertiary">{t("subtitle")}</p>
        </div>

        {info && (
          <div className="mb-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3">
            <p className="text-sm text-success-800">{info}</p>
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3">
            <p className="text-sm text-error-800">{err}</p>
          </div>
        )}

        <form action="/api/auth/forgot-password" method="POST" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-secondary">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@otnl.com.br"
              className="h-10 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="mt-2 h-10 w-full rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {t("submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-tertiary">
          <a href="/login" className="font-semibold text-brand-700 hover:text-brand-600">
            {t("backToLogin")}
          </a>
        </p>
      </div>
    </div>
  );
}
