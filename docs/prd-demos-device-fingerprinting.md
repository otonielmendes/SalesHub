# PRD — Demos > Device Fingerprinting
**Koin Sales HUB · Feature Branch: `feature/demos-fingerprinting`**
**Data:** 2026-04-15 · **Status:** Implementado (validação visual concluída; estabilização pré-release em curso)

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
2. Escreve nome do prospect (opcional)
3. Clica "Gerar link"
4. Copia link share → envia ao cliente
5. Aguarda em /demos/device-fingerprinting/{id}
   (spinner "Aguardando o cliente…")
                                     6. Abre /demo/{token}
                                     7. Browser executa colecta automática
                                        (canvas hash, GPU, CPU bench, etc.)
                                     8. POST /api/demo/capture
                                     9. Vê confirmação + dados capturados
8. Painel atualiza via Supabase Realtime
9. Vendedor vê tabs DADOS + INSIGHTS
```

---

## 3. Arquitectura

### 3.1 Rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/demos/device-fingerprinting/historico` | Server + Client | Lista de sessões do vendedor |
| `/demos/device-fingerprinting/nova` | Client | Formulário de geração de link |
| `/demos/device-fingerprinting/[id]` | Server + Client | Detalhe da sessão (tabs DADOS/INSIGHTS) |
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

---

## 4. Script de Captura (`src/lib/fingerprint/collect.ts`)

Portado verbatim do `track.html` da Koin. Captura exactamente os mesmos sinais enviados para `/risk/fingerprint/v1/sessions`.

### 4.1 Sinais capturados (47 no total)

| Categoria | Sinais |
|-----------|--------|
| **Identificadores** | `sessionId` (cookie 24h), `deviceId` (cookie 1 ano), `capturedAt` |
| **Agente & SO** | `userAgent`, `os`, `osVersion`, `platform`, `lang`, `timezone` (UTC offset), `browsingUrl` |
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
5. Chama `generateInsights(signals)` → produz `DeviceInsights` com 5 verdict cards.
6. Persiste `signals_json` + `insights_json`, status → `"captured"`.

### 5.3 Função `generateInsights`

Produz um score de 0–100 e 5 verdict cards a partir do cruzamento de sinais.

**Modelo de scoring:**

| Categoria | Peso máx | Sinais e pontuação |
|-----------|----------|--------------------|
| Fingerprint Único | 28 pts | `canvasId` presente (+18) · GPU vendor/name presentes (+10) |
| Hardware Coerente | 25 pts | `cores > 2` (+8) · `deviceMemory > 2` (+7) · GPU+OS consistentes (+10) |
| Sessão Normal | 22 pts | `privateBrowsing = false` (+10) · storages activos (+8) · plugins > 0 (+4) |
| Sem Anti-fingerprinting | 15 pts | `canvasId` não-null (+8) · `doNotTrack = false` (+4) · WebGL activo (+3) |
| Contexto Geográfico | 10 pts | `lang` presente (+5) · timezone coerente com lang (+5) |

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

**Estado "Capturado" — Tab DADOS:**

7 secções em `SectionTable` (header com contagem de campos + tbody label/valor):

1. **Identificadores** — sessionId, deviceId, capturedAt
2. **Agente & SO** — userAgent, OS, platform, lang, timezone, browsingUrl
3. **Ecrã** — resolução, disponível, colorDepth, devicePixelRatio, orientação
4. **Canvas & GPU** — canvasHash (SHA-256, truncado 24 chars), gpuVendor, gpuName
5. **CPU & Memória** — cores, deviceMemory, cpuSpeed avg + latência, benchmark version
6. **Storage & Flags** — cookies, localStorage, sessionStorage, indexedDB, doNotTrack, privateBrowsing, javaEnabled, javaScriptEnabled, acceptContent
7. **Plugins & Extensões** — lista ou badge "Nenhuma detectada"

Booleanos usam `BoolBadge` (Untitled UI `Badge` — verde Activo / vermelho Bloqueado / cinza null).

**Estado "Capturado" — Tab INSIGHTS:**

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

---

## 11. Pendentes / Próximos Passos

### Imediatos
- [x] **Teste visual com captura real** — sessão `Teste Visual Codex` capturada em browser separado; Supabase confirmou `status = captured`, `signals_json`, `insights_json`, 5 `verdictCards`, `riskScore = 74`, `riskLevel = low`. Screenshots locais: `/tmp/koin-demo-seller-pending.png`, `/tmp/koin-demo-public-captured.png`, `/tmp/koin-demo-seller-after.png`.
- [x] **i18n** — textos principais das telas Demos e da página pública migrados para `messages/pt-BR.json`, `en.json`, `es.json`. Observação: textos persistidos em `insights_json` continuam no idioma gerado pela API da captura; reprocessamento por idioma fica como evolução separada.
- [x] **Validação da página pública** — `CapturedData` validado em viewport mobile 390×844 durante a captura real; layout renderizou os cards de sinais sem quebra visual bloqueante.
- [x] **Atualização simultânea do painel** — validada com `npm run qa:demos:realtime`: vendedor autenticado ficou em `/demos/device-fingerprinting/[id]`, cliente abriu `/demo/[token]`, captura persistiu e painel mudou para `Capturado`/`INSIGHTS` sem reload. A UI mantém Supabase Realtime e usa polling leve de 3s como fallback para ambientes onde o canal Realtime não entrega o evento.

### Melhorias
- [x] **Expiração automática** — Supabase `pg_cron` + função `public.expire_demo_sessions()` para marcar `status = 'expired'` em sessões vencidas sem esperar acesso.
- [ ] **Exportação** — Botão para download do relatório em PDF ou JSON a partir do detalhe.
- [ ] **Limite de sessões activas** — Avaliar se faz sentido limitar a 1 sessão `pending` por vendedor simultaneamente.

### Release
- [x] `npm run qa:demos:realtime` → passou; `consoleErrors` e `requestFailures` vazios na última rodada.
- [x] Schema/migration de `demo_sessions` documentado em `blueprint.md`, `docs/supabase-demo-sessions.sql` e `docs/supabase-setup.sql`.
- [x] Expiração automática documentada na migration via `pg_cron`.
- [x] `npm audit --audit-level=moderate` → passou com 0 vulnerabilidades.
- [x] `npm run lint` → passou.
- [ ] `npx tsc --noEmit` → ✅ já passou (zero erros).
- [x] `npm run build` → passou.
- [ ] Merge `feature/demos-fingerprinting` → `main`.
- [ ] Deploy via `npx vercel deploy --prod --yes`.

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
| `cpuSpeed` baixo + `cores` alto | VM com CPU partilhada/limitada |
