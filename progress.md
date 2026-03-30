# Progress — Koin Sales Hub

> Log de execução. Registar aqui o que foi feito, erros encontrados e resultados.
> Atualizar após **cada sessão de trabalho**.
> Formato: `## YYYY-MM-DD — [Fase] Descrição`

---

## 2026-03-30 — [S] Calculadora — histórico, progress-card e export (KEYSTONE / Untitled)

**O que foi feito:**
- `src/app/calculadora/page.tsx` — breadcrumbs Calculadora → Histórico; estatísticas com `FeaturedIcon` + tokens; pesquisa com `Input` + `SearchLg`; filtro com `NativeSelect`; vazio com `EmptyState` + CTA; tabela com `Badge`, `Button` (Untitled icons); `LoadingIndicator` ao carregar.
- `src/app/calculadora/_components/progress-card.tsx` — `Badge` para Req./✓; `bg-primary`, `border-secondary`, barra em `bg-secondary` / `bg-brand-solid` ou `bg-success-500`.
- `src/app/calculadora/[id]/export/page.tsx` — estado de carregamento com classes de tema (`bg-primary`, `text-tertiary`) em vez de estilos inline.

**Resultado:**
- Plano “Calculadora UI Untitled” concluído (lista + progress + export mínimo); `tsc --noEmit` OK.

---

## 2026-03-30 — [A] Notificação Slack para pedidos de acesso (signup pending)

**O que foi feito:**
- Variável opcional `SALES_HUB_SLACK_SIGNUP_WEBHOOK_URL` documentada em `docs/DEPLOY-VERCEL.md`; secção de integrações opcionais em `blueprint.md`.
- `src/lib/notify/slack-signup.ts` — POST ao Incoming Webhook com `text` + bloco `mrkdwn` (nome, email, link para `/admin/users` do mesmo origin do pedido), timeout 5s, erros só em log.
- `src/app/api/auth/signup/route.ts` — após insert em `users` sem erro e quando não é bootstrap admin, agenda notificação com `after()` do Next.js (não bloqueia o redirect).
- `npm run build` concluído com sucesso.

**Resultado:**
- Pedido de acesso (pending) pode disparar aviso no Slack quando a env está definida; sem env, comportamento igual ao anterior.

---

## Template de Entrada

```
## YYYY-MM-DD — [Fase B/L/A/S/T] Título da Sessão

**O que foi feito:**
- Item 1
- Item 2

**Erros encontrados:**
- Erro: descrição do erro
  - Causa: o que causou
  - Solução: como foi resolvido
  - Learning: o que atualizar em findings.md ou blueprint.md

**Resultado:**
- [ ] Task X → ✅ concluída / ❌ bloqueada / 🔄 em progresso

**Próximos passos:**
- Step 1
- Step 2
```

---

## 2026-03-30 — [S] File uploader Testagens (Untitled UI + progress bar)

**O que foi feito:**
- `CsvDropZone` + `CsvFileProgressRow`: padrão [Untitled UI file uploaders](https://www.untitledui.com/react/components/file-uploaders) (ícone em círculo, cópia PT, `FileIcon` CSV, barra com `ProgressBarBase` e transição longa no fill + intervalo suave durante o save).
- Página Testagens: drop + lista de ficheiro com fases (carregar → processar → guardar → concluído) e dashboard só após save OK (~520 ms em “Concluído”). Removido `UploadZone.tsx` (substituído).

---

## 2026-03-30 — [S] Empty state Histórico (Untitled UI)

**O que foi feito:**
- `HistoricoEmptyState` (`FeaturedIcon` brand + gradient, `EmptyState` do KEYSTONE, botões `Button` secondary/primary) na lista vazia de `/backtests/historico`; título da página e contador `0 backtests` alinhados ao estado com dados.

---

## 2026-03-30 — [S] Logomark e favicon (Keystone Figma)

**O que foi feito:**
- Asset vetorial do nó Figma `1083:50505` (logomark K em quadrado arredondado, fundo escuro) incorporado como `public/koin-logomark.svg`; traço diagonal em `#10B132` (marca); fundo `#0c111d` (gray-950 do tema).
- `KoinSalesHubLogo` passa a usar a imagem em vez do “K” em gradiente.
- `layout.tsx`: `metadata.icons` (favicon + apple) apontando para o SVG.
- Login (painel direito): hero usa o mesmo logomark em 80×80 px.

---

## 2026-03-28 — [L] Fix RLS recursão Supabase (digest 500 Vercel)

**Causa:** policies `users_admin_*`, `backtests_admin_select_all` e `storage_admin_all` usavam `EXISTS (SELECT … FROM public.users)`; ao avaliar SELECT em `users`, o Postgres reentrava nas mesmas policies → *infinite recursion detected in policy for relation "users"* (500 no servidor / digest na Vercel, ex. ao abrir Histórico).

**Solução:** função `public.is_sales_hub_admin()` `SECURITY DEFINER` + policies admin a usar `USING (public.is_sales_hub_admin())`. Atualizado `docs/supabase-setup.sql`; hotfix único em `docs/supabase-hotfix-rls-recursion.sql` para projetos já criados. `proxy.ts`: `try/catch` em `getSession` e em `res.cookies.set`. `docs/DEPLOY-VERCEL.md` e `blueprint.md` (secção RLS) atualizados.

**Ação manual:** executar o hotfix no SQL Editor do Supabase de produção e redeploy se necessário.

---

## 2026-03-28 — [T] QA com megatone_results.csv (Downloads) + relatório

**O que foi feito:**
- Script `scripts/qa-backtest-csv.ts` + npm script `qa:csv` — corre `parseCsv` + `calculateMetrics` sobre um CSV (predefinição `~/Downloads/megatone_results.csv`).
- Execução com `/Users/ottomendes/Downloads/megatone_results.csv`: 121.620 linhas, colMap completo, métricas coerentes com capturas anteriores (ex. recuperáveis 13.866, taxa de detecção ~10,5%).
- `npm run build` OK após o script.
- QA browser local: `/backtests/testagens` OK (marca Koin, menus PT); `/backtests/historico` devolveu erro Supabase de RLS em ambiente local (`infinite recursion detected in policy for relation "users"`) — documentado em `docs/qa-relatorio.md`.

**Resultado:** pipeline de dados validado; Histórico depende de políticas Supabase corretas em cada ambiente.

---

## 2026-03-28 — [S] Header Koin, textos PT, Histórico e deploy docs

**O que foi feito:**
- Logo **Koin Sales Hub** (`KoinSalesHubLogo`) no header desktop/mobile em substituição do wordmark Untitled UI (`header-navigation.tsx`, `mobile-header.tsx`).
- Menu principal em PT: Retrotestes, Demonstrações, Guias (`KoinHeader.tsx`); item Retrotestes ativo em qualquer rota `/backtests/*`.
- Abas do dashboard de backtest: Inteligência de fraude, Blocklist e exportação (`BacktestDashboard.tsx`).
- Página **Histórico**: `dynamic = "force-dynamic"`, validação de envs públicas Supabase, `try/catch` em torno de `createClient` + query, normalização defensiva de `metrics_json` (objeto ou string JSON).
- `proxy.ts`: se faltarem envs Supabase e o pedido for `/backtests/*` ou `/admin/*`, redireciona para `/login` em vez de `next()` sem sessão.
- `blueprint.md` (navegação + nomes das abas), `docs/DEPLOY-VERCEL.md` (nota sobre `GEMINI_API_KEY` e aviso na UI).

**Resultado:** alinhado ao plano de marca/PT e mitigação de 500 em `/backtests/historico` na Vercel.

---

## 2026-03-27 — [Protocol 0] Inicialização do Projeto

**O que foi feito:**
- Criado `blueprint.md` com schemas de DB, CSV column mapping, value classification, behavioral rules, invariantes arquiteturais e scope por versão
- Criado `task_plan.md` com fases B.L.A.S.T. completas e checklist granular do v1.0 MVP
- Criado `findings.md` com descobertas iniciais extraídas do PRD e decisões técnicas
- Criado `progress.md` (este ficheiro) com template de log
- Criadas regras Cursor em `.cursor/rules/`:
  - `project-blueprint.mdc` (alwaysApply: true) — obriga leitura do blueprint
  - `keystone-vibe-ui.mdc` (globs: **/*.tsx) — regras de UI
  - `backtest-domain.mdc` (alwaysApply: true) — lógica de domínio CSV

**Erros encontrados:**
- Nenhum

**Resultado:**
- ✅ Protocol 0 completo — infraestrutura de memória criada
- ✅ Fase B (Blueprint) concluída
- ⬜ Fase L (Link) — próxima

**Próximos passos:**
1. Criar projeto Supabase e obter credentials
2. Obter `GEMINI_API_KEY`
3. Criar repositório GitHub (`koin-sales-hub`)
4. Criar projeto Vercel conectado ao repositório
5. Configurar `.env.local` com todas as variáveis
6. Verificar todas as conexões (fase L)

---

## 2026-03-27 — [Fase A] Keystone Vibe — Setup do Projeto

**O que foi feito:**
- Copiada a estrutura completa do template `keystone-vibe` (Chargebacks) para o Sales HUB:
  - `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`
  - `src/styles/theme.css` (tokens KEYSTONE — brand teal, gray, error, warning, success)
  - `src/styles/globals.css` e `typography.css`
  - `src/components/base/` (buttons, badges, inputs, avatars, toggles, etc.)
  - `src/components/application/` (header-navigations, tabs, tables, empty-states, metrics, etc.)
  - `src/components/foundations/` e `src/components/shared-assets/`
  - `src/hooks/` e `src/utils/`
- Atualizado `package.json` com nome `koin-sales-hub`
- Corrigido `next.config.ts` com `turbopack.root` para silenciar warning de lockfiles
- Criada estrutura de pastas `src/app`:
  - `(auth)/login/page.tsx` e `(auth)/signup/page.tsx`
  - `backtests/layout.tsx` (com `KoinHeader` e container max-width)
  - `backtests/testagens/page.tsx`, `historico/page.tsx`, `configuracoes/page.tsx`
- Criado `src/components/backtest/`:
  - `KoinHeader.tsx` — header navigation com tabs de Testagens/Histórico/Configurações
  - `UploadZone.tsx` — drag & drop CSV
  - `CompareCard.tsx`, `RiskTable.tsx`, `StatRow.tsx`, `FraudBar.tsx` (componentes customizados do blueprint)
- Criado `src/lib/`:
  - `supabase/client.ts` e `supabase/server.ts` (SSR-ready)
  - `csv/parser.ts` — detecção de colunas por keywords + value classifiers
  - `csv/metrics.ts` — cálculo completo de todas as métricas do blueprint
  - `gemini/insights.ts` — envio de resumo estatístico (nunca CSV bruto) ao Gemini
- Criado `src/types/backtest.ts` — tipos TypeScript completos do domínio
- Instalado `@supabase/ssr` e `@supabase/supabase-js`
- TypeScript sem erros (`tsc --noEmit` passa limpo)
- `npm run dev` funciona — servidor em `http://localhost:3000`
- Redirect `/` → `/backtests/testagens` funcionando

**Erros encontrados:**
- rsync: erros de `utimensat` (permissão de timestamp) — inofensivos, ficheiros copiados corretamente
- Warning de múltiplos lockfiles — resolvido com `turbopack.root` no `next.config.ts`

**Resultado:**
- ✅ Fase A (Layer 1: Setup do Projeto) — **concluída**
- ✅ theme.css com tokens KEYSTONE corretos (brand teal Koin)
- ✅ Biblioteca Untitled UI disponível em `@/components/`
- ✅ Estrutura de pastas conforme blueprint seção 11 (Layer 2)
- ✅ CSV parser + métricas + Gemini lib implementados
- ✅ Tipos TypeScript de domínio criados
- 🔄 Fase A (Layer 3: Implementação v1.0 MVP) — em progresso

**Próximos passos:**
1. Criar tabelas no Supabase (SQL do blueprint seção 4)
2. Criar middleware de autenticação Supabase
3. Implementar lógica completa da página Testagens (upload → parse → dashboard)
4. Dashboard: 3 abas (Comparativo, Fraud Intelligence, Blocklist & Export)

---

## 2026-03-27 — [Fase A Layer 3] Implementação v1.0 MVP

**O que foi feito:**
- Criadas API routes de autenticação Supabase:
  - `src/app/api/auth/login/route.ts` — signInWithPassword + verificação de status active
  - `src/app/api/auth/signup/route.ts` — signUp + inserção em public.users com status pending + restrição de domínio @koin.com.br
  - `src/app/api/auth/logout/route.ts` — signOut com redirect
- Criado `src/middleware.ts` — protege `/backtests/*`, redireciona unauthenticated para /login e authenticated longe de /login e /signup
- Atualizadas páginas de auth para Server Components com leitura de searchParams e exibição de mensagens de erro/sucesso
- Gerado `docs/supabase-setup.sql` — SQL completo com tabelas users/backtests/backtest_files, RLS policies, Storage bucket e índices
- Refatorada `src/app/backtests/testagens/page.tsx` — state machine idle→parsing→loaded→error
- Criado `src/components/backtest/BacktestDashboard.tsx` — 3 tabs internas, botão Salvar, barra de resumo, banner Insights AI
- Criado `src/components/backtest/tabs/ComparativoTab.tsx` — 3 CompareCards, Revenue Recovery, Confusion Matrix, Impacto Financeiro, Card Brands, Devoluções
- Criado `src/components/backtest/tabs/FraudIntelligenceTab.tsx` — 5 tabelas de risco
- Criado `src/components/backtest/tabs/BlocklistExportTab.tsx` — 3 botões export CSV, tabelas de reincidentes
- Criado `src/app/api/backtest/insights/route.ts` — POST para Gemini
- Criado `src/app/api/backtest/save/route.ts` — persistência Supabase + Storage
- Implementado `src/app/backtests/historico/page.tsx` — lista de backtests salvos

**Erros encontrados:**
- Ícones desnecessários importados em BacktestDashboard — corrigido

**Resultado:**
- ✅ v1.0 MVP — Layer 3 completo
- ✅ TypeScript sem erros (`tsc --noEmit` exit 0)
- ⬜ Fase L (Link) — pendente: configurar .env.local + executar SQL no Supabase

**Próximos passos:**
1. Configurar `.env.local` com credenciais Supabase e Gemini
2. Executar `docs/supabase-setup.sql` no Supabase SQL Editor
3. Promover primeiro usuário a admin: `UPDATE public.users SET role = 'admin', status = 'active' WHERE email = 'seu@koin.com.br';`
4. Testar fluxo completo: signup → aprovação → login → upload CSV → dashboard → salvar → histórico

---

## 2026-03-28 — [Fase L] Domínio OTNL + conta admin

**O que foi feito:**
- `otnl.com.br` adicionado a `ALLOWED_DOMAINS` em `src/app/api/auth/signup/route.ts` (junto com `koin.com.br`; `koin.io` removido depois a pedido)
- Textos de login/signup e mensagem `invalid_domain` atualizados para refletir emails corporativos Koin/OTNL
- `blueprint.md` seção 2 e fluxo de registo atualizados com a lista de domínios permitidos
- Tentativa de `UPDATE` para promover `otoniel@otnl.com.br` a admin — sem linhas (utilizador ainda não existia em `public.users`)

**Próximos passos (utilizador):**
1. Abrir `/signup`, criar conta com `otoniel@otnl.com.br` e senha (mín. 8 caracteres)
2. No Supabase SQL Editor (ou pedir ao agente), executar:
   `UPDATE public.users SET role = 'admin', status = 'active' WHERE lower(email) = 'otoniel@otnl.com.br';`
3. Fazer login em `/login`

---

## 2026-03-28 — Bootstrap do primeiro admin

**O que foi feito:**
- Variável `SALES_HUB_BOOTSTRAP_ADMIN_EMAIL`: no signup, se o email coincidir e existir `SUPABASE_SERVICE_ROLE_KEY`, a API faz `UPDATE` com service role para `role=admin`, `status=active` (resolve o deadlock “só admin aprova, mas não há admin”).
- Mensagem de sucesso `bootstrap_admin` no login; documentação em `blueprint.md` §13; `.env.example` criado; `.env.local` do projeto preenchido com `SALES_HUB_BOOTSTRAP_ADMIN_EMAIL=otoniel@otnl.com.br`.

**Nota:** conta já existente em `pending` não é promovida automaticamente — usar SQL em `public.users` ou apagar utilizador em Auth e voltar a registar com a variável definida.

---

## 2026-03-28 — Admin, métricas PRD, header, Gemini, Vercel docs, testes

**O que foi feito:**
- Painel `/admin/users` + API `GET`/`PATCH` `/api/admin/users` com proteção de último admin; `proxy.ts` cobre `/admin/*`.
- Header: removidos links Untitled UI e rotas demo; menu de conta com utilizador Supabase, Configurações, Gestão de usuários (admin), logout POST.
- Métricas: `capabilities` + devoluções cruzadas com Koin, `fraudAmount` nas risk tables, velocidade com Koin rejects e volume, `recurrentFraudKoin` / badge “Koin detectó”, ROI (`protectedValue`, `totalGmv`, `valueImpactRatio`); modelo Gemini `gemini-2.0-flash` + erros visíveis na UI de testagens.
- `.gitignore`: pasta `Downloads/`; documentação `docs/DEPLOY-VERCEL.md`, `docs/plano-de-testes.md`; `vercel.json` mínimo.
- `blueprint.md` atualizado (admin + linhas extra na matriz de blocos).

**Resultado:** `npm run build` OK.

**Deploy Vercel (manual):** importar repo no dashboard, definir envs listadas em `docs/DEPLOY-VERCEL.md`, ligar branch de produção.

---

## Deploy Vercel — concluído (utilizador)

**O que foi feito:**
- Projeto configurado na Vercel; deploy ativo em **https://koinsaleshub.vercel.app** (confirmado pelo utilizador).

**Checklist pós-deploy:**
- [ ] Supabase → Authentication → URL Configuration: `https://koinsaleshub.vercel.app` (Site URL) e redirect `https://koinsaleshub.vercel.app/**` (+ `http://localhost:3000/**` para dev).
- [ ] Testar login, upload de CSV e insights em produção/preview (`docs/plano-de-testes.md`).

**Documentação:** URL registada em `docs/DEPLOY-VERCEL.md` e na tabela de stack em `blueprint.md`.

---

## `main` alinhada com `develop` (produção Vercel)

**O que foi feito:** merge fast-forward `develop` → `main` e `git push origin main` (commit `8bbec4c` em produção). Fluxo B: Production Branch na Vercel permanece em `main`.

---

## Fix: 500 Internal Server Error na Vercel (proxy)

**Causa:** `proxy.ts` fazia `req.cookies.set` ao refrescar sessão Supabase; no Next.js isso pode falhar e derrubar o proxy em `/login`, `/signup`, `/backtests/*`, `/admin/*`.

**Solução:** `setAll` apenas com `res.cookies.set`; guard se faltarem `NEXT_PUBLIC_SUPABASE_*`. Documentado em `docs/DEPLOY-VERCEL.md`.

---

## Fix: client-side exception / hydration (useBreakpoint)

**Causa:** `use-breakpoint.ts` inicializava com `true` no SSR (sem `window`) e com `matchMedia` no cliente — em viewports &lt; breakpoint o primeiro render do cliente diferia do HTML do servidor → erro de hidratação. O `NavAccountCard` (drawer mobile) usa este hook e fica montado no DOM mesmo em desktop (`lg:hidden`).

**Solução:** estado inicial `false` em todos os ambientes; valor real só após `useEffect`. Guard opcional em `KoinHeader` se faltarem envs públicas do Supabase.

---
