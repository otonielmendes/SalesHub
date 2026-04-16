# PRD — Demos > Device Fingerprinting
**Koin Sales HUB · Feature Branch: `feature/demos-fingerprinting`**
**Data:** 2026-04-15 · **Status:** Implementado em feature branch (validação visual em curso; plano de produção definido)

---

## 1. Contexto e Objectivo

O Koin Sales HUB é uma ferramenta interna para vendedores da Koin demonstrarem capacidades de antifraude a prospects. Esta feature adiciona um módulo de **Device Fingerprinting interactivo**: o vendedor gera um link único, envia ao cliente, e assim que o cliente abre o link o browser captura automaticamente sinais do dispositivo — os dados aparecem em tempo real no painel do vendedor.

**Proposta de valor:**
- Demonstra ao prospect que a Koin consegue identificar o dispositivo mesmo sem login, cookies de terceiros ou instalação de SDK.
- Gera dados reais do próprio dispositivo do prospect como artefacto da reunião comercial.
- Diferencia a Koin de competidores que apenas mostram demos genéricas.

**Referência de inspiração:** `starlit-nougat-4673c1.netlify.app` e engenharia reversa do `track.html` da Koin (`/risk/fingerprint/v1/sessions`).

---

## 2. Fluxo de Utilizador

```
Vendedor                             Cliente
────────                             ───────
1. Acede a /demos/device-fingerprinting/nova
2. Escreve nome da captura/prospect (opcional)
3. Escolhe canal de partilha: WhatsApp, Email, QR code ou Copiar link
4. Preenche destinatário quando o canal exigir (telefone/email)
5. Clica "Gerar link"
6. Recebe modal/ação pronta para envio e mantém as opções disponíveis na sessão
7. Aguarda em /demos/device-fingerprinting/{id}
   (spinner "Aguardando o cliente…")
                                     8. Abre /demo/{token}
                                     9. Browser executa colecta automática
                                        (canvas hash, GPU, CPU bench, etc.)
                                    10. POST /api/demo/capture
                                    11. Vê confirmação + dados capturados
8. Painel atualiza via Supabase Realtime/polling fallback
9. Vendedor vê tabs Dados + Insights
```

**Decisão de navegação:** todos os módulos principais devem abrir primeiro em **Nova análise**. Histórico fica como submenu secundário. Para Fingerprinting, o menu superior aponta para `/demos/device-fingerprinting/nova`; o histórico fica em `/demos/device-fingerprinting/historico`.

---

## 3. Arquitectura

### 3.1 Rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/demos/device-fingerprinting/historico` | Server + Client | Lista de sessões do vendedor |
| `/demos/device-fingerprinting/nova` | Client | Formulário de geração de link |
| `/demos/device-fingerprinting/[id]` | Server + Client | Detalhe da sessão (tabs Dados/Insights) |
| `/demo/[token]` | Client (isolado) | Página pública enviada ao cliente |
| `POST /api/demo/capture` | API Route | Recebe sinais, gera insights, persiste |

A rota `/demo/[token]` vive em `src/app/demo/` com layout isolado (sem header do Sales HUB) para não expor UI interna ao prospect.

### 3.2 Base de Dados (Supabase)

**Tabela `demo_sessions`:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid PK | Identificador interno |
| `user_id` | uuid FK | Vendedor dono da sessão |
| `created_at` | timestamptz | Data de criação |
| `expires_at` | timestamptz | Expiração (24h após criação) |
| `status` | enum | `pending \| captured \| expired` |
| `prospect_name` | text nullable | Nome do prospect (opcional) |
| `share_token` | uuid unique | Token do link público |
| `signals_json` | jsonb | Sinais brutos capturados |
| `insights_json` | jsonb | Score + análise gerada pelo servidor |

**RLS (Row Level Security):**
- Vendedor: SELECT/INSERT/UPDATE nas suas próprias sessões (`user_id = auth.uid()`)
- Admin: SELECT em todas via `public.is_sales_hub_admin()`
- Público: não faz SELECT direto com anon key; `/demo/[token]` envia o token para `POST /api/demo/capture`, que valida `share_token` no servidor
- Service Role: SELECT/UPDATE para validar token e escrever `signals_json`/`insights_json` na capture route

**Realtime:** activo em `demo_sessions` para que o painel do vendedor actualize automaticamente quando o cliente captura. A UI também mantém polling leve de 3s como fallback.

**Expiração automática:** responsabilidade do Supabase via `pg_cron`. A função `public.expire_demo_sessions()` roda a cada 15 minutos, dentro do Postgres, e marca como `expired` apenas sessões `pending` cujo `expires_at` já passou. Esta opção evita endpoint HTTP público e reduz o uso de service role fora do banco.

**Migration:** [`../supabase/migrations/20260415113000_demos_device_fingerprinting.sql`](../supabase/migrations/20260415113000_demos_device_fingerprinting.sql) é a migration versionada para `supabase db push`. [`docs/supabase-demo-sessions.sql`](supabase-demo-sessions.sql) mantém a versão isolada de referência, e o setup completo também inclui a tabela em [`docs/supabase-setup.sql`](supabase-setup.sql).

### 3.3 Geração de links e papel da Vercel

A geração de links é responsabilidade da aplicação + Supabase, não de um serviço de short link da Vercel.

**Fluxo atual:**
1. O vendedor autenticado cria a sessão em `/demos/device-fingerprinting/nova`.
2. O client insere em `demo_sessions` usando a anon key e RLS (`user_id = auth.uid()`).
3. O banco gera `share_token` (`gen_random_uuid()`) e `expires_at` (`now() + interval '24 hours'`) por default.
4. A tela monta o link público com `window.location.origin + "/demo/" + share_token`.
5. Em preview, o link nasce com o domínio do deployment da Vercel; em produção, nasce com o domínio de produção/custom domain.
6. A página pública `/demo/[token]` envia o token para `POST /api/demo/capture`; o servidor valida `share_token`, expiração e idempotência.

**Canais suportados no fluxo de criação:**
- **WhatsApp:** pede telefone e abre `wa.me` com mensagem pronta.
- **Email:** pede destinatário e abre compose do Gmail com assunto/corpo prontos.
- **QR code:** gera QR no client com o pacote `qrcode`.
- **Copiar link:** gera e copia o link direto.

**Decisão:** não usar Vercel para encurtar ou persistir links. A Vercel entra como plataforma de hosting, preview, produção, domínio e rollback. Se no futuro quisermos domínio curto/branded link, a opção segura é criar um domínio dedicado apontando para a mesma app ou uma rota curta (`/d/[token]`) que faça rewrite/redirect para `/demo/[token]`.

---

## 4. Script de Captura (`src/lib/fingerprint/collect.ts`)

Portado verbatim do `track.html` da Koin. Captura exactamente os mesmos sinais enviados para `/risk/fingerprint/v1/sessions`.

### 4.1 Sinais capturados (47 no total)

| Categoria | Sinais |
|-----------|--------|
| **Identificadores** | `sessionId` (cookie 24h), `deviceId` (cookie 1 ano), `capturedAt` |
| **Agente & SO** | `userAgent`, `os`, `osVersion`, `platform`, `lang`, `timezone` (UTC offset), `timezoneName` (IANA, ex. `America/Sao_Paulo`), `browsingUrl` |
| **Contexto geográfico estimado** | `requestGeo.country`, `requestGeo.region`, `requestGeo.city`, `requestGeo.timezone`, `requestGeo.latitude`, `requestGeo.longitude`, `requestGeo.source`, `requestGeo.precision` quando a request roda na Vercel. Não gravar IP bruto por padrão. |
| **Ecrã** | `width`, `height`, `availWidth`, `availHeight`, `availLeft`, `availTop`, `colorDepth`, `orientation`, `devicePixelRatio` |
| **Canvas & GPU** | `canvasId` (SHA-256 do `canvas.toDataURL` — null se bloqueado), `gpuVendor`, `gpuName` (WebGL `UNMASKED_VENDOR/RENDERER` — null se headless) |
| **CPU & Memória** | `cores` (`hardwareConcurrency`), `deviceMemory`, `cpuSpeed.average` (ops/ms, IQR-filtered 40 iterações), `cpuSpeed.time` (ms), `cpuSpeed.version` |
| **Storage** | `localStorage`, `sessionStorage`, `indexedDB`, `cookiesEnabled` |
| **Flags & Privacidade** | `doNotTrack`, `privateBrowsing` (heurística por browser: quota/SW/indexedDB), `javaEnabled`, `javaScriptEnabled`, `acceptContent` |
| **Plugins** | CSV com nome, descrição e MIME types de cada plugin instalado |

**Detalhe: detecção de modo incógnito por browser:**
- Chrome/Opera/Edge: `navigator.storage.estimate().quota < jsHeapSizeLimit`
- Firefox: `navigator.serviceWorker === undefined`
- Safari: `null` (indeterminável)
- IE: `window.indexedDB === undefined`

---

## 5. API de Captura (`POST /api/demo/capture`)

### 5.1 Request

```json
{
  "token": "<share_token>",
  "signals": { ...DeviceSignals }
}
```

### 5.2 Lógica

1. Valida corpo e token.
2. Busca sessão por `share_token`.
3. Se `status === "captured"` → devolve `{ ok: true, already: true }` (idempotente).
4. Se `expires_at < now` → marca `expired`, devolve 410.
5. Enriquece `signals` com `requestGeo` a partir dos headers da Vercel, quando disponíveis.
6. Chama `generateInsights(enrichedSignals)` → produz `DeviceInsights` com 5 verdict cards.
7. Persiste `signals_json` + `insights_json`, status → `"captured"`.

### 5.3 Função `generateInsights`

Produz um score de 0–100 e 5 verdict cards a partir do cruzamento de sinais.

**Modelo de scoring:**

| Categoria | Peso máx | Sinais e pontuação |
|-----------|----------|--------------------|
| Fingerprint Único | 28 pts | `canvasId` presente (+18) · GPU vendor/name presentes (+10) |
| Hardware Coerente | 25 pts | `cores > 2` (+8) · `deviceMemory > 2` (+7) · GPU+OS consistentes (+10) |
| Sessão Normal | 22 pts | `privateBrowsing = false` (+10) · storages activos (+8) · plugins > 0 (+4) |
| Sem Anti-fingerprinting | 15 pts | `canvasId` não-null (+8) · `doNotTrack = false` (+4) · WebGL activo (+3) |
| Contexto Geográfico | 10 pts | contexto disponível (`lang`, `timezoneName` ou `requestGeo`) (+5) · coerência entre idioma, fuso e país estimado (+5) |

**Níveis de risco:**
- ≥ 70 → `low` (verde) — "Baixo risco"
- 40–69 → `medium` (âmbar) — "Risco médio"
- < 40 → `high` (vermelho) — "Alto risco"

**Heurística `timezoneMatchesLang`:**

| Idioma | Fuso esperado |
|--------|--------------|
| `pt`, `es`, `es-419` | UTC-5 a UTC-2 (América Latina) |
| `en-GB`, `fr`, `de`, `es-ES` | UTC0 a UTC+2 (Europa Ocidental) |
| `en`, `en-US`, `en-CA` | UTC-8 a UTC-4 (América do Norte) |
| `zh`, `ja`, `ko` | UTC+5 a UTC+13 (Ásia/Pacífico) |

---

## 6. UI — Painel do Vendedor

### 6.1 Histórico (`DemoHistoricoTable`)

- Segue o mesmo padrão visual das tabelas de Backtests (Untitled UI).
- `TableCard.Root` + `TableCard.Header` com badge de contagem.
- `DataTableToolbar` com pesquisa por nome + filtro por estado (Todos / Capturado / Aguardando / Expirado).
- Colunas: Prospect · Estado · Criado em · Expira em · Acção (RowActionButton com ícone SearchLg).
- Paginação `PaginationCardMinimal` (10 por página).
- `EmptyState` com botão de atalho para criar nova sessão.

### 6.2 Detalhe da Sessão (`DemoDetailClient`)

**Estado "Aguardando":**
- Spinner animado + mensagem contextual.
- Badge "Aguardando permissões" com pulso e contagem decrescente de minutos restantes.
- Link de partilha copiável.
- Actualiza em tempo real via Supabase Realtime (channel `demo_<id>`).

**Estado "Capturado" — Tab Dados:**

7 secções em `SectionTable` (header com contagem de campos + tbody label/valor):

1. **Identificadores** — sessionId, deviceId, capturedAt
2. **Agente & SO** — userAgent, OS, platform, lang, timezone, browsingUrl
3. **Ecrã** — resolução, disponível, colorDepth, devicePixelRatio, orientação
4. **Canvas & GPU** — canvasHash (SHA-256, truncado 24 chars), gpuVendor, gpuName
5. **CPU & Memória** — cores, deviceMemory, cpuSpeed avg + latência, benchmark version
6. **Storage & Flags** — cookies, localStorage, sessionStorage, indexedDB, doNotTrack, privateBrowsing, javaEnabled, javaScriptEnabled, acceptContent
7. **Plugins & Extensões** — lista ou badge "Nenhuma detectada"

Booleanos usam `BoolBadge` (Untitled UI `Badge` — verde Activo / vermelho Bloqueado / cinza null).

**Estado "Capturado" — Tab Insights:**

- **Score ring** — SVG animado (stroke-dasharray), valor central 0–100, badge de nível colorido.
- **Mini breakdown** — 5 barras horizontais com `X/Y pts` por categoria.
- **Sumário** — frase gerada pelo servidor com base no nível.
- **5 Verdict Cards** (`VerdictCardUI`):
  - Header colorido: verde (`success-50`) / âmbar (`warning-50`) / cinza para confirmed/alert/inconclusive.
  - Badge do veredito (Untitled UI `Badge`).
  - Pontuação parcial `scoreGained/scoreMax pts`.
  - Explicação 1–2 linhas gerada dinamicamente pelo servidor.
  - Barra de score animada (1px, 700ms transition).
  - Tabela de evidências com ícones SVG inline: ✓ verde (ok) / ⚠ âmbar (alert) / — cinza (neutral).
- **Fallback para sessões antigas:** se `verdictCards` estiver ausente (schema legacy), mostra mensagem neutra pedindo para criar nova sessão.

**Decisões visuais recentes:**
- A tab bar deve seguir o mesmo padrão de Backtests: segmented control compacto, `button-border`, `size="md"`, largura natural e labels em sentence case (`Dados`, `Insights`).
- Evitar labels em caixa alta em navegação (`DADOS`, `INSIGHTS`), salvo headings técnicos ou tabelas onde o padrão já seja uppercase.
- Ícones novos devem vir de `@untitledui/icons` quando houver equivalente.
- Cards laterais de progresso devem usar ícone circular de 48px, título `text-sm`, descrição `text-sm`, badge `text-xs` e barra de progresso horizontal.
- Border radius deve tender ao padrão Untitled/Apple: `rounded-lg` para inputs/botões/field boxes e `rounded-xl`/`rounded-2xl` apenas para cards maiores. Evitar radius arbitrário por tela.
- O gauge de scoring atual é SVG custom, não componente pronto Untitled UI. Deve ser revisado antes do release final para ficar menos pesado: track cinza visível, stroke menor, remover badge duplicado e alinhar a escala de fonte com os cards de análise.

---

## 7. UI — Página Pública do Cliente (`/demo/[token]`)

Tema claro (`bg-[#F9FAFB]`), sem layout do Sales HUB.

**Estados:**

| Estado | UI |
|--------|----|
| `collecting` | Spinner + step text + badge "Live" |
| `sending` | Idem |
| `done` | Card verde success + "Análise concluída" + dados capturados |
| `already` | Card verde + "Dados já registados" + dados capturados |
| `expired` | Card vermelho + "Link expirado" |
| `error` | Card vermelho + botão "Recarregar" |

Após captura, mostra `CapturedData` com 5 DataCards:
1. Dispositivo & Browser (OS, platform, lang, timezone)
2. Ecrã (resolução, disponível, colorDepth, pixelRatio)
3. Hardware (CPU cores, memória, GPU vendor/renderer, velocidade CPU)
4. Privacidade & Storage (modo incógnito, DNT, cookies, localStorage, indexedDB, canvas hash)
5. Extensões (se houver plugins detectados)

---

## 8. Tipos TypeScript (`src/types/demos.ts`)

```typescript
// Novos (versão actual)
type EvidenceStatus = "ok" | "alert" | "neutral";
type VerdictStatus = "confirmed" | "alert" | "inconclusive";

interface EvidenceItem {
  label: string;
  value: string;
  status: EvidenceStatus;
}

interface VerdictCard {
  id: string;
  title: string;
  verdict: VerdictStatus;
  verdictLabel: string;
  explanation: string;
  scoreGained: number;
  scoreMax: number;
  evidence: EvidenceItem[];
}

interface DeviceInsights {
  riskScore: number;           // 0–100
  riskLevel: InsightSeverity;  // "low" | "medium" | "high"
  summary: string;
  capturedAt: string;
  verdictCards: VerdictCard[];
}
```

Tipos legacy (`ThreatVector`, `ScoreDimension`, `SessionIdentifier`, `SignalQuadrant`, `InsightItem`) mantidos em `demos.ts` para compatibilidade com sessões antigas.

---

## 9. Ficheiros Criados / Modificados

| Ficheiro | Estado | Descrição |
|----------|--------|-----------|
| `src/types/demos.ts` | Modificado | + EvidenceItem, VerdictCard, VerdictStatus, EvidenceStatus; DeviceInsights actualizado |
| `src/app/api/demo/capture/route.ts` | Reescrito | generateInsights() com 5 verdict cards e modelo de scoring |
| `src/app/demo/[token]/page.tsx` | Reescrito | Tema claro, CapturedData após captura |
| `src/app/demos/device-fingerprinting/_components/DemoDetailClient.tsx` | Reescrito | DadosTab (7 secções) + InsightsTab (score ring + verdict cards) |
| `src/app/demos/device-fingerprinting/_components/DemoHistoricoTable.tsx` | Reescrito | Padrão Untitled UI (TableCard + DataTableToolbar + PaginationCardMinimal) |
| `src/app/demos/device-fingerprinting/_components/DemoHistoricoHeaderActions.tsx` | Criado | Wrapper "use client" para Button com iconLeading={Plus} |
| `src/app/demos/device-fingerprinting/historico/page.tsx` | Modificado | Usa DemoHistoricoHeaderActions; empty state movido para dentro da table |
| `src/app/demos/device-fingerprinting/nova/page.tsx` | Reescrito | Fluxo guiado de geração de link com seleção de canal, modais WhatsApp/Email/QR e sidecar de etapas |
| `src/lib/fingerprint/collect.ts` | Criado | Script de captura portado verbatim do track.html da Koin |

---

## 10. Decisões Técnicas

| Decisão | Motivo |
|---------|--------|
| Wrapper `DemoHistoricoHeaderActions` como "use client" | Server Components não podem passar funções (como `iconLeading={Plus}`) como props a Client Components no Next.js App Router |
| Insights gerados no servidor (API route) | Evita exposição da lógica de scoring ao cliente; permite re-computar retroactivamente |
| Fallback `verdictCards ?? []` | Sessões capturadas antes do redesign não têm o novo schema — guard defensivo evita TypeError |
| `share_token` como UUID separado do `id` | O ID interno não deve ser exposto na URL pública; token pode ser invalidado sem apagar a sessão |
| Service Role Key na capture route | A página pública não tem sessão de utilizador — usa service key para escrever no Supabase |
| Layout isolado em `src/app/demo/layout.tsx` | O prospect não deve ver o header, nav ou qualquer UI interna do Sales HUB |
| Link montado com `window.location.origin` | O mesmo código funciona em localhost, preview e produção; em produção o link usa automaticamente o domínio Vercel/custom domain ativo |
| Vercel não persiste nem encurta links | Evita dependência desnecessária; a verdade do link é o `share_token` em Supabase |
| Canal escolhido antes de gerar link | Reduz o fluxo em duas telas e permite abrir WhatsApp/Gmail/QR imediatamente após criar a sessão |
| Opções de partilha continuam disponíveis após gerar | O vendedor pode fechar o modal e reenviar pelo mesmo link/canal sem recriar sessão |
| Primeiro submenu deve ser "Nova análise" | Backtests, Calculadora e Fingerprinting devem abrir no fluxo de criação/análise, não no histórico |
| Nomenclatura unificada | Usar "Fingerprinting", "Nova análise", "Historial/Histórico" conforme locale; evitar "Demos" como menu principal desta feature |
| Padrão visual Untitled UI como norte | Usar primitives existentes (`Button`, `Badge`, `Tabs`, tabelas) e ícones `@untitledui/icons`; reduzir CSS/Tailwind ad hoc em novas telas |
| Testes de vulnerabilidade entram no checklist | Antes de produção, rodar audit, validar RLS, idempotência do token, expiração e ausência de acesso público direto à tabela |

---

## 11. Pendentes, geração de links e plano de produção

### 11.1 Já concluído
- [x] **Teste visual com captura real** — sessão `Teste Visual Codex` capturada em browser separado; Supabase confirmou `status = captured`, `signals_json`, `insights_json`, 5 `verdictCards`, `riskScore = 74`, `riskLevel = low`. Screenshots locais: `/tmp/koin-demo-seller-pending.png`, `/tmp/koin-demo-public-captured.png`, `/tmp/koin-demo-seller-after.png`.
- [x] **i18n** — textos principais das telas Demos e da página pública migrados para `messages/pt-BR.json`, `en.json`, `es.json`. Observação: textos persistidos em `insights_json` continuam no idioma gerado pela API da captura; reprocessamento por idioma fica como evolução separada.
- [x] **Validação da página pública** — `CapturedData` validado em viewport mobile 390×844 durante a captura real; layout renderizou os cards de sinais sem quebra visual bloqueante.
- [x] **Atualização simultânea do painel** — validada com `npm run qa:demos:realtime`: vendedor autenticado ficou em `/demos/device-fingerprinting/[id]`, cliente abriu `/demo/[token]`, captura persistiu e painel mudou para `Capturado`/`Insights` sem reload. A UI mantém Supabase Realtime e usa polling leve de 3s como fallback para ambientes onde o canal Realtime não entrega o evento.
- [x] **Expiração automática** — Supabase `pg_cron` + função `public.expire_demo_sessions()` para marcar `status = 'expired'` em sessões vencidas sem esperar acesso.
- [x] `npm run qa:demos:expiration` → passou; criou sessões temporárias e confirmou que apenas sessão `pending` vencida muda para `expired`.
- [x] `npm run qa:demos:realtime` → passou; `consoleErrors` e `requestFailures` vazios na última rodada.
- [x] `npm run qa:demos:security` → passou após hardening de RLS; anon key não lê `demo_sessions`, token expirado retorna 410, sessão capturada é idempotente e token inexistente retorna 404.
- [x] Schema/migration de `demo_sessions` documentado em `blueprint.md`, `docs/supabase-demo-sessions.sql` e `docs/supabase-setup.sql`.
- [x] Expiração automática documentada na migration via `pg_cron`.
- [x] `npm audit --audit-level=moderate` → passou com 0 vulnerabilidades.
- [x] `npm run lint` → passou.
- [x] `npx tsc --noEmit` → passou (zero erros).
- [x] `npm run build` → passou.

### 11.2 O que ainda falta antes de produção
- [ ] **Passada visual final no detalhe** — alinhar gauge de scoring e cards de Insights ao padrão Untitled/Calculadora; remover redundâncias visuais (ex. badge duplicado de risco).
- [ ] **Revisar componentes comuns** — tab bar, cards de análise, field boxes, badges e radius devem sair de classes avulsas para helpers/componentes compartilhados quando fizer sentido.
- [ ] **Teste end-to-end em preview Vercel** — criar uma sessão em preview autenticado, abrir `/demo/[token]` em outro browser/dispositivo, validar captura, Realtime/polling, Dados e Insights.
- [ ] **Teste de link por canal** — validar WhatsApp Web, Gmail compose, QR code e copiar link em desktop e mobile.
- [ ] **Checklist Supabase produção** — confirmar migration aplicada no projeto de produção, RLS, publication Realtime, `pg_cron` e job `expire-demo-sessions`.
- [ ] **Checklist Vercel produção** — confirmar env vars de Production e Preview: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e variáveis já usadas pelo Sales Hub.
- [x] **Teste de segurança mínimo** — validado com `npm run qa:demos:security`; migration `20260416012500_lock_demo_sessions_rls.sql` remove policies antigas e recria `demo_sessions` com `TO authenticated`.
- [ ] **Decidir escopo de rate limiting** — para MVP interno, UUID + expiração + idempotência reduzem risco; para exposição ampla, adicionar rate limit/WAF na Vercel ou camada server-side.
- [ ] **Exportação** — botão para download do relatório em PDF ou JSON a partir do detalhe (não bloqueia release inicial se o time aceitar).
- [ ] **Limite de sessões activas** — avaliar se faz sentido limitar a 1 sessão `pending` por vendedor simultaneamente (não bloqueia release inicial).

### 11.3 Plano de geração de links

**MVP de produção:**
- Gerar `share_token` no Supabase como UUID único.
- Link público: `https://<dominio-producao>/demo/<share_token>`.
- Validade: 24h por `expires_at`.
- Single-use lógico: se sessão já está `captured`, a API responde `{ ok: true, already: true }` e não recria dados.
- Canal de envio é apenas conveniência de UI; o link canônico é sempre o mesmo `/demo/[token]`.

**Vercel no fluxo de links:**
- Preview deployments geram links com domínio de preview. Estes links são apenas para QA.
- Produção deve usar `koinsaleshub.vercel.app` ou custom domain configurado na Vercel.
- Como o link usa `window.location.origin`, a troca para custom domain não exige mudança de código.
- Não usar `vercel.app` de preview em comunicação real com prospects.

**Evoluções possíveis:**
- Rota curta `/d/[token]` redirecionando para `/demo/[token]`.
- Custom domain específico, por exemplo `fingerprinting.<dominio-koin>`.
- Envio real de email via Resend/Vercel Email em vez de abrir Gmail compose.
- Registro do canal usado (`share_channel`, `recipient_hint`) em `demo_sessions` para auditoria comercial, sem guardar dados sensíveis desnecessários.

### 11.4 Plano seguro de subida para produção

**Estratégia recomendada:** usar Preview Deployment validado + merge para `main`/produção. Evitar `vercel deploy --prod` direto da feature branch sem QA final.

1. **Congelar branch**
   - Garantir `git status` limpo.
   - Rodar `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm audit --audit-level=moderate`.

2. **Preparar Supabase produção**
   - Aplicar migration `supabase/migrations/20260415113000_demos_device_fingerprinting.sql` no projeto Supabase de produção.
   - Confirmar `demo_sessions`, policies RLS, índices, Realtime e `pg_cron`.
   - Confirmar que `public.expire_demo_sessions()` existe e que `cron.job` tem `expire-demo-sessions`.
   - Rodar `npm run qa:demos:expiration` no ambiente apontado para produção/preview controlado para validar a regra de expiração antes do smoke test final.
   - Rodar `npm run qa:demos:security` depois de aplicar a migration de RLS para confirmar que anon key não lê `demo_sessions`.

3. **Preparar Vercel**
   - Confirmar Project ID `prj_RG9lGQzqlKipo1lnSJQE2aysj4Mf` e Team ID `team_eAmhTwXAd9aBqPVHdlftedXj`.
   - Confirmar env vars de Production no dashboard Vercel.
   - Confirmar Production Branch (`main`) e domínio de produção.

4. **Validar preview**
   - Push da feature branch gera Preview Deployment.
   - Abrir preview autenticado.
   - Criar sessão real de fingerprinting.
   - Abrir `/demo/[token]` em outro browser/dispositivo.
   - Validar: captura, persistência no Supabase, atualização no detalhe, Dados, Insights, expiração e canais de partilha.

5. **Merge controlado**
   - Abrir PR `feature/demos-fingerprinting` → `main`.
   - Revisar diff de DB/env/UI.
   - Fazer merge apenas depois da validação do preview.

6. **Deploy produção**
   - Preferência: Git integration da Vercel dispara produção ao merge em `main`.
   - Alternativa CLI: `vercel pull --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`.
   - Alternativa rápida se o preview validado for exatamente o artefato desejado: `vercel promote <preview-url-or-id>`.

7. **Smoke test pós-deploy**
   - Login em produção.
   - Criar uma captura com nome claro, ex. `Smoke Fingerprinting Produção`.
   - Abrir link em outro browser.
   - Confirmar `status = captured`, 47 sinais, `verdictCards`, tabs Dados/Insights e histórico.
   - Confirmar que link vencido ou sessão capturada não permite reescrita inesperada.

8. **Rollback**
   - Se falhar apenas UI/app: usar `vercel rollback` ou promover deployment anterior.
   - Se falhar DB: manter migration idempotente; evitar rollback destrutivo. Desativar menu/feature por código se necessário.

---

## 12. Inferências de Sinais (referência rápida)

| Sinal capturado | O que indica |
|-----------------|-------------|
| `canvasId = null` | Canvas bloqueado → extensão anti-fingerprint ou headless |
| `gpuVendor/gpuName = null` | WebGL ausente → headless sem GPU ou privacy mode |
| `gpuVendor = "Apple"` + platform não Mac | VM ou user-agent spoofing |
| `cores = null` ou `cores = 1` | Headless default ou API desactivada |
| `devicePixelRatio = 1.0` | Monitor básico ou Puppeteer (default 1) |
| `privateBrowsing = true` | Incógnito confirmado |
| `privateBrowsing = null` | Firefox ou mobile — indeterminável |
| `plugins = ""` | 0 extensões → headless ou browser muito limpo |
| `doNotTrack = true` | Preferência de privacidade declarada |
| `lang + timezone` divergentes | VPN ou proxy provável |
| `lang + timezone + requestGeo` divergentes | VPN, proxy, viagem, rede corporativa ou configuração regional diferente |
| `cpuSpeed` baixo + `cores` alto | VM com CPU partilhada/limitada |

### 5.4 Limites de localização

O Device Fingerprinting **não determina endereço, bairro, rua ou CEP**. O máximo seguro sem consentimento explícito é um **contexto geográfico provável**:

- Browser: idioma, offset UTC e timezone IANA.
- Backend/Vercel: país, região e cidade estimados por headers da request.
- Precisão esperada: país/região com confiança variável; cidade apenas como estimativa.
- Coordenadas precisas só devem ser capturadas com `navigator.geolocation` e consentimento explícito do navegador.

Na UI e no score, usar sempre a nomenclatura **Contexto geográfico** ou **Geo estimada**, nunca “Endereço” para dados inferidos.
