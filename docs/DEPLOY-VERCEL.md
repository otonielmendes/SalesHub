# Deploy na Vercel — Koin Sales Hub

## 1. Repositório

1. Garantir que o código está no GitHub (`git push`).
2. Em [vercel.com](https://vercel.com) → **Add New Project** → importar o repositório **SalesHub** (ou nome atual).
3. Framework: **Next.js** (detetado automaticamente; `vercel.json` confirma o build).

## 2. Variáveis de ambiente

Configurar em **Project → Settings → Environment Variables** (Production + Preview):

| Variável | Obrigatória | Notas |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anónima |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Servidor apenas; signup/bootstrap e login (status) |
| `GEMINI_API_KEY` | Sim para insights | Google AI Studio / Gemini API |
| `SALES_HUB_BOOTSTRAP_ADMIN_EMAIL` | Opcional | Email do primeiro admin no signup |

Não commitar segredos; usar apenas o painel da Vercel ou `vercel env pull` em máquina local.

## 3. Branch de produção

- Alinhar com o fluxo da equipa: normalmente **`main`** em produção e **`develop`** em previews.
- Em **Git → Production Branch**, escolher a branch correta.

## 4. Supabase

- Executar políticas e tabelas conforme [`docs/supabase-setup.sql`](supabase-setup.sql) no projeto Supabase usado em produção.
- Configurar **Auth redirect URLs** com o domínio Vercel (ex.: `https://<projeto>.vercel.app/**`).

## 5. Primeiro deploy

Após guardar as variáveis, fazer **Redeploy** do último deployment ou um novo push na branch de produção.

## 6. CLI (opcional)

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel --prod
```

---

*O projeto não cria automaticamente a app na Vercel; estes passos são manuais no dashboard ou via CLI.*
