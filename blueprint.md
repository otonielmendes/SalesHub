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
| Auth | Supabase Auth (email+password, domínio restrito `@koin.com.br`) |
| Database | Supabase PostgreSQL com RLS |
| Storage | Supabase Storage (CSVs por `user_id/backtest_id/`) |
| AI | Google Gemini Flash (análise rápida) / Gemini Pro (fallback datasets complexos) |
| Deploy | Vercel (CI/CD automático via GitHub `main`) |
| Versionamento | GitHub — branches: `main`, `develop`, `feature/*` |

---

## 3. Arquitetura de Navegação

### Menu principal (header-navigations — fixo no topo)

| Item | Status | Rota |
|---|---|---|
| **Backtests** | Ativo (v1) | `/backtests` |
| Demonstrations | Futuro | `/demonstrations` |
| Guides | Futuro | `/guides` |

### Submenu de Backtests (tabs)

| Tab | Ícone | Badge | Rota |
|---|---|---|---|
| **Testagens** | `bar-chart-01` | — | `/backtests/testagens` |
| Histórico | `folder` | Contagem de backtests salvos | `/backtests/historico` |
| Configurações | `settings-02` | — | `/backtests/configuracoes` |

### Regras de layout

- `max-width` do container: `--max-width-container: 1280px` (header + conteúdo alinhados ao mesmo grid)
- Header e tabs persistem em todas as páginas; só o conteúdo abaixo muda
- Em telas menores: header colapsa para hamburger; tabs scrollam horizontalmente

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

### Row Level Security (RLS)

```sql
-- Usuários veem apenas seus próprios backtests
CREATE POLICY "Users see own backtests"
ON backtests FOR SELECT
USING (auth.uid() = user_id);

-- Admins veem tudo
CREATE POLICY "Admins see all backtests"
ON backtests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
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
6. Dashboard com 3 abas internas: Comparativo | Fraud Intelligence | Blocklist & Export
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

**Regra:** bloco não renderiza se a coluna não existe. Sem erros, sem placeholders.

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

1. Sign-up com email `@koin.com.br` → conta fica `pending`
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
| `brand-500` | rgb(30 215 183) | Acento principal |
| `brand-600` | rgb(0 191 152) | Botões, links |
| `brand-700` | rgb(0 166 131) | Hover |
| `gray-900` | rgb(16 24 40) | Texto primário |
| `gray-600` | rgb(102 112 133) | Texto secundário |
| `gray-200` | rgb(242 244 247) | Borders |
| `error-800` | rgb(222 52 80) | Fraude, danger |
| `warning-800` | rgb(235 143 8) | Alerta |
| `success-800` | rgb(41 189 169) | Sucesso |

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
```

---

*Blueprint gerado em: 2026-03-27 — fonte: `FunctionalitiesPRDs/backtest-viewer-prd.md`*
*Atualizar este ficheiro sempre que: schema mudar, regra for adicionada, arquitetura for modificada.*
