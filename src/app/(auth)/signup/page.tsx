import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitar Acesso — Koin Sales Hub",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_domain: "Use um email corporativo autorizado (@koin.com.br ou @otnl.com.br).",
  email_exists: "Este email já está cadastrado.",
  signup_error: "Erro ao criar conta. Tente novamente.",
  missing_fields: "Preencha todos os campos.",
};

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const errorMsg = params.error ? ERROR_MESSAGES[params.error] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="w-full max-w-sm rounded-2xl border border-secondary bg-primary p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600">
              <span className="text-xl font-bold text-white">K</span>
            </div>
          </div>
          <h1 className="text-display-xs font-semibold text-primary">Solicitar Acesso</h1>
          <p className="mt-2 text-sm text-tertiary">
            Use seu email corporativo (Koin ou OTNL). Um admin aprovará seu acesso.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3">
            <p className="text-sm text-error-800">{errorMsg}</p>
          </div>
        )}

        <form action="/api/auth/signup" method="POST" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-secondary">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Seu nome completo"
              className="h-10 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-secondary">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="nome@koin.com.br ou @otnl.com.br"
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
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="h-10 w-full rounded-lg border border-primary bg-primary px-3.5 text-md text-primary placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="mt-2 h-10 w-full rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Solicitar Acesso
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-tertiary">
          Já tem conta?{" "}
          <a href="/login" className="font-semibold text-brand-700 hover:text-brand-600">
            Fazer login
          </a>
        </p>
      </div>
    </div>
  );
}
