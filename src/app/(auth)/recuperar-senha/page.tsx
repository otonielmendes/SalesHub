import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar senha — Koin Sales Hub",
};

const MESSAGES: Record<string, string> = {
  sent: "Se existir uma conta com este email, você receberá um link para definir uma nova senha.",
  missing_email: "Indique o seu email.",
  config: "Serviço temporariamente indisponível. Tente mais tarde.",
};

const ERRORS: Record<string, string> = {
  missing_email: "Indique o seu email.",
  config: "Configuração incompleta no servidor.",
};

interface PageProps {
  searchParams: Promise<{ message?: string; error?: string }>;
}

export default async function RecuperarSenhaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const info = params.message ? MESSAGES[params.message] : null;
  const err = params.error ? ERRORS[params.error] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="w-full max-w-sm rounded-2xl border border-secondary bg-primary p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
              <span className="text-xl font-bold text-white">K</span>
            </div>
          </div>
          <h1 className="text-display-xs font-semibold text-primary">Recuperar senha</h1>
          <p className="mt-2 text-sm text-tertiary">
            Receberá um link no email para definir uma nova senha.
          </p>
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
              Email
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
            Enviar link
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-tertiary">
          <a href="/login" className="font-semibold text-brand-700 hover:text-brand-600">
            Voltar ao login
          </a>
        </p>
      </div>
    </div>
  );
}
