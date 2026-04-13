# Blueprint — Koin Sales Hub

> **Lei do projeto.** Este ficheiro é a fonte de verdade do Sales Hub.
> Qualquer agente deve ler este ficheiro **antes** de qualquer ação.
> Alterações de schema, regras ou arquitetura devem ser refletidas aqui **antes** de alterar código.

---

## 1. Identidade do Projeto

| Campo | Valor |
|---|---|
| **Produto** | Koin Sales Hub |
| **Empresa** | Koin Antifraude |
| **Propósito** | Portal interno do time comercial para demonstração de módulos antifraude a prospects e clientes |
| **Módulo v1** | Backtest Results Viewer ("Testagens") |
| **Repositório** | Fork/continuação do `keystone-vibe` (ex: `koin-sales-hub`) |
| **Design System** | Keystone Vibe (tema KEYSTONE + Untitled UI React Aria + Tailwind CSS) |

---

## 2. Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Componentes UI | Untitled UI (React Aria + Tailwind CSS) — via `@/components/` |
| Tema | Keystone Vibe (`src/styles/theme.css`) |
| Auth | Supabase Auth (email+password, domínios permitidos no signup: `koin.com.br`, `otnl.com.br`) |
| Database | Supabase PostgreSQL com RLS |
| Storage | Supabase Storage (CSVs por `user_id/backtest_id/`) |
| AI | Google Gemini Flash (análise rápida) / Gemini Pro (fallback datasets complexos) |
| Deploy | Vercel — app: `https://koinsaleshub.vercel.app` (CI/CD via GitHub; branch de produção conforme projeto Vercel) |
| Versionamento | GitHub — branches: `main`, `develop`, `feature/*` |

### Integrações opcionais (servidor)

| Integração | Variável | Comportamento |
|---|---|---|
| Slack (pedidos de acesso) | `SALES_HUB_SLACK_SIGNUP_WEBHOOK_URL` | Após signup com utilizador em `pending`, `POST` para o *Incoming Webhook* com nome, email e link para `/admin/users`. Falhas do Slack não impedem o registo. Não é usado para contas promovidas pelo bootstrap admin. |

---

## 3. Arquitetura de Navegação

### Menu principal (header-navigations — fixo no topo)

Marca no header: wordmark **Sales Hub** + logomark Koin (componente `KoinSalesHubLogo`), não o wordmark do template Untitled UI.

| Item (UI em PT) | Status | Rota |
|---|---|---|
| **Backtestes** | Ativo (v1) | `/backtests/testagens` (destaque quando qualquer rota sob `/backtests/*`) |
| **Calculadora** | Ativo (feature/calculadora) | `/calculadora` (destaque quando qualquer rota sob `/calculadora/*`) |

Controles fixos do header:
- Seletor de idioma visível no topo (`PT`, `EN`, `ES`), com persistência local em `localStorage`.
- Ícones de configurações, notificações e avatar mantidos na mesma grelha em todas as páginas.

### Submenu da Calculadora (secondary nav do header)

| Tab | Rota | Notas |
|---|---|---|
| **Análise** | `/calculadora/calculo` | Ativo também em `/calculadora/new`, `/calculadora/[id]` e `/calculadora/[id]/export` (fluxo de assessment/relatório) |
| **Histórico** | `/calculadora/historico` | Lista de assessments; badge com contagem quando > 0 |
| **Configurações** | `/calculadora/configuracoes` | Placeholder de preferências do módulo |

### Submenu de Backtests (tabs)

| Tab | Ícone | Badge | Rota |
|---|---|---|---|
| **Testagens** | `bar-chart-01` | — | `/backtests/testagens` |
| Histórico | `folder` | Contagem de backtests salvos | `/backtests/historico` |
| Configurações | `settings-02` | — | `/backtests/configuracoes` |

### Admin — gestão de utilizadores

| Rota | Acesso |
|---|---|
| `/admin/users` | Apenas utilizadores com `users.role = 'admin'` (redireciona outros para `/backtests/testagens`) |

- Aprovar (`pending` → `active`), desativar (`disabled`), reativar, promover/remover admin via UI.
- API: `GET` / `PATCH` em `/api/admin/users` (validação de admin + RLS `users_admin_*`).
- `proxy.ts` exige sessão para `/admin/*` (igual a `/backtests/*`).

### Regras de layout

- `max-width` do container: `--max-width-container: 1280px` (header + conteúdo alinhados ao mesmo grid)
- Páginas de conteúdo devem reutilizar `max-w-container` e paddings horizontais `px-6 lg:px-8`; evitar hardcodes como `1216`, `1280`, `1400` por página
- Header e secondary nav persistem em todas as páginas; só o conteúdo abaixo muda
- Em telas menores: header colapsa para hamburger; tabs scrollam horizontalmente
- Breadcrumbs devem manter estrutura e estilo consistentes por módulo; na Calculadora, usar o padrão visual de slash + item corrente em verde
- Tabelas de listagem devem seguir o mesmo modelo visual base: `TableCard` com título + badge, toolbar interna com busca e filtro, cabeçalhos em uppercase pequeno e coluna de ações sempre nomeada
- Ações por linha em tabelas devem usar o mesmo padrão visual `icon only`; ação de visualizar usa `SearchLg` em todo o produto
- CTAs recorrentes devem preferir ícones `Line` da Untitled UI e o componente base `Button`; evitar `button` com classes avulsas quando o comportamento já existe no design system

### Componentes Untitled UI para layout

| Elemento | Componente | Caminho |
|---|---|---|
| Header fixo | `header-navigations` | `@/components/application/header-navigations` |
| Tabs segundo nível | `tabs` | `@/components/application/tabs` |
| Breadcrumbs | `breadcrumbs` | `@/components/application/breadcrumbs` |

---

## 4. Data Schemas (Supabase)

### Tabela: `users`

```sql
users
├── id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
├── email        text UNIQUE NOT NULL
├── name         text
├── role         text CHECK (role IN ('admin', 'user')) DEFAULT 'user'
├── status       text CHECK (status IN ('pending', 'active', 'disabled')) DEFAULT 'pending'
├── created_at   timestamptz DEFAULT now()
└── last_login   timestamptz
```

### Tabela: `backtests`

```sql
backtests
├── id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
├── user_id          uuid REFERENCES users(id) ON DELETE CASCADE
├── prospect_name    text NOT NULL
├── filename         text NOT NULL
├── created_at       timestamptz DEFAULT now()
├── row_count        integer
├── fraud_count      integer
├── metrics_json     jsonb   -- métricas calculadas (evita reprocessamento)
└── ai_insights_json jsonb   -- insights Gemini cacheados
```

### Tabela: `backtest_files`

```sql
backtest_files
├── id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
├── backtest_id     uuid REFERENCES backtests(id) ON DELETE CASCADE
├── storage_path    text NOT NULL   -- user_id/backtest_id/filename.csv
└── uploaded_at     timestamptz DEFAULT now()
```

### Tabela: `assessments` (Calculadora — feature/calculadora)

Migration: [`docs/supabase-assessments.sql`](docs/supabase-assessments.sql)

```sql
assessments
├── id                              uuid PRIMARY KEY DEFAULT gen_random_uuid()
├── created_at                      timestamptz DEFAULT now()
├── updated_at                      timestamptz DEFAULT now()  -- atualizado por trigger
├── user_id                         uuid REFERENCES users(id) ON DELETE CASCADE
├── status                          text CHECK ('draft' | 'complete')
├── merchant_name                   text NOT NULL
├── vertical                        text
├── volume_mensal                   text
├── ticket_medio                    numeric
├── modelo_negocio                  text
├── pct_volume_cartao               numeric
├── opera_crossborder               boolean
├── crossborder_paises              text
├── tem_programa_fidelidade         boolean
├── taxa_aprovacao                  numeric
├── taxa_chargeback                 numeric
├── taxa_decline                    numeric
├── pct_revisao_manual              numeric
├── challenge_rate_3ds              numeric
├── challenge_rate_outras           numeric
├── taxa_false_decline              numeric
├── tempo_revisao_manual            text
├── solucao_atual                   text
├── dores                           text[]
├── tem_regras_customizadas         text
├── validacao_identidade_onboarding text
├── device_fingerprinting           text
├── monitora_behavioral_signals     text
├── origem_fraude                   text[]
└── notas_comercial                 text
```

### Row Level Security (RLS)

Políticas reais e idempotentes: [`docs/supabase-setup.sql`](docs/supabase-setup.sql).

**Importante:** políticas admin **não** podem usar `EXISTS (SELECT … FROM public.users)` quando a própria policy aplica-se a `users` (ou quando a subconsulta reavalia RLS em `users`) — causa *infinite recursion detected in policy for relation "users"*. Usar a função `public.is_sales_hub_admin()` (`SECURITY DEFINER`) definida nesse SQL.

```sql
-- Exemplo conceitual (admin em backtests)
CREATE POLICY "backtests_admin_select_all"
  ON backtests FOR SELECT
  USING (public.is_sales_hub_admin());
```

### Supabase Storage

- Bucket: `backtest-files`
- Path: `{user_id}/{backtest_id}/{filename}.csv`
- RLS: usuários acessam apenas seus arquivos; admins acessam todos

---

## 5. CSV Column Mapping (Detecção por Keywords)

A ferramenta é agnóstica ao prospect. Colunas detectadas por keywords case-insensitive:

| Campo interno | Keywords de detecção |
|---|---|
| `amount` | `amount`, `total`, `valor`, `monto` |
| `paymentStatus` | `payment status`, `status`, `estado` |
| `fraud` | `fraud`, `fraude`, `chargeback` |
| `koinDecision` | `veredicto`, `koin`, `decision`, `resultado` |
| `item` | `item`, `product`, `producto`, `categoria` |
| `cardBrand` | `card brand`, `brand`, `marca`, `bandeira` |
| `date` | `date`, `fecha`, `data` |
| `delivery` | `delivery`, `envio`, `entrega` |
| `document` | `identification`, `document`, `cpf`, `dni`, `documento` |
| `email` | `email`, `correo`, `e-mail` |
| `phone` | `phone`, `telefono`, `celular`, `tel` |
| `bin` | `bin` |
| `orderId` | `order`, `pedido`, `orden` |

---

## 6. Value Classification

### Fraud positivo (campo `fraud`)
Qualquer valor **não vazio**, diferente de `"0"`, `"false"`, `"no"`.

### Koin Reject (campo `koinDecision`)
Contém: `"reject"`, `"rejected"`, `"recusado"`, `"rechazado"`, `"negado"`.

### Merchant Approved (campo `paymentStatus`)
Contém: `"acreditada"`, `"aprovad"`, `"approved"` — ou igual a `"paid"`.

### Merchant Rejected (campo `paymentStatus`)
Contém: `"rechazada"`, `"rejected"`, `"recusad"` — ou igual a `"denied"`.

### Devoluções / Cancelamentos (campo `paymentStatus`)
Contém: `"devol"`, `"anulaci"`, `"devuelta"`, `"cancel"`.

---

## 7. Fluxo do Usuário — Testagens

```
1. Acessa /backtests/testagens
2. Empty state com drag & drop ou file picker
3. Parsing automático + detecção de colunas
4. Cálculo de métricas (client-side, estático)
5. Envio de resumo estatístico para Gemini (nunca o CSV bruto)
6. Dashboard com 3 abas internas: **Comparativo** | **Inteligência** | **Transações**
7. Exportar PDF (relatório completo) ou CSVs (blocklists)
8. Salvar backtest → aparece em Histórico
```

---

## 8. Camadas de Análise

### Camada 1: Estática (client-side)

Renderizada sempre que as colunas mínimas existem. Funciona offline.

| Bloco | Colunas necessárias |
|---|---|
| Cards comparativos (aprovação, rejeição, fraud rate) | `paymentStatus`, `koinDecision`, `fraud` |
| Revenue Recovery | `paymentStatus`, `koinDecision`, `fraud`, `amount` |
| Confusion Matrix | `koinDecision`, `fraud` |
| Impacto Financeiro | `koinDecision`, `fraud`, `amount` |
| Categorías de risco | `item`, `fraud` |
| BINs de risco | `bin`, `fraud` |
| Identidades reincidentes | `document`, `fraud` |
| Emails reincidentes | `email`, `fraud` |
| Domínios de email | `email`, `fraud` |
| Alta velocidade (10+ txns) | `document` |
| Códigos de área | `phone`, `fraud` |
| Marcas de cartão | `cardBrand` |
| Tipo de entrega | `delivery` |
| Devoluções × veredicto Koin | `paymentStatus` (devolução), `koinDecision` |
| Tabelas de risco — coluna monto fraude | dimensão + `fraud` + `amount` |
| Alta velocidade — Koin rejects / volume | `document`, `koinDecision`, `amount` (opcionais para colunas extra) |
| Inteligência | Junta padrões de risco + recorrência + concentração por bandeira; previews em grelha 2x2 com `Ver todos` em modal |
| Transações | Tabela completa do CSV salvo, com busca, filtros e exportação do conjunto filtrado |
| Impacto econômico (valor protegido / GMV) | `amount`; valor protegido = fraude prevenida + volume recuperável |

**Regra:** bloco não renderiza se a coluna não existe. Sem erros, sem placeholders. O objeto `capabilities` em `metrics_json` (quando presente) alinha a UI a esta matriz; JSON antigo sem `capabilities` mantém comportamento legado permissivo.

### Camada 2: Agente AI (server-side, Gemini)

Recebe resumo estatístico (nunca CSV bruto) e devolve:
- Insights textuais customizados com severidade (crítico, moderado, informativo)
- Detecção de anomalias não cobertas pelos blocos estáticos
- Recomendações de regras

**Modelo:** Gemini Flash (< 3s) / Gemini Pro como fallback.

---

## 9. Perfis de Acesso

| Perfil | Permissões |
|---|---|
| **Admin** | Ver todos os backtests de todos os usuários. Painel administrativo: aprovar/rejeitar registros, resetar senhas, desativar contas, log de uso. Navegar "como usuário". |
| **Usuário** | Upload e visualização dos próprios backtests. Exportação PDF e CSVs. Histórico próprio. |

### Fluxo de registro

1. Sign-up com email num domínio permitido (`@koin.com.br`, `@otnl.com.br`) → conta fica `pending`
2. Admin aprova → status muda para `active`
3. Apenas `active` pode fazer login e usar o sistema

---

## 10. Regras de UI (Behavioral Rules)

### Obrigatório
- **Nunca criar componentes de UI do zero** quando existir equivalente em `@/components/`
- **Pesquisar** `src/components/base/`, `src/components/application/`, `src/components/foundations/` antes de implementar qualquer UI
- **Tokens de cor** do tema KEYSTONE obrigatórios — proibido usar hex/rgb direto
- **React Aria** para interatividade (não misturar com Radix UI)
- **Ícones**: preferir `@untitledui/icons`
- **Classes condicionais**: usar `tailwind-merge`

### Componentes customizados permitidos (não existem na biblioteca)

| Componente | Descrição | Tokens |
|---|---|---|
| `CompareCard` | Card "Hoy / Con Koin" dividido em 2 colunas, badge de delta, valores em font-mono | `bg-white`, `border-gray-200`, `rounded-xl`, `shadow-xs` |
| `RiskTable` | Extensão de `tables` com cor condicional por fraud rate, overflow horizontal, zebra | `text-error-800` (>1%), `text-warning-800` (>0.3%) |
| `StatRow` | Linha key-value | `text-sm text-gray-600` (label), `text-md font-mono font-semibold` (valor), `border-b border-gray-100` |
| `FraudBar` | Barra proporcional prevenido vs. residual | `bg-brand-500` (prevenido), `bg-error-800` (residual), `rounded-md h-2` |

### Tokens de cor principais (KEYSTONE)

| Token | Valor | Uso |
|---|---|---|
| `brand-500` | rgb(16 177 50) | Acento principal — #10B132 |
| `brand-600` | rgb(12 141 40) | Botões, links |
| `brand-700` | rgb(9 108 31) | Hover |
| `gray-900` | rgb(16 24 40) | Texto primário |
| `gray-600` | rgb(71 84 103) | Texto secundário |
| `gray-200` | rgb(228 231 236) | Borders |
| `error-800` | rgb(145 32 24) | Fraude, danger |
| `warning-800` | rgb(147 55 13) | Alerta |
| `success-800` | rgb(8 93 58) | Sucesso |

---

## 11. Invariantes Arquiteturais

1. **RLS sempre ativo** — nunca desativar Row Level Security no Supabase
2. **CSV nunca enviado ao Gemini** — apenas resumo estatístico (métricas agregadas, top N)
3. **Bloco condicional** — se coluna não existe no CSV, o bloco não renderiza (sem erro, sem placeholder)
4. **Métricas cacheadas** — `metrics_json` e `ai_insights_json` no Supabase evitam reprocessamento
5. **Schema imutável** — nunca alterar schemas de DB sem atualizar este blueprint e criar migration
6. **alwaysApply rules** — toda sessão de agente começa lendo este ficheiro

---

## 12. Scope por Versão

| Versão | Escopo |
|---|---|
| **v1.0 MVP** | Upload CSV + dashboard estático (3 abas) + Auth Supabase (login, sign-up com aprovação) + Persistência backtests + Deploy Vercel |
| **v1.1** | Integração Gemini: insights customizados + seção "Insights AI" + cache no Supabase |
| **v1.2** | Admin Panel: aprovação de registros, gestão de usuários, navegação "como usuário" |
| **v1.3** | Tab Histórico funcional + PDF server-side + Tab Configurações + filtros |
| **v2.0** | Cards 01 e 02, módulo Demonstrations, módulo Guides, comparação entre backtests |
| **v3.0** | Pipeline direto (sem upload manual), benchmark entre prospects, integração com Estratégias |

---

## 13. Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=

# Opcional — primeiro admin sem aprovação manual (só em dev/staging; em produção remover ou deixar vazio)
SALES_HUB_BOOTSTRAP_ADMIN_EMAIL=seu@otnl.com.br
```

### Primeiro administrador (bootstrap)

O fluxo normal exige um admin para aprovar novos registos. Para o **primeiro** acesso sem painel admin:

1. Definir `SALES_HUB_BOOTSTRAP_ADMIN_EMAIL` com o email exato que será usado no signup (recomenda-se minúsculas).
2. Garantir `SUPABASE_SERVICE_ROLE_KEY` configurada (o signup usa a service role só neste passo para `UPDATE` em `public.users`).
3. Registar em `/signup` com esse email e uma senha à tua escolha — ficas `admin` + `active` e podes entrar de seguida.
4. Em produção, remover a variável ou esvaziá-la para não promover contas novas automaticamente.

Utilizadores já existentes em `pending` não são alterados pelo bootstrap; usar SQL manual ou apagar o utilizador em Auth e voltar a registar com a variável ativa.

### Recuperação de senha (Supabase)

O fluxo usa `resetPasswordForEmail` com redirecionamento para `/auth/atualizar-senha`. Em **Supabase Dashboard → Authentication → URL Configuration**, incluir em **Redirect URLs**:

- `http://localhost:3000/auth/atualizar-senha` (dev)
- URL de produção equivalente após deploy

---

*Blueprint gerado em: 2026-03-27 — fonte: `FunctionalitiesPRDs/backtest-viewer-prd.md`*
*Atualizar este ficheiro sempre que: schema mudar, regra for adicionada, arquitetura for modificada.*
