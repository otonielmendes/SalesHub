# Sales Hub — PRD

## Produto: Koin Sales Hub
## Módulo v1: Testagens (Backtest Results Viewer)

## Visão Geral

O **Sales Hub** é o portal interno do time comercial da Koin Antifraude. Seu propósito é centralizar ferramentas de demonstração dos módulos e funcionalidades da solução antifraude para prospects e clientes.

O **Backtest Results Viewer** (internamente: "Testagens") é a primeira funcionalidade do Sales Hub. Ele transforma o CSV de resultado de backtest em uma interface visual de performance e inteligência de fraude, com capacidade de exportação em PDF e CSV.

Futuras funcionalidades do Sales Hub incluirão Demonstrações de módulos (Chargebacks, Anti-ATO, Device Fingerprinting) e Guides/Materiais de apoio comercial.

---

## Arquitetura de Navegação

### Estrutura do Sales Hub

O layout segue o padrão **Informational Pages 02** da Untitled UI (`informational-pages-02`), com header navigation horizontal + tabs de segundo nível.

#### Menu principal (header-navigations)

Barra horizontal fixa no topo com logo Koin e itens de navegação de primeiro nível:

| Item | Status | Rota |
|---|---|---|
| **Backtests** | Ativo (v1) | `/backtests` |
| Demonstrations | Futuro | `/demonstrations` |
| Guides | Futuro | `/guides` |

Referência visual: segunda screenshot (wireframe Sales Hub), com logo K + itens "Backtests", "Demonstrations", "Guides".

#### Submenu (tabs)

Dentro de cada item do menu principal, uma barra de tabs de segundo nível usando o componente `@/components/application/tabs`:

**Backtests:**

| Tab | Ícone | Badge | Descrição |
|---|---|---|---|
| **Testagens** | `bar-chart-01` ou equivalente | — | Upload e visualização de resultados de backtest |
| Histórico | `folder` | Contagem de backtests salvos | Lista de backtests anteriores |
| Configurações | `settings-02` | — | Configurações de parâmetros padrão |

Referência visual: segunda screenshot, com "Testagens", "Histórico (10)", "Configurações".

### Regras de layout

1. **Max-width consistente**: o `max-width` do container de conteúdo deve ser o mesmo do header navigation. Valor do tema: `--max-width-container: 1280px`. Tudo (header, tabs, conteúdo) alinhado ao mesmo grid.

2. **Persistência do menu**: a barra de navegação principal (header) e as tabs de segundo nível persistem em todas as páginas. O conteúdo abaixo das tabs é o único elemento que muda.

3. **Grid alignment**: o conteúdo interno (cards, tabelas, seções) respeita o mesmo padding horizontal do header. Sem conteúdo mais largo que a navegação.

4. **Responsividade**: em telas menores, o header colapsa para menu hamburger. As tabs de segundo nível podem scrollar horizontalmente.

### Referência de componentes Untitled UI

| Elemento | Componente | Caminho | Referência |
|---|---|---|---|
| Header fixo | `header-navigations` | `@/components/application/header-navigations` | Primeira screenshot (dashboard Chargebacks) |
| Tabs segundo nível | `tabs` | `@/components/application/tabs` | Segunda screenshot (wireframe Sales Hub) |
| Breadcrumbs (dentro de Testagens) | `breadcrumbs` | `@/components/application/breadcrumbs` | Para navegação Testagens > [Nome do prospect] |
| Page layout | Informational Pages 02 | Padrão de página da Untitled UI | `informational-pages-02` |

---

## Fluxo: Testagens (Backtest Results Viewer)

---

## Contexto do Backtest na Koin

O backtest é o principal instrumento de conversão comercial. O prospect fornece um dataset histórico de transações e a Koin simula qual teria sido a performance dos seus modelos e regras sobre esse dataset.

Existem dois caminhos de processamento:

1. **Automático (fast track)**: o dataset entra no pipeline padrão, roda contra modelos e regras gerais, e sai o resultado.
2. **Customizado**: quando a performance automática não é satisfatória, o time de modelos calibra um modelo específico e um rule set dedicado para o prospect.

Em ambos os casos, o entregável final é um CSV com as transações marcadas, onde cada linha contém a decisão simulada da Koin (Accept/Reject).

---

## Estrutura do CSV de Entrada

O CSV de resultado do backtest contém as seguintes colunas (baseado no caso Megatone, mas a ferramenta deve ser agnóstica e detectar colunas por keywords):

| Coluna | Descrição | Exemplo |
|---|---|---|
| Identification Document | DNI/CPF do comprador | 31693589 |
| Transaction Date | Data e hora da transação | 1/7/2025 00:00 |
| Email | Email do comprador | usuario@gmail.com |
| Phone | Telefone com código de área | 11-66422117 |
| BIN | Primeiros 6 dígitos do cartão | 433833 |
| Card Brand | Bandeira do cartão | Visa |
| Last Digits | Últimos 4 dígitos do cartão | _6214 |
| Payment Status | Status real da transação no merchant | Acreditada, Rechazada, Devolución Confirmada, Anulación Confirmada |
| Item | Categoria do produto | CELULARES LIBERADOS |
| Total Amount | Valor da transação | $ 107.970 |
| Order ID | ID do pedido | 5220374 |
| Delivery Type | Tipo de entrega | Envío a Domicilio, Retiro en Sucursal |
| Fraud | Flag de fraude real (vazio = legítimo) | Desconocimiento del cliente |
| Veredicto Koin | Decisão simulada da Koin | Accept, Reject |

### Detecção automática de colunas

A ferramenta não deve depender de nomes exatos. Cada coluna é mapeada por keywords:

- **Amount**: "amount", "total", "valor", "monto"
- **Payment Status**: "payment status", "status", "estado"
- **Fraud**: "fraud", "fraude", "chargeback"
- **Koin Decision**: "veredicto", "koin", "decision", "resultado"
- **Item**: "item", "product", "producto", "categoria"
- **Card Brand**: "card brand", "brand", "marca", "bandeira"
- **Date**: "date", "fecha", "data"
- **Delivery**: "delivery", "envio", "entrega"
- **Document**: "identification", "document", "cpf", "dni", "documento"
- **Email**: "email", "correo", "e-mail"
- **Phone**: "phone", "telefono", "celular", "tel"
- **BIN**: "bin"
- **Order ID**: "order", "pedido", "orden"

### Detecção de valores

Os valores de cada coluna também variam entre prospects (português, espanhol, inglês). A lógica de classificação deve cobrir:

- **Fraud positivo**: qualquer valor não vazio, diferente de "0", "false", "no"
- **Koin Reject**: "reject", "rejected", "recusado", "rechazado", "negado"
- **Merchant Approved**: contém "acreditada", "aprovad", "approved", ou igual a "paid"
- **Merchant Rejected**: contém "rechazada", "rejected", "recusad", ou igual a "denied"

---

## Arquitetura da Interface

### Fluxo do Usuário

1. Usuário acessa o Sales Hub e está na aba "Backtests" > "Testagens"
2. Tela de upload do CSV (empty state com drag & drop ou file picker)
3. Parsing automático com detecção de colunas
4. Cálculo de todas as métricas
5. Exibição do dashboard com três abas internas: Comparativo, Fraud Intelligence, Blocklist & Export
6. Opção de exportar PDF (relatório completo) ou CSVs (blocklists)
7. Ao finalizar, o backtest pode ser salvo e aparece na aba "Histórico"

### Layout da Testagem

Dentro da aba "Testagens", o conteúdo segue esta hierarquia:

- **Header do Sales Hub** (persistente): logo K + "Backtests" | "Demonstrations" | "Guides"
- **Tabs do módulo** (persistente): "Testagens" | "Histórico" | "Configurações"
- **Breadcrumb** (contextual): Testagens > [Nome do prospect] (quando um backtest está aberto)
- **Conteúdo**: varia entre empty state (upload), dashboard de resultados, ou lista de histórico

Quando um backtest está carregado, o conteúdo exibe três tabs internas (dentro do conteúdo, não no submenu):
- Comparativo
- Fraud Intelligence
- Blocklist & Export

---

## Seção 1: Comparativo de Performance

Objetivo: mostrar ao prospect, de forma imediata, como a operação dele performaria com a Koin. Segue o padrão visual "Hoy vs. Con Koin" com deltas em pontos percentuais.

### Cards comparativos

Cada card mostra dois lados (Hoy / Con Koin) com o valor principal, volume absoluto embaixo, e badge de delta no canto superior direito.

| Métrica | Hoy (dados reais do merchant) | Con Koin (simulação) | Delta |
|---|---|---|---|
| **Aprobación** | % de transações com Payment Status = Acreditada sobre o total | % de transações com Veredicto Koin = Accept sobre o total | Diferença em pp |
| **Rechazo** | % de transações com Payment Status = Rechazada sobre o total | % de transações com Veredicto Koin = Reject sobre o total | Diferença em pp |
| **Fraude en Aprobadas** | Fraudes em transações Acreditadas / Total de Acreditadas | Fraudes em transações Koin Accept / Total de Koin Accept | % de redução |

### Revenue Recovery

Bloco destacado com borda lateral verde. Mostra a oportunidade de receita que o merchant perde ao rejeitar transações legítimas.

Cálculo: transações onde Payment Status = Rechazada AND Veredicto Koin = Accept AND Fraud = vazio.

Métricas exibidas:
- Transações recuperáveis (contagem)
- Volume recuperável (soma dos amounts)
- % de rechazos recuperados (recuperáveis / total de rechazadas)

### Detecção de Fraude

Tabela de métricas com a confusion matrix:
- True Positives (TP): Fraud + Koin Reject
- False Negatives (FN): Fraud + Koin Accept
- False Positives (FP): Not Fraud + Koin Reject
- True Negatives (TN): Not Fraud + Koin Accept
- Taxa de detecção: TP / (TP + FN)

### Impacto Financeiro

- Monto total de fraude (soma dos amounts de transações com fraud)
- Fraude prevenido por Koin (soma dos amounts de TP)
- Fraude residual (soma dos amounts de FN)
- % prevenido (fraude prevenido / total de fraude)
- Barra visual proporcional prevenido vs. residual

### Marcas de Cartão

Barras horizontais com volume por bandeira, ordenado por total de transações.

### Devoluciones y Cancelaciones

- Total de devoluciones/cancelaciones (Payment Status contém "devol", "anulaci", "devuelta", "cancel")
- Quantas a Koin rejeitaria (devoluciones com Veredicto Koin = Reject)
- % de devoluciones evitáveis

---

## Seção 2: Fraud Intelligence

Objetivo: transformar o backtest em ferramenta de inteligência. Não apenas "como a Koin performaria", mas "o que os dados do prospect revelam sobre o perfil de fraude da operação dele".

### Categorías de Mayor Riesgo

Tabela com todas as categorias de produto que tiveram pelo menos 1 fraude, ordenadas por contagem de fraude.

Colunas: Categoría, Fraudes, Total Txns, Fraud Rate (%), Monto Fraude.

Cor condicional no Fraud Rate: vermelho se > 1%, âmbar se > 0.3%, padrão caso contrário.

Insight esperado: Gift Cards com 44% de fraud rate é um sinal de alerta crítico. Celulares e TVs concentram o maior volume absoluto.

### BINs de Alto Riesgo

Tabela de BINs com pelo menos 5 transações e pelo menos 1 fraude, ordenados por fraud rate decrescente.

Colunas: BIN, Fraudes, Total, Fraud Rate (%), Monto Fraude.

Cor condicional: vermelho se > 3%, âmbar se > 1%.

Insight esperado: BIN 514908 com 28 fraudes em 849 transações (3.3%) é candidato a regra de bloqueio ou step-up.

### Dominios de Email con Fraude

Tabela de domínios de email com fraude, ordenados por fraud rate.

Colunas: Dominio, Fraudes, Total, Fraud Rate.

Insight esperado: domínios com typos ("gmail.con") ou pouco comuns ("mail.mercadoli") com taxas altíssimas indicam padrões de email descartável.

### Identidades de Alta Velocidad

Tabela de documentos com 10 ou mais transações no período, independente de terem fraude. Detecta abuso de velocidade.

Colunas: Documento, Txns, Fraudes, Koin Rejects, Volumen.

Top 20 por volume de transações.

Insight esperado: IDs com alta velocidade E fraude são perfis de alto risco. IDs com alta velocidade sem fraude mas com muitos Koin rejects merecem investigação.

### Códigos de Área Telefónico con Fraude

Tabela de códigos de área com fraude, ordenados por fraud rate.

Colunas: Código Área, Fraudes, Total, Fraud Rate.

Insight esperado: concentrações regionais de fraude (ex: área 2323 com 6% de fraud rate sobre 116 transações).

---

## Seção 3: Blocklist & Export

Objetivo: tornar a inteligência acionável. O prospect (ou o time comercial) pode baixar listas prontas para alimentar regras de bloqueio.

### Botões de Export

Três botões de download de CSV:
1. **Documentos con Fraude**: todos os IDs com pelo menos 1 fraude, com contagem, monto, categorias, emails
2. **BINs de Riesgo**: todos os BINs com fraude (min 5 txns), com fraud rate e monto
3. **Emails con Fraude**: todos os emails com fraude, com contagem, categorias, documentos

### Identidades con Fraude Recurrente

Tabela de documentos com 2 ou mais eventos de fraude. Candidatos prioritários para blocklist permanente.

Colunas: Documento, Fraudes, Monto Total, Categorías, Koin Detectó (badge X/Y).

O badge "Koin Detectó" mostra quantos dos eventos de fraude a Koin teria rejeitado. Verde se detectou todos, âmbar se detectou parcialmente.

### Emails con Fraude Recurrente

Tabela de emails com 2 ou mais eventos de fraude, cruzado com os documentos utilizados.

Colunas: Email, Fraudes, Documentos Usados, Categorías.

Insight esperado: mesmos emails usando diferentes documentos indica fraude organizada.

### Todos los Documentos con Fraude

Lista completa de todos os IDs com fraude (limitado a 50 na tela, exportável completo via CSV).

Colunas: Documento, Eventos, Monto, Categorías.

---

## Exportação PDF

O botão "Exportar PDF" no navbar gera um relatório completo com todas as métricas e tabelas das três seções, formatado para apresentação ao prospect.

O PDF deve conter:
- Capa com nome do prospect (extraído do nome do arquivo), data, e branding Koin
- Seção de resumo executivo com as métricas hero
- Seção comparativa com os cards Hoy vs. Con Koin
- Seção de impacto financeiro e revenue recovery
- Seção de intelligence com as tabelas de risco
- Seção de blocklist com as tabelas de reincidentes
- Footer com disclaimer: "Projeções baseadas em backtests conservadores. Não inclui custo da solução Koin. Resultados reais dependem de implementação e qualidade dos dados."

---

## Design System — Keystone Vibe

A interface deve ser construída usando o design system **Keystone Vibe** (repositório: `github.com/otomendes/keystone-vibe`), que combina o tema KEYSTONE com componentes Untitled UI (React Aria + Tailwind CSS).

### Regra obrigatória

Não criar componentes de UI do zero quando existir equivalente em `@/components/`. A Cursor skill `keystone-vibe` (`.cursor/skills/keystone-vibe/SKILL.md`) garante essa regra durante o desenvolvimento.

### Tokens de cor (tema KEYSTONE)

Todas as cores devem usar tokens Tailwind do tema. Nunca usar valores hex/rgb diretos.

**Brand (green/teal, cor primária Koin):**
- `brand-500`: rgb(30 215 183) — acento principal
- `brand-600`: rgb(0 191 152) — botões, links
- `brand-700`: rgb(0 166 131) — hover
- `brand-800`: rgb(0 140 110) — pressed
- `brand-900`: rgb(0 115 90) — texto sobre fundo claro

**Gray (light mode):**
- `gray-25`/`gray-50`: rgb(252 252 253) — backgrounds
- `gray-100`: rgb(249 250 251) — surface alternativa
- `gray-200`: rgb(242 244 247) — borders
- `gray-300`: rgb(229 231 235) — borders secundárias
- `gray-500`: rgb(152 162 179) — texto dim
- `gray-600`: rgb(102 112 133) — texto secundário
- `gray-700`: rgb(69 79 98) — texto terciário
- `gray-900`: rgb(16 24 40) — texto primário
- `gray-950`: rgb(6 14 24) — texto mais forte

**Error (danger, fraude):**
- `error-50`: rgb(255 249 250) — background sutil
- `error-100`: rgb(255 237 240) — background
- `error-600`: rgb(239 137 153) — ícones
- `error-800`: rgb(222 52 80) — texto, badges
- `error-900`: rgb(213 13 45) — texto forte
- `error-950`: rgb(194 10 39) — crítico

**Warning:**
- `warning-50`: rgb(255 253 245) — background sutil
- `warning-600`: rgb(249 188 90) — ícones
- `warning-800`: rgb(235 143 8) — texto

**Success:**
- `success-50`: rgb(240 252 249) — background sutil
- `success-600`: rgb(101 211 195) — ícones
- `success-800`: rgb(41 189 169) — texto
- `success-950`: rgb(0 153 133) — texto forte

### Tipografia

- **Body e Display**: Inter (`--font-body`, `--font-display`)
- **Mono** (valores numéricos): `--font-mono` (Roboto Mono, SFMono-Regular, Menlo)
- Tamanhos definidos no tema: `text-xs` (12px), `text-sm` (14px), `text-md` (16px), `text-lg` (18px), `text-xl` (20px), `display-xs` a `display-2xl`

### Radius

Usar tokens: `radius-sm` (4px), `radius-md` (6px), `radius-lg` (8px), `radius-xl` (12px), `radius-2xl` (16px)

### Shadows

Usar tokens: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

### Componentes Untitled UI a utilizar

O Backtest Viewer deve usar estes componentes da biblioteca existente:

| Necessidade | Componente Untitled UI | Caminho |
|---|---|---|
| Navegação por abas | `tabs` | `@/components/application/tabs` |
| Tabelas de dados | `tables` | `@/components/application/tables` |
| Cards de métricas | `metrics` | `@/components/application/metrics` |
| Badges (deltas, contadores) | `badges` | `@/components/base/badges` |
| Botões (export, upload) | `buttons` | `@/components/base/buttons` |
| Alertas (insights) | `alerts` | `@/components/application/alerts` |
| Breadcrumbs (navegação) | `breadcrumbs` | `@/components/application/breadcrumbs` |
| Progress bars (fraude prevenida) | `progress-indicators` | `@/components/base/progress-indicators` |
| Loading (parsing CSV) | `loading-indicators` | `@/components/application/loading-indicators` |
| Empty state (sem CSV) | `empty-states` | `@/components/application/empty-states` |
| Tooltips (explicação métricas) | `tooltip` | `@/components/base/tooltip` |
| Header de página | `header-navigations` | `@/components/application/header-navigations` |
| Featured icons | `featured-icon` | `@/components/foundations/featured-icon` |
| Tags (categorias) | `tags` | `@/components/base/tags` |
| Dropdown (filtros) | `dropdown` | `@/components/base/dropdown` |

### Componentes customizados a criar

Estes componentes não existem na biblioteca e devem ser criados respeitando os tokens do tema:

- **CompareCard**: card com layout "Hoy / Con Koin" dividido em duas colunas, badge de delta no header, valores em font-mono. Usar `bg-white`, `border-gray-200`, `rounded-xl`, `shadow-xs`.
- **RiskTable**: extensão do componente `tables` com cor condicional por fraud rate (classes `text-error-800`, `text-warning-800`), suporte a overflow horizontal, e linha zebra com `bg-gray-50`.
- **StatRow**: linha de key-value com `text-sm text-gray-600` para label e `text-md font-mono font-semibold` para valor, `border-b border-gray-100`.
- **FraudBar**: barra proporcional de fraude prevenida vs. residual usando `bg-brand-500` e `bg-error-800`, `rounded-md`, `h-2`.

### Convenções técnicas

- **React Aria** para interatividade, não misturar com Radix UI
- **Ícones**: preferir `@untitledui/icons`
- **Classes condicionais**: usar `tailwind-merge`
- **Dark mode**: suportado via tokens semânticos do tema (já definidos em `theme.css` sob `@media (prefers-color-scheme: dark)`)

---

## Requisitos Técnicos

### Stack

- **Framework**: Next.js (App Router, já configurado no keystone-vibe template)
- **Componentes**: Untitled UI (React Aria + Tailwind CSS)
- **Tema**: Keystone Vibe (`src/styles/theme.css`)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS com tokens do tema
- **Backend/DB**: Supabase (auth, storage, database)
- **AI Agent**: Gemini (análise dinâmica de CSV e geração de insights)
- **Deploy**: Vercel
- **Versionamento**: GitHub (repositório único, desenvolvimento incremental com branches e PRs)

### Arquitetura de análise: Estático + Agente AI

O dashboard combina duas camadas de análise:

#### Camada 1: Blocos estáticos (client-side)

Renderizados sempre que as colunas mínimas existem no CSV. São os cards e tabelas que definimos nas seções anteriores. Funcionam offline, sem depender de API externa.

Regra: se a coluna existe no CSV, o bloco correspondente aparece. Se não existe, o bloco simplesmente não renderiza. Sem erros, sem placeholders.

| Bloco | Colunas necessárias |
|---|---|
| Cards comparativos (aprovação, rejeição, fraud rate) | Payment Status, Veredicto Koin, Fraud |
| Revenue Recovery | Payment Status, Veredicto Koin, Fraud, Amount |
| Confusion Matrix | Veredicto Koin, Fraud |
| Impacto Financeiro | Veredicto Koin, Fraud, Amount |
| Categorías de risco | Item, Fraud |
| BINs de risco | BIN, Fraud |
| Identidades reincidentes | Document ID, Fraud |
| Emails reincidentes | Email, Fraud |
| Domínios de email | Email, Fraud |
| Alta velocidade | Document ID |
| Códigos de área | Phone, Fraud |
| Marcas de cartão | Card Brand |
| Tipo de entrega | Delivery Type |

#### Camada 2: Agente AI (server-side, Gemini)

Após o parsing e os cálculos estáticos, um resumo estatístico do CSV (nunca o CSV bruto, por segurança e tamanho) é enviado para o Gemini. O agente recebe:

- Lista de colunas disponíveis
- Métricas agregadas já calculadas (totais, taxas, top N de cada dimensão)
- Distribuições resumidas (top 10 categorias, top 10 BINs, etc.)

O agente devolve:

- Insights textuais customizados (ex: "Gift Cards representam 44% da fraude apesar de serem apenas 0.007% das transações, isso sugere uso como meio de lavagem")
- Detecção de anomalias que os blocos estáticos não cobrem (ex: "Há um cluster de 7 transações fraudulentas do mesmo documento em categorias completamente distintas, padrão de teste de cartão")
- Recomendações de regras (ex: "Considere step-up authentication para BIN 514908, que tem 3.3% de fraud rate vs. 0.14% da média")
- Severidade de cada insight (crítico, moderado, informativo)

Os insights aparecem numa seção "Insights AI" no dashboard, com ícone de AI e disclaimer de que são gerados por modelo.

**Modelo recomendado**: Gemini Flash para análise rápida (latência < 3s). Gemini Pro como fallback para datasets complexos.

### Autenticação e Controle de Acesso

#### Autenticação (Supabase Auth)

- Login via email + password
- Restrição de domínio: apenas emails `@koin.com.br` (e domínios autorizados) podem se registrar
- Fluxo de registro: qualquer pessoa com email Koin pode preencher o sign-up, mas a conta fica em estado "pendente" até aprovação do admin
- Páginas de auth seguindo os padrões Untitled UI:
  - Sign up: `signup-split-quote-image-01` (`@/components/sign-up-pages`)
  - Login: `login-split-quote-image-02` (`@/components/log-in-pages`)

#### Perfis de acesso

| Perfil | Permissões |
|---|---|
| **Admin** (Oto + designados) | Ver todos os backtests de todos os usuários. Filtrar por usuário. Painel administrativo com: aprovar/rejeitar solicitações de acesso, resetar senhas, desativar contas, ver log de uso. Todas as funcionalidades de usuário. |
| **Usuário** (time comercial) | Upload e visualização dos próprios backtests. Exportação de PDF e CSVs. Acesso ao histórico próprio. Não vê backtests de outros usuários. |

#### Painel administrativo

Acessível apenas pelo perfil Admin. Inclui:

- **Solicitações pendentes**: lista de registros aguardando aprovação, com email, data, e botões aprovar/rejeitar
- **Usuários ativos**: lista de todos os usuários com status, último acesso, quantidade de backtests
- **Ações**: aprovar, desativar, resetar senha, promover a admin
- **Navegação por usuário**: o admin pode selecionar um usuário e ver o Sales Hub "como se fosse" aquele usuário (ver seus backtests, histórico), com indicador visual claro de que está em modo admin

### Persistência (Supabase Database)

#### Tabelas principais

```
users
├── id (uuid, PK)
├── email
├── name
├── role (admin | user)
├── status (pending | active | disabled)
├── created_at
└── last_login

backtests
├── id (uuid, PK)
├── user_id (FK → users)
├── prospect_name (extraído do filename ou input manual)
├── filename
├── created_at
├── row_count
├── fraud_count
├── metrics_json (métricas calculadas, para carregar rápido sem reprocessar)
└── ai_insights_json (insights do Gemini, cacheados)

backtest_files
├── id (uuid, PK)
├── backtest_id (FK → backtests)
├── storage_path (referência ao Supabase Storage)
└── uploaded_at
```

#### Supabase Storage

CSVs armazenados no Supabase Storage com RLS (Row Level Security):
- Usuários só acessam seus próprios arquivos
- Admins acessam todos
- Arquivos organizados por `user_id/backtest_id/filename.csv`

#### Row Level Security (RLS)

```sql
-- Usuários veem apenas seus backtests
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

### Deploy (Vercel)

- Repositório GitHub conectado à Vercel
- Deploy automático em push para `main`
- Preview deploys para PRs
- Variáveis de ambiente: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`
- Domínio customizado: a definir (ex: `sales.koin.com.br` ou `hub.koin.com.br`)

### Versionamento (GitHub)

Repositório: continuação do `keystone-vibe` ou fork dedicado (ex: `koin-sales-hub`).

Estratégia de branches:
- `main`: produção (deploy automático na Vercel)
- `develop`: integração
- `feature/*`: funcionalidades (ex: `feature/backtest-viewer`, `feature/admin-panel`, `feature/gemini-insights`)
- PRs com review antes de merge para `main`

---

## Evolução Futura

### v1.0 — MVP Testagens
- Card 03 (Comparativo de Performance) funcional com Viewer
- Upload CSV marcado → dashboard estático com as três abas
- Auth básica com Supabase (login, sign-up com aprovação)
- Persistência de backtests no Supabase
- Deploy na Vercel

### v1.1 — Intelligence AI
- Integração Gemini para insights customizados
- Seção "Insights AI" no dashboard
- Cache de insights no Supabase (não recalcular a cada visualização)

### v1.2 — Admin Panel
- Painel administrativo para gestão de usuários
- Aprovação de solicitações de acesso
- Navegação "como usuário" para admin
- Reset de senha, desativação de contas

### v1.3 — Histórico e Export
- Tab "Histórico" funcional com lista de backtests salvos
- Filtros por data, prospect, status
- PDF gerado automaticamente (server-side)
- Tab "Configurações" com parâmetros de parsing

### v2.0 — Sales Hub completo
- Cards 01 (Perfil Individual) e 02 (Múltiplos Perfis/ATO) funcionais
- Módulo "Demonstrations" no menu principal
- Módulo "Guides" com materiais de apoio
- Comparação entre múltiplos backtests do mesmo prospect

### v3.0 — Integração e Benchmark
- Integração direta com pipeline de backtest (sem upload manual)
- Dashboard pós-integração (backtest vs. produção real)
- Benchmark entre prospects por segmento
- Integração com módulo de Estratégias para criação de regras a partir dos achados
