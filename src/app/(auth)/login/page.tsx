import type { Metadata } from "next";
import { KoinSalesHubLogo } from "@/components/foundations/logo/koin-sales-hub-logo";
import { Grid } from "@/components/shared-assets/background-patterns/grid";

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

      {/* Painel direito — visual */}
      <div className="relative hidden lg:flex lg:flex-1 overflow-hidden bg-gray-950">
        {/* Grid decorativo */}
        <div className="absolute inset-0 flex items-center justify-center text-brand-800 opacity-40">
          <Grid size="lg" className="w-full h-full scale-150" />
        </div>

        {/* Gradiente radial de sobreposição */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/60 via-gray-950/40 to-gray-950/80" />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full text-center">
          {/* Logomark Keystone (Figma) */}
          <div className="mb-8 shadow-2xl ring-1 ring-white/10 rounded-xl overflow-hidden">
            <img
              src="/koin-logomark.svg"
              alt=""
              width={80}
              height={80}
              className="h-20 w-20"
              aria-hidden
            />
          </div>

          <h2 className="text-display-sm font-semibold text-white leading-tight">
            Antifraude inteligente.
            <br />
            <span className="text-brand-400">Decisões em tempo real.</span>
          </h2>

          <p className="mt-4 text-lg text-gray-400 max-w-xs leading-relaxed">
            Demonstre o impacto do antifraude com dados reais dos seus prospects.
          </p>

          {/* Divisor */}
          <div className="my-10 h-px w-16 bg-gray-700" />

          {/* Depoimento */}
          <blockquote className="max-w-sm">
            <p className="text-base text-gray-300 italic leading-relaxed">
              "O Sales Hub nos permite fechar mais negócios mostrando resultados concretos antes da contratação."
            </p>
            <footer className="mt-6 flex items-center justify-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/80 ring-1 ring-brand-500/30">
                <span className="text-sm font-bold text-white">TC</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Time Comercial</p>
                <p className="text-xs text-gray-500">Koin Antifraude</p>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* Decoração de canto inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-700/50 to-transparent" />
      </div>
    </div>
  );
}
