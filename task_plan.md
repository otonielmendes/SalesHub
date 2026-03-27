# Task Plan — Koin Sales Hub

> Fases B.L.A.S.T. e checklists de execução.
> Atualizar status à medida que as tarefas são concluídas.
> Erros e descobertas vão para `findings.md` e `progress.md`.

---

## Status Global

| Fase | Status |
|---|---|
| **B** — Blueprint | ✅ Completo |
| **L** — Link | ⬜ Pendente |
| **A** — Architect | ⬜ Pendente |
| **S** — Stylize | ⬜ Pendente |
| **T** — Trigger | ⬜ Pendente |

---

## B — Blueprint (Visão & Lógica)

### Discovery Questions

- [x] **North Star**: Transformar CSV de backtest em dashboard visual de performance antifraude com exportação PDF/CSV
- [x] **Integrations**: Supabase (auth, storage, db), Google Gemini (AI insights), Vercel (deploy), GitHub (versionamento)
- [x] **Source of Truth**: CSV de resultado de backtest (upload manual pelo usuário)
- [x] **Delivery Payload**: Dashboard web com 3 abas + PDF exportável + CSVs de blocklist
- [x] **Behavioral Rules**: ver `blueprint.md` seções 10 e 11

### Data Schema

- [x] Tabelas `users`, `backtests`, `backtest_files` definidas em `blueprint.md`
- [x] CSV column mapping definido em `blueprint.md`
- [x] Value classification definida em `blueprint.md`
- [x] RLS policies definidas em `blueprint.md`

### PRD

- [x] `FunctionalitiesPRDs/backtest-viewer-prd.md` aprovado

---

## L — Link (Conectividade)

> **Bloqueador**: não avançar para fase A sem verificar todas as conexões.

### Supabase

- [ ] Criar projeto Supabase em `supabase.com`
- [ ] Obter `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Criar tabelas via SQL Editor (schema em `blueprint.md` seção 4)
- [ ] Ativar RLS nas tabelas `users`, `backtests`, `backtest_files`
- [ ] Criar policies RLS (SQL em `blueprint.md` seção 4)
- [ ] Criar bucket `backtest-files` no Storage com RLS
- [ ] Testar conexão: SELECT 1 retorna OK

### Google Gemini

- [ ] Obter `GEMINI_API_KEY` em `aistudio.google.com`
- [ ] Testar endpoint: `gemini-1.5-flash` com prompt simples retorna OK

### Vercel

- [ ] Criar projeto Vercel conectado ao repositório GitHub
- [ ] Configurar variáveis de ambiente no painel Vercel
- [ ] Verificar deploy automático em push para `main`

### GitHub

- [ ] Repositório criado (fork do `keystone-vibe` ou novo `koin-sales-hub`)
- [ ] Branches: `main`, `develop` criadas
- [ ] `.gitignore` inclui `.env*.local`

### Arquivo `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

---

## A — Architect (Build 3 Camadas)

### Layer 1: Setup do Projeto

- [ ] Clonar/fork template `keystone-vibe` para `koin-sales-hub`
- [ ] Verificar `src/styles/theme.css` com tokens KEYSTONE
- [ ] Verificar `@/components/` com biblioteca Untitled UI instalada
- [ ] `npm install` — dependências base funcionando
- [ ] `npm run dev` — servidor local sobe sem erros

### Layer 2: Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── backtests/
│   │   ├── layout.tsx           ← header + tabs persistentes
│   │   ├── testagens/
│   │   │   └── page.tsx
│   │   ├── historico/
│   │   │   └── page.tsx
│   │   └── configuracoes/
│   │       └── page.tsx
│   └── layout.tsx
├── components/
│   └── backtest/
│       ├── UploadZone.tsx
│       ├── CompareCard.tsx
│       ├── RiskTable.tsx
│       ├── StatRow.tsx
│       └── FraudBar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── csv/
│   │   ├── parser.ts            ← detecção de colunas por keywords
│   │   └── metrics.ts           ← cálculo de todas as métricas
│   └── gemini/
│       └── insights.ts          ← envio de resumo + parsing de resposta
└── types/
    └── backtest.ts              ← tipos TypeScript do domínio
```

### Layer 3: Implementação v1.0 MVP

#### Auth (Supabase)

- [ ] Configurar `@supabase/ssr` para Next.js App Router
- [ ] Criar middleware de autenticação
- [ ] Página de login (`login-split-quote-image-02`)
- [ ] Página de sign-up (`signup-split-quote-image-01`) com restrição de domínio
- [ ] Fluxo de aprovação: sign-up → pending → admin aprova → active
- [ ] Redirect para `/backtests/testagens` após login

#### Layout Base

- [ ] Header navigation com logo Koin + itens do menu (`header-navigations`)
- [ ] Tabs de segundo nível para Backtests (`tabs`)
- [ ] Max-width container alinhado: `--max-width-container: 1280px`
- [ ] Breadcrumb contextual quando backtest está aberto

#### Módulo Testagens

**Upload:**
- [ ] Empty state com drag & drop e file picker (`empty-states`)
- [ ] Validação de arquivo `.csv`
- [ ] Loading state durante parsing (`loading-indicators`)

**CSV Parser (`lib/csv/parser.ts`):**
- [ ] Detecção automática de colunas por keywords (case-insensitive)
- [ ] Classificação de valores (fraud, koin decision, payment status)
- [ ] Colunas não encontradas não causam erro — blocos correspondentes não renderizam

**Cálculo de métricas (`lib/csv/metrics.ts`):**
- [ ] Aprovação Hoy vs Con Koin (%)
- [ ] Rejeição Hoy vs Con Koin (%)
- [ ] Fraud rate Hoy vs Con Koin (%)
- [ ] Revenue Recovery (transações e volume recuperável)
- [ ] Confusion Matrix (TP, FN, FP, TN, taxa de detecção)
- [ ] Impacto Financeiro (fraude total, prevenido, residual, %)
- [ ] Categorías por fraud rate
- [ ] BINs por fraud rate (mín 5 txns, mín 1 fraude)
- [ ] Domínios de email com fraude
- [ ] Identidades alta velocidade (10+ txns)
- [ ] Códigos de área com fraude
- [ ] Marcas de cartão por volume
- [ ] Devoluciones/Cancelaciones

**Aba Comparativo:**
- [ ] 3 `CompareCard` (Aprobación, Rechazo, Fraude en Aprobadas)
- [ ] Bloco Revenue Recovery com borda verde
- [ ] Tabela Confusion Matrix com `StatRow`
- [ ] Impacto Financeiro com `FraudBar`
- [ ] Barras de marcas de cartão
- [ ] Bloco Devoluciones

**Aba Fraud Intelligence:**
- [ ] Tabela Categorías de Mayor Riesgo (cor condicional fraud rate)
- [ ] Tabela BINs de Alto Riesgo (cor condicional)
- [ ] Tabela Dominios de Email con Fraude
- [ ] Tabela Identidades de Alta Velocidad (top 20)
- [ ] Tabela Códigos de Área con Fraude

**Aba Blocklist & Export:**
- [ ] 3 botões de download CSV (Documentos, BINs, Emails con Fraude)
- [ ] Tabela Identidades con Fraude Recurrente (2+ eventos, badge Koin Detectó)
- [ ] Tabela Emails con Fraude Recurrente
- [ ] Tabela Todos los Documentos con Fraude (top 50, exportável completo)

#### Persistência

- [ ] Salvar backtest no Supabase (`backtests` + `backtest_files`)
- [ ] Upload CSV para Supabase Storage
- [ ] Cache de `metrics_json` ao salvar
- [ ] Carregar backtest existente sem reprocessar CSV

---

## S — Stylize (Refinamento & UI)

- [ ] Revisão visual de todos os blocos do dashboard
- [ ] Dark mode verificado (tokens semânticos do tema)
- [ ] Responsividade: mobile, tablet, desktop
- [ ] PDF export: layout completo com branding Koin
  - [ ] Capa com nome do prospect, data, logo
  - [ ] Seção de resumo executivo
  - [ ] Seção comparativa (cards Hoy vs Con Koin)
  - [ ] Seção impacto financeiro
  - [ ] Seção intelligence (tabelas de risco)
  - [ ] Seção blocklist
  - [ ] Footer com disclaimer
- [ ] Estados vazios, loading e erro em todas as seções
- [ ] Tooltips explicativos nas métricas (`tooltip`)
- [ ] Feedback visual de upload em progresso

---

## T — Trigger (Deploy)

- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy automático em `main` funcionando
- [ ] Preview deploys em PRs ativos
- [ ] Domínio customizado configurado (ex: `hub.koin.com.br`)
- [ ] Teste end-to-end em produção: upload CSV → dashboard → exportar PDF
- [ ] `progress.md` atualizado com log final de deploy

---

## Checklist de Qualidade (antes de cada PR)

- [ ] Nenhum hex/rgb direto — apenas tokens do tema
- [ ] Nenhum componente criado do zero quando equivalente existe em `@/components/`
- [ ] TypeScript sem `any` explícito
- [ ] RLS ativo e testado no Supabase
- [ ] CSV nunca enviado ao Gemini (apenas resumo estatístico)
- [ ] `blueprint.md` atualizado se schema ou regra mudou
- [ ] `progress.md` atualizado com o que foi feito

---

*Atualizado em: 2026-03-27*
