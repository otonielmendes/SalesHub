export const metadata = {
  title: "Login — Koin Sales Hub",
};

export default function LoginPage() {
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
          <p className="mt-2 text-sm text-tertiary">Entre com sua conta Koin</p>
        </div>

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
              placeholder="nome@koin.com.br"
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

        <p className="mt-6 text-center text-sm text-tertiary">
          Não tem conta?{" "}
          <a href="/signup" className="font-semibold text-brand-700 hover:text-brand-600">
            Solicitar acesso
          </a>
        </p>
      </div>
    </div>
  );
}
