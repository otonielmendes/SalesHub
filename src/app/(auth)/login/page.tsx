import type { Metadata } from "next";
import Image from "next/image";
import { KoinSalesHubLogo } from "@/components/foundations/logo/koin-sales-hub-logo";

/** Foto: Nubelson Fernandes — https://unsplash.com/photos/iE71-TMrrkE (Unsplash License) */
const LOGIN_HERO_SRC =
  "https://images.unsplash.com/photo-1635830625698-3b9bd74671ca?auto=format&fit=crop&w=1920&q=85";

export const metadata: Metadata = {
  title: "Login — Koin Sales Hub",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials:
    "Email ou senha incorretos. Confira maiúsculas e use o mesmo email do cadastro; se necessário, redefina a senha.",
  pending_approval: "Sua conta ainda está aguardando aprovação do admin.",
  account_disabled: "Sua conta foi desativada. Entre em contato com o admin.",
  missing_fields: "Preencha email e senha.",
  email_not_confirmed:
    "Confirme o email pelo link que enviamos antes de entrar. Verifique também a pasta de spam.",
  rate_limited: "Muitas tentativas. Aguarde um minuto e tente de novo.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  pending_approval:
    "Solicitação enviada! Aguarde a aprovação de um administrador.",
  bootstrap_admin:
    "Conta de administrador criada. Entre com o email e a senha que você definiu no cadastro.",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMsg = params.error ? ERROR_MESSAGES[params.error] : null;
  const successMsg = params.message ? SUCCESS_MESSAGES[params.message] : null;

  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — formulário */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 xl:px-24 bg-primary">
        <div className="w-full max-w-sm mx-auto">
          <KoinSalesHubLogo className="mb-10" />

          <div className="mb-8">
            <h1 className="text-display-sm font-semibold text-primary">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-md text-tertiary">
              Entre com sua conta corporativa para continuar.
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
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-secondary">
                Email
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
                  Senha
                </label>
                <a
                  href="/recuperar-senha"
                  className="text-sm font-semibold text-brand-700 hover:text-brand-600 transition-colors"
                >
                  Esqueci a senha
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
              Entrar
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-tertiary">
            Não tem conta?{" "}
            <a href="/signup" className="font-semibold text-brand-700 hover:text-brand-600 transition-colors">
              Solicitar acesso
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
