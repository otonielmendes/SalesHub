# Deploy na Vercel — Koin Sales Hub

## URL de produção (atual)

| Ambiente | URL |
|----------|-----|
| Vercel (produção / projeto ligado) | **https://koinsaleshub.vercel.app** |

**Supabase → Authentication → URL Configuration**

- **Site URL:** `https://koinsaleshub.vercel.app`
- **Redirect URLs:** incluir `https://koinsaleshub.vercel.app/**` e, para dev local, `http://localhost:3000/**`

---

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
- Em **Settings → Git → Production Branch**, escolher a branch que **realmente recebe push** com o código da app.

### 404 `NOT_FOUND` em `koinsaleshub.vercel.app`

Este erro vem da **plataforma Vercel** (não da app Next): o domínio de produção não está ligado a um deployment **Ready**.

| Causa comum | O que fazer |
|-------------|-------------|
| **Production branch = `main`** mas o trabalho está só em **`develop`** | Em Vercel: mudar *Production Branch* para **`develop`**, **ou** fazer merge de `develop` → `main` e push, depois *Redeploy*. |
| **Último build falhou** | *Deployments* → abrir o último → ver *Build Logs*; corrigir erro (envs em falta, etc.) e *Redeploy*. |
| **Root Directory errado** | *Settings → General → Root Directory* deve ser `.` (raiz do repo onde está `package.json` e `next.config.ts`). |
| Confusão entre URLs | Abrir o link **direto do deployment** no cartão do deploy (ex. `xxx-otonielmendes-projects.vercel.app`); se esse abrir e o domínio `.vercel.app` do projeto não, rever *Domains* no projeto. |

Depois de corrigir, fazer **Redeploy** do último commit com sucesso.

## 4. Supabase

- Executar políticas e tabelas conforme [`docs/supabase-setup.sql`](supabase-setup.sql) no projeto Supabase usado em produção.
- Configurar **Auth redirect URLs** — ver secção **URL de produção** acima (`https://koinsaleshub.vercel.app/**`).

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
