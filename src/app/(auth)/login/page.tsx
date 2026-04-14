import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { KoinSalesHubLogo } from "@/components/foundations/logo/koin-sales-hub-logo";

/** Foto: Nubelson Fernandes — https://unsplash.com/photos/iE71-TMrrkE (Unsplash License) */
const LOGIN_HERO_SRC =
  "https://images.unsplash.com/photo-1635830625698-3b9bd74671ca?auto=format&fit=crop&w=1920&q=85";

export const metadata: Metadata = {
  title: "Login — Koin Sales Hub",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const t = await getTranslations("auth.login");

  const ERROR_MESSAGES = {
    invalid_credentials: t("errors.invalid_credentials"),
    pending_approval: t("errors.pending_approval"),
    account_disabled: t("errors.account_disabled"),
    missing_fields: t("errors.missing_fields"),
    email_not_confirmed: t("errors.email_not_confirmed"),
    rate_limited: t("errors.rate_limited"),
  } as Record<string, string>;

  const SUCCESS_MESSAGES = {
    pending_approval: t("success.pending_approval"),
    bootstrap_admin: t("success.bootstrap_admin"),
  } as Record<string, string>;

  const errorMsg = params.error ? ERROR_MESSAGES[params.error] ?? null : null;
  const successMsg = params.message ? SUCCESS_MESSAGES[params.message] ?? null : null;

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — formulário */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24 bg-primary">
        <div className="w-full max-w-sm mx-auto">
          <KoinSalesHubLogo className="mb-10" />

          <div className="mb-8">
            <h1 className="text-display-sm font-semibold text-primary">
              {t("title")}
            </h1>
            <p className="mt-2 text-md text-tertiary">
              {t("subtitle")}
            </p>
          </div>

          {successMsg && (
            <div className="mb-6 rounded-xl border border-success-200 bg-success-50 px-4 py-3">
              <p className="text-sm text-success-800">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3">
              <p className="text-sm text-error-800">{errorMsg}</p>
              {params.error === "invalid_credentials" && (
                <a
                  href="/recuperar-senha"
                  className="mt-1.5 inline-block text-sm font-semibold text-error-800 underline hover:text-error-700"
                >
                  {t("resetPasswordLink")}
                </a>
              )}
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="flex flex-col gap-5">
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
                placeholder="seu@koin.com.br"
                className="h-11 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary placeholder:text-placeholder shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-secondary">
                  {t("password")}
                </label>
                <a
                  href="/recuperar-senha"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-600 transition-colors"
                >
                  {t("forgotPassword")}
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary placeholder:text-placeholder shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
              />
            </div>

            <button
              type="submit"
              className="mt-1 h-11 w-full rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors"
            >
              {t("submit")}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-tertiary">
            {t("noAccount")}{" "}
            <a href="/signup" className="font-semibold text-brand-700 hover:text-brand-600 transition-colors">
              {t("requestAccess")}
            </a>
          </p>
        </div>
      </div>

      {/* Painel direito — foto (sem copy; desktop) */}
      <div className="relative hidden min-h-0 lg:block lg:flex-1 bg-gray-950">
        <Image
          src={LOGIN_HERO_SRC}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 0"
          priority
        />
      </div>
    </div>
  );
}
