import type { Metadata } from "next";

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
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="w-full max-w-sm rounded-2xl border border-secondary bg-primary p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
              <span className="text-xl font-bold text-white">K</span>
            </div>
          </div>
          <h1 className="text-display-xs font-semibold text-primary">Koin Sales Hub</h1>
          <p className="mt-2 text-sm text-tertiary">Entre com sua conta corporativa</p>
        </div>

        {successMsg && (
          <div className="mb-4 rounded-lg border border-success-200 bg-success-50 px-4 py-3">
            <p className="text-sm text-success-800">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3">
            <p className="text-sm text-error-800">{errorMsg}</p>
          </div>
        )}

        <form action="/api/auth/login" method="POST" className="flex flex-col gap-4">
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
              placeholder="seu@koin.com.br ou @otnl.com.br"
              className="h-10 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-secondary">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-10 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="mt-2 h-10 w-full rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Entrar
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <a href="/recuperar-senha" className="font-semibold text-brand-700 hover:text-brand-600">
            Esqueci a senha
          </a>
        </p>

        <p className="mt-4 text-center text-sm text-tertiary">
          Não tem conta?{" "}
          <a href="/signup" className="font-semibold text-brand-700 hover:text-brand-600">
            Solicitar acesso
          </a>
        </p>
      </div>
    </div>
  );
}
