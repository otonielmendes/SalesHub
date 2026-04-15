# Progress — Koin Sales Hub

> Log de execução. Registar aqui o que foi feito, erros encontrados e resultados.
> Atualizar após **cada sessão de trabalho**.
> Formato: `## YYYY-MM-DD — [Fase] Descrição`

---

## 2026-04-15 — [S/T] Demos Device Fingerprinting — validação visual e estabilização pré-release

**O que foi feito:**
- `docs/prd-demos-device-fingerprinting.md` usado como PRD específico da feature; status atualizado para refletir validação visual concluída.
- Teste real criado com sessão `Teste Visual Codex`: vendedor em `/demos/device-fingerprinting/[id]`, cliente em `/demo/[token]`, captura automática e persistência no Supabase.
- Banco confirmou `status=captured`, `signals_json`, `insights_json`, 5 `verdictCards`, `riskScore=74`, `riskLevel=low`.
- Screenshots locais geradas: `/tmp/koin-demo-seller-pending.png`, `/tmp/koin-demo-public-captured.png`, `/tmp/koin-demo-seller-after.png`.
- `src/proxy.ts` passa a proteger `/demos/*` como rota interna autenticada; `/demo/[token]` permanece pública.
- Correções de lint aplicadas em `DemoDetailClient`, `DemoHistoricoTable` e `collect.ts`.
- `scripts/qa-demo-realtime.mjs` + `npm run qa:demos:realtime` adicionados para validar o fluxo autenticado com vendedor e cliente em browsers simultâneos.
- `DemoDetailClient` mantém Supabase Realtime e ganhou polling leve de 3s enquanto a sessão está pendente, garantindo atualização live mesmo se o canal Realtime não entregar o evento.

**Pendências:**
- Migrar strings hardcoded da feature Demos para i18n.
- Formalizar expiração automática de sessões vencidas.

**Testes executados:**
- `npm run lint` → ✅ passou.
- `npm run build` → ✅ passou.
- Smoke HTTP local: `/demos/device-fingerprinting/nova` sem sessão → ✅ `307 /login`; `/demo/[token]` → ✅ `200`.
- `npm run qa:demos:realtime` → ✅ passou; confirmou `status=captured`, `signals_json`, `insights_json`, 5 `verdictCards`, `riskScore=74`, `riskLevel=low`, painel do vendedor atualizado sem reload.

## 2026-04-15 — [S] Fingerprinting — fluxo único de nova análise

**O que foi feito:**
- `/demos/device-fingerprinting/nova` deixou de alternar entre formulário escuro e tela separada de link gerado.
- Nova tela usa um único card branco: configuração do prospect à esquerda e link de captura/compartilhamento à direita.
- Área do link aparece desativada antes de gerar e ativa no mesmo lugar após criar a sessão.
- Ações de WhatsApp, Email, Copiar link, Acompanhar captura e Nova análise ficam no mesmo fluxo, sem navegação intermediária.
- Textos de compartilhamento e labels de estado ajustados em `pt-BR`, `en` e `es`.
- Ajuste posterior removeu o grid lateral largo: o fluxo agora fica centralizado em `max-w-3xl`, com configuração, metadados, link e ações empilhados em uma única coluna.
- Ajuste visual final passou a seguir a heurística da Calculadora: cards de configuração/link à esquerda e rail sticky de status/CTA à direita no desktop, mantendo o rail oculto no mobile para evitar CTA duplicado.
- Iteração seguinte transformou a tela em fluxo guiado: identificação da captura, escolha prévia de canal (`WhatsApp`, `Email`, `QR Code`, `Copiar link`), campos condicionais para telefone/email, botão `Gerar link` dentro do step de compartilhamento e cards laterais de progresso.
- Após gerar o link, a sessão mantém todas as opções de compartilhamento disponíveis e abre modal específico para WhatsApp, Gmail ou QR; QR é gerado localmente com `qrcode`, sem serviço externo.

**Testes executados:**
- `npm audit --audit-level=moderate` → ✅ 0 vulnerabilidades.
- `npm run lint` → ✅ passou.
- `npm run build` → ✅ passou.
- `npm run qa:demos:realtime` → ✅ passou; confirmou captura real, Realtime/polling no vendedor, `riskScore=74`, 5 `verdictCards`, sem `consoleErrors`/`requestFailures`.
- Check visual Playwright da tela de nova análise → ✅ sessão criada em `pending`, link renderizado no mesmo card e screenshots salvas.
- Screenshots locais: `/tmp/koin-fp-new-flow-01-empty.png`, `/tmp/koin-fp-new-flow-02-ready.png`.
- Screenshots pós-ajuste de largura/grid: `/tmp/koin-fp-compact-01-empty.png`, `/tmp/koin-fp-compact-02-ready.png`.
- Check visual Playwright pós-heurística Calculadora → ✅ desktop em `formWidth=1216`, rail desktop visível, rail mobile oculto, um único CTA `Acompanhar captura`, sem overlay/console errors.
- Screenshots pós-heurística Calculadora: `/tmp/koin-fp-heuristic-desktop-after.png`, `/tmp/koin-fp-heuristic-mobile-after.png`.
- Check visual Playwright do wizard → ✅ desktop em `formWidth=1216`, steps laterais presentes, modal WhatsApp abrindo, QR local renderizado, sem error overlay.
- Check visual mobile do wizard → ✅ sem overflow horizontal (`bodyWidth=390`), QR local renderizado e headers ajustados para não esmagar o texto.
- Screenshots do wizard: `/tmp/koin-fp-wizard-empty.png`, `/tmp/koin-fp-wizard-whatsapp-modal.png`, `/tmp/koin-fp-wizard-ready.png`, `/tmp/koin-fp-wizard-qr-modal.png`, `/tmp/koin-fp-wizard-mobile-empty-after.png`.

## 2026-04-15 — [S] Navegação e radius — nomenclatura global

**O que foi feito:**
- Menus de Backtests, Calculadora e Fingerprinting alinhados para usar `Nova análise / New analysis / Nuevo análisis` no primeiro submenu.
- Textos antigos `Testagens / Tests / Pruebas` removidos da UI e mantidos apenas em caminhos/nomes técnicos legados.
- Radius da navegação principal, secondary nav e toolbar de tabelas normalizado para `rounded-lg` (8px) em controles interativos.
- `blueprint.md` passou a registrar a regra de border radius do produto: controles e tabs em 8px; cards/superfícies maiores em 12/16px; badges pequenas em 6px; elementos circulares como `rounded-full`.
- `docs/plano-de-testes.md` atualizado para refletir a nomenclatura nova.
- Links de produto no header padronizados para abrir Histórico em Backtests, Calculadora e Fingerprinting; redirects de `/`, login autenticado, não-admin e rotas base de Fingerprinting também passam a cair em Histórico.
- Corrigido matcher do submenu de Fingerprinting para `/nova` não selecionar `Histórico` ao mesmo tempo.

**Testes executados:**
- `npm audit --audit-level=moderate` → ✅ 0 vulnerabilidades.
- `npm run lint` → ✅ passou.
- `npm run build` → ✅ passou.
- Check visual Playwright com usuário QA e backtest temporário → ✅ busca, filtro e subnav em `8px`; `Nova análise` visível em Backtests/Calculadora/Fingerprinting; sem `consoleErrors`.
- Screenshots locais: `/tmp/koin-radius-backtests-table.png`, `/tmp/koin-radius-calculadora-nav.png`, `/tmp/koin-radius-fingerprinting-nav.png`.

## 2026-04-15 — [S/T] Demos Device Fingerprinting — i18n e gate de segurança

**O que foi feito:**
- Textos principais da feature Demos migrados para `messages/pt-BR.json`, `messages/en.json` e `messages/es.json`: criação de demo, histórico, detalhe, estado pendente e página pública `/demo/[token]`.
- `docs/prd-demos-device-fingerprinting.md` atualizado para marcar i18n como concluído no escopo de UI.
- `docs/plano-de-testes.md` ganhou seção “Segurança / Dependências”; `npm audit --audit-level=moderate` passa a ser gate de release, com vulnerabilidades `high`/`critical` em runtime bloqueando deploy salvo exceção explícita.
- `npm audit fix` aplicado; `next` e `eslint-config-next` atualizados para `16.2.3` para remover vulnerabilidade high em Next.js.

**Observações:**
- Textos persistidos dentro de `insights_json` continuam no idioma gerado pela API no momento da captura. Suporte a insights por idioma deve ser tratado como evolução separada, pois exige alterar contrato da captura ou reprocessar sessões.

**Testes executados:**
- `npm audit --audit-level=moderate` → ✅ 0 vulnerabilidades.
- `npm run lint` → ✅ passou.
- `npm run build` → ✅ passou.
- `npm run qa:demos:realtime` → ✅ passou; `consoleErrors` e `requestFailures` vazios após aguardar `networkidle` antes da navegação para o detalhe.

## 2026-04-15 — [T] Demos Device Fingerprinting — limpeza do ruído Supabase Auth no QA

**O que foi feito:**
- `src/components/backtest/KoinHeader.tsx` tornou o carregamento de usuário defensivo contra falhas transitórias de `supabase.auth.getUser()`.
- `scripts/qa-demo-realtime.mjs` passou a reportar `requestFailures` e aguardar `networkidle` após gerar o link da demo, evitando navegação enquanto `/auth/v1/user` ainda estava em voo.

**Resultado:**
- A causa do `TypeError: Failed to fetch` era `GET /auth/v1/user :: net::ERR_ABORTED` por navegação rápida no teste automatizado.
- `KoinHeader` passou a usar `getSession()` para leitura de display do usuário, evitando validação remota desnecessária no header.
- O QA agora aguarda `networkidle` após login e após geração do link, evitando abortar requests de perfil durante navegação rápida.
- Após estabilizar o teste, `npm run qa:demos:realtime` passou com `consoleErrors: []` e `requestFailures: []`.

## 2026-04-15 — [L/A] Demos Device Fingerprinting — schema Supabase oficial

**O que foi feito:**
- `docs/supabase-demo-sessions.sql` criado com tabela `demo_sessions`, RLS, índices, `REPLICA IDENTITY FULL` e publicação `supabase_realtime`.
- `supabase/migrations/20260415113000_demos_device_fingerprinting.sql` criado para aplicação via Supabase CLI (`supabase db push`).
- `docs/supabase-setup.sql` atualizado para incluir `demo_sessions` no setup idempotente completo.
- `blueprint.md` atualizado com schema, RLS e decisão de manter `/demo/[token]` sem SELECT anônimo direto; validação de token e gravação acontecem na API com service role.
- `docs/prd-demos-device-fingerprinting.md` alinhado à implementação real: admin select, service role na capture route e polling fallback.
- Expiração automática escolhida pela alternativa mais segura: `pg_cron` dentro do Supabase chamando `public.expire_demo_sessions()` a cada 15 minutos, sem criar endpoint HTTP público.

**Resultado:**
- Ambientes novos agora têm caminho documentado para reproduzir a feature Demos > Device Fingerprinting.
- Migration `20260415113000_demos_device_fingerprinting.sql` aplicada no Supabase remoto `kyicouglpzrirypxtrse` via `supabase db push`.
- Histórico de migrations local/remoto alinhado em `20260415113000`.

**Testes executados:**
- `npm audit --audit-level=moderate` → ✅ 0 vulnerabilidades.
- `npm run lint` → ✅ passou.
- `npm run build` → ✅ passou.
- `supabase db push --dry-run` → ✅ aplicaria apenas `20260415113000_demos_device_fingerprinting.sql`.
- `supabase db push` → ✅ migration aplicada no remoto.
- `supabase db lint --linked --schema public,cron --fail-on error` → ✅ sem erros de schema.
- RPC remota `public.expire_demo_sessions()` via service role → ✅ executou com `expiredCount = 0`.
- `npm run qa:demos:realtime` → ✅ passou; confirmou captura, `verdictCards`, atualização live do vendedor e ausência de `consoleErrors`/`requestFailures`.

## 2026-04-15 — [S] Demos Device Fingerprinting — rodada visual pré-release

**O que foi feito:**
- Página pública `/demo/[token]` redesenhada para abrir com confirmação clara e resumo dos principais sinais antes da lista técnica completa.
- Tela `/demos/device-fingerprinting/nova` melhorada no estado de link gerado: cabeçalho mais claro, ações de compartilhamento em grid e área de link mais legível.
- Detalhe do vendedor ganhou um header de score mais forte em `INSIGHTS`, com contraste maior e cards de evidência menos genéricos.
- Rodada adicional alinhou Demos ao vocabulário visual já usado em Backtests/Calculadora: `Button` e `Tabs` do Untitled UI, cards brancos com borda/ring leves e ações primárias em preto/verde.
- Ajuste visual pós-review: o card de link gerado passou a seguir a composição das demais features, com título central, ações de WhatsApp/Email/Copiar antes do link, link em faixa própria, metadados de validade/uso/canais e CTA para acompanhar captura.
- Detalhe do vendedor foi aproximado dos cards de Calculadora/Backtests: header único com tags, ações e métricas; tab bar `button-border`; aba `DADOS` em cards compactos; `INSIGHTS` com resumo claro e composição de score em card branco.
- Cards de verdict passaram a mostrar evidências como caixas individuais com ícone `i` e tooltip, em vez de uma tabela plana.
- Rodada com nova referência visual de análise individual: `INSIGHTS` passou a usar coluna lateral de scoring/insights gerais e seções empilhadas à direita; `DADOS` passou a renderizar grupos como seções com campos em caixas e ícone `i`, aproximando a feature do layout de perfil individual.
- Navegação ajustada para posicionar a feature como produto `Fingerprinting` em vez de `Demos`, com submenus `Nova análise` e `Histórico`; `/demos` e `/demos/device-fingerprinting` redirecionam para nova análise.
- Página pública pós-captura ajustada para corrigir grid estreito: conteúdo passou de `max-w-lg` para `max-w-4xl`, resumo usa até 4 colunas responsivas e seções técnicas usam caixas de campo em vez de linhas/tabelas comprimidas.
- Página pública do cliente alinhada à aba `DADOS` do vendedor: usa `max-w-container` e renderiza as mesmas seções/agrupamentos de dados capturados, sem resumo intermediário diferente.

**Testes executados:**
- `npm run lint` → ✅ passou.
- `npm run build` → ✅ passou.
- Screenshots locais geradas para comparação: `/tmp/koin-visual-new-01-link.png`, `/tmp/koin-visual-new-03-public-mobile.png`, `/tmp/koin-visual-new-04-captured.png`.
- Screenshots pós-alinhamento Untitled UI: `/tmp/koin-ui-untitled-01-link.png`, `/tmp/koin-ui-untitled-02-public.png`, `/tmp/koin-ui-untitled-03-detail.png`.
- Screenshots pós-review visual: `/tmp/koin-ui-final-01-link.png`, `/tmp/koin-ui-final-02-insights.png`, `/tmp/koin-ui-final-03-dados.png`.
- Screenshots pós-referência de análise individual: `/tmp/koin-ref-layout-01-insights.png`, `/tmp/koin-ref-layout-02-dados.png`.
- Screenshot da navegação `Fingerprinting`: `/tmp/koin-fingerprinting-nav.png`.
- Screenshot da página pública com grid corrigido: `/tmp/koin-public-grid-fixed.png`.
- Screenshot da página pública igual à aba `DADOS`: `/tmp/koin-public-same-dados.png`.
- `npm run qa:demos:realtime` → ✅ passou; captura, Realtime e ausência de erros mantidos após a rodada visual.
- `npm run qa:demos:realtime` → ✅ passou novamente após ajustar o seletor do estado de link gerado; confirmou `status=captured`, `signals_json`, `insights_json`, 5 `verdictCards`, `riskScore=74`, `riskLevel=low`, `consoleErrors=[]`, `requestFailures=[]`.
- `npm run qa:demos:realtime` → ✅ passou após a rodada com referência visual; confirmou novamente captura real, atualização do vendedor via Realtime e ausência de `consoleErrors`/`requestFailures`.

---

## 2026-04-14 — [T/S] Paginação — padronização global, i18n e validação

**O que foi feito:**
- `src/hooks/use-pagination.ts` — criado hook partilhado para paginação client-side de listas locais.
- `src/components/application/pagination/*` — paginação Untitled padronizada e internacionalizada via `common.pagination`.
- `src/components/backtest/HistoricoTable.tsx`, `src/app/calculadora/historico/page.tsx`, `src/app/admin/users/users-admin-table.tsx`, `src/components/backtest/tabs/TransactionsTab.tsx`, `src/components/backtest/tabs/FraudIntelligenceTab.tsx`, `src/components/backtest/tabs/BlocklistExportTab.tsx` — tabelas migradas para o mesmo padrão visual: contagem à esquerda e `Anterior/Próxima` agrupados à direita.
- `messages/pt-BR.json`, `messages/en.json`, `messages/es.json` — adicionadas traduções da paginação, incluindo labels visuais e `aria-labels`.
- `docs/qa-relatorio.md` e `docs/plano-de-testes.md` — documentação atualizada com os cenários de paginação e resultados da rodada.

**Testes executados:**
- `npm run lint` → ✅ passou.
- `npm run qa:csv` → ✅ passou com base local `megatone_results.csv` de 121.620 linhas.
- `npm run build` → ✅ passou.

**Observações:**
- O build continua exibindo o aviso conhecido do Next.js sobre múltiplos `package-lock.json`; não bloqueia a release.

**Resultado:**
- ✅ Pronto para deploy em produção.

---

## 2026-04-14 — [S] Deploy produção — Paginação global e i18n

**O que foi feito:**
- Deploy de produção executado com `npx vercel deploy --prod --yes`.
- Deployment publicado em `https://sales-6smbl8jhi-otonielmendes-projects.vercel.app`.
- Alias de produção atualizado para `https://koinsaleshub.vercel.app`.
- Deployment ID: `dpl_9QkLfjgbB75oFZnvuGyzSV6F29oE`.
- Inspect: `https://vercel.com/otonielmendes-projects/sales-hub/9QkLfjgbB75oFZnvuGyzSV6F29oE`.

**Testes pré-deploy:**
- `npm run lint` → ✅ passou.
- `npm run qa:csv` → ✅ passou com 121.620 linhas.
- `npm run build` → ✅ passou.

**Testes pós-deploy:**
- `GET https://koinsaleshub.vercel.app/` → ✅ `200`, redirecionando para `/login` sem sessão.
- `GET https://koinsaleshub.vercel.app/backtests/historico` → ✅ `200`, redirecionando para `/login` sem sessão.
- `POST https://koinsaleshub.vercel.app/api/backtest/normalize` com CSV de aliases → ✅ `adjusted: true`, sem colunas obrigatórias faltantes.

**Resultado:**
- ✅ Produção atualizada com paginação padronizada, traduções PT/EN/ES da paginação e documentação de QA.

## 2026-04-14 — [T/S] Backtestes — normalização CSV, transações paginadas, i18n e QA pré-produção

**O que foi feito:**
- `src/app/api/backtest/normalize/route.ts` — criada normalização de CSV para o padrão esperado, com aliases de colunas, preservação de colunas extras, bloqueio de colunas obrigatórias ausentes e aviso de colunas opcionais faltantes.
- `public/templates/backtest_template.csv` — template hospedado com linha de exemplo para download na tela inicial de Testagens.
- `src/app/backtests/testagens/page.tsx` e `src/components/backtest/csv-upload/CsvFileProgressRow.tsx` — fluxo de upload passa por leitura, normalização, confirmação em modal, parsing e salvamento.
- `src/app/api/backtest/transactions/route.ts` e `src/components/backtest/tabs/TransactionsTab.tsx` — carregamento de transações migrado para paginação server-side, busca/filtro no servidor, skeleton/loading e download da página atual.
- `src/components/backtest/BacktestDashboard.tsx` e `src/components/backtest/tabs/ComparativoTab.tsx` — tabs migradas para padrão Untitled local; matriz de confusão compactada com siglas `VP/FN/FP/VN` ou `TP/FN/FP/TN`, mantendo texto completo em tooltip/acessibilidade.
- `messages/pt-BR.json`, `messages/en.json`, `messages/es.json` — textos de Backtestes revisados para troca correta de idioma, com ajustes específicos em espanhol e português.
- `src/components/application/header-navigations/header-navigation.tsx` — seletor de idioma persiste cookie/localStorage e força reload para atualizar mensagens carregadas no layout.
- `docs/qa-relatorio.md` e `docs/plano-de-testes.md` — documentação de QA/regressão atualizada para o novo fluxo.

**Testes executados:**
- `npm run build` → ✅ passou.
- `npm run qa:csv` → ✅ passou com base CSV local; valida parse + cálculo de métricas sem publicar o arquivo.
- `npx eslint ...` nos arquivos alterados → ✅ passou sem erros.
- Smoke HTTP local em `/`, `/backtests/testagens`, `/backtests/configuracoes`, `/backtests/historico` → ✅ rotas protegidas redirecionam corretamente para `/login` sem sessão.
- Smoke HTTP `POST /api/backtest/normalize` com CSV de aliases → ✅ normaliza colunas, preserva opcionais faltantes como aviso e retorna CSV ajustado.
- Smoke HTTP `POST /api/backtest/transactions` sem sessão → ✅ retorna `401 Unauthorized`, conforme esperado.

**Erros encontrados:**
- `npm run lint` global ainda falha porque o repositório possui erros/avisos antigos fora do escopo desta sessão e também ruído de artefatos locais duplicados em `Downloads/.../.next`.
  - Causa: lint global percorre áreas geradas/legadas e componentes Untitled/base com regras novas do React Compiler/ESLint.
  - Solução aplicada nesta sessão: validar lint nos arquivos alterados diretamente.
  - Próximo ajuste recomendado: abrir uma tarefa separada para saneamento global do lint e/ou exclusões de diretórios locais duplicados.
- Verificação visual via `agent-browser` não pôde ser executada porque o CLI não está disponível no PATH desta sessão.
  - Fallback: smoke HTTP local com servidor já rodando em `localhost:3000`.

**Resultado:**
- ✅ Fluxo de backtest pronto para validação final antes de produção.
- ⚠️ Recomenda-se decidir se o lint global legado deve bloquear deploy ou virar dívida técnica controlada.

**Próximos passos:**
- Confirmar com o usuário se podemos subir em produção.

---

## 2026-04-14 — [S] Deploy produção — Backtestes

**O que foi feito:**
- Deploy de produção executado com `npx vercel deploy --prod --yes`.
- Deployment publicado em `https://sales-ptmv61ywi-otonielmendes-projects.vercel.app`.
- Alias de produção atualizado para `https://koinsaleshub.vercel.app`.

**Testes pós-deploy:**
- `GET https://koinsaleshub.vercel.app/` → ✅ `200`, redirecionando para `/login` sem sessão.
- `GET https://koinsaleshub.vercel.app/backtests/testagens` → ✅ `200`, redirecionando para `/login` sem sessão.
- `POST https://koinsaleshub.vercel.app/api/backtest/normalize` com CSV de aliases → ✅ normalização ativa em produção, sem colunas obrigatórias faltantes.

**Resultado:**
- ✅ Produção atualizada com as correções de Backtestes.
- 🔄 Próxima tarefa combinada: tratar o `npm run lint` global em separado.

---

## 2026-03-30 — [S] Frontend — consistência de header, breadcrumbs e containers

**O que foi feito:**
- `src/components/backtest/KoinHeader.tsx` — menu principal renomeado de `Retrotestes` para `Backtestes`.
- `src/components/application/header-navigations/header-navigation.tsx` — seletor de idioma (`PT`, `EN`, `ES`) adicionado ao topo, com persistência em `localStorage` e atualização de `document.documentElement.lang`.
- `src/app/calculadora/_components/page-shell.tsx` — novo shell partilhado para container e breadcrumbs da Calculadora.
- `src/app/calculadora/historico/page.tsx`, `src/app/calculadora/configuracoes/page.tsx`, `src/app/calculadora/new/page.tsx`, `src/app/calculadora/[id]/page.tsx` — alinhados ao mesmo `max-w-container`, paddings e breadcrumb visual.
- `src/app/backtests/testagens/page.tsx`, `src/app/backtests/historico/page.tsx`, `src/app/backtests/configuracoes/page.tsx` — containers ajustados para `max-w-container`.
- `blueprint.md` — navegação, seletor de idioma e regras de layout atualizados.

**Resultado:**
- Header, largura útil e breadcrumbs ficaram mais consistentes entre Calculadora e Backtestes.

---

## 2026-03-30 — [S] Frontend — padronização de ações em tabelas

**O que foi feito:**
- `src/components/application/tables/row-action-button.tsx` — novo botão de ação por linha com estado compacto, expansão em hover/focus e variantes neutra/destrutiva.
- `src/app/calculadora/historico/page.tsx` — ações da tabela migradas para o padrão partilhado; visualizar passou a usar `SearchLg`.
- `src/components/backtest/HistoricoTable.tsx` — ações do histórico de Backtestes migradas para o mesmo componente e comportamento.
- `src/components/backtest/KoinHeader.tsx` — item `Guias` removido temporariamente da navegação principal.
- `src/components/backtest/BacktestDashboard.tsx` e `src/components/backtest/tabs/BlocklistExportTab.tsx` — CTAs migrados para `Button` com ícones Untitled UI e container ajustado para `max-w-container`.
- `blueprint.md` — regra explícita de consistência para ações em tabelas adicionada.

**Resultado:**
- Histórico da Calculadora e Histórico de Backtestes agora usam o mesmo padrão de ação visual e o mesmo ícone de visualização.

---

## 2026-03-31 — [S] Frontend — padronização estrutural das tabelas de histórico

**O que foi feito:**
- `src/components/application/tables/data-table-toolbar.tsx` — novo toolbar partilhado com busca e filtro no nível do card.
- `src/components/application/tables/row-action-button.tsx` — simplificado para padrão `icon only`, removendo a expansão com texto.
- `src/app/calculadora/historico/page.tsx` — busca e filtro movidos para dentro da tabela; header, badge e coluna de ações alinhados ao novo padrão.
- `src/components/backtest/HistoricoTable.tsx` — tabela reestruturada para o mesmo modelo visual da Calculadora, com toolbar interna, cabeçalhos nomeados e ações `icon only`.
- `src/components/application/table/table.tsx` e `src/components/application/tables/table.tsx` — cabeçalhos ajustados para uppercase pequeno e sem fundo divergente.

**Resultado:**
- As duas tabelas principais de histórico agora compartilham o mesmo formato visual e a mesma hierarquia de informação.

---

## 2026-03-31 — [S] Backtestes — refactor do dashboard de resultados

**O que foi feito:**
- `src/components/backtest/tabs/ComparativoTab.tsx` — comparativo reestruturado com cards maiores, mais métricas expostas sem colapso, strip de confusion matrix e bloco extra de concentração por bandeira.
- `src/components/backtest/tabs/FraudIntelligenceTab.tsx` — conteúdo de inteligência e blocklist consolidado numa única aba com grelha de painéis, preview reduzido e ação `Ver todos` em modal com opção de exportar CSV por tabela.
- `src/components/backtest/tabs/TransactionsTab.tsx` — nova aba para explorar as transações do CSV salvo com busca, filtro e exportação do conjunto filtrado.
- `src/app/api/backtest/transactions/route.ts` — nova rota autenticada para baixar e parsear o CSV salvo a partir do `backtest_files`.
- `src/components/backtest/BacktestDashboard.tsx` — tabs internas atualizadas de `Comparativo | Inteligência | Listas de bloqueio` para `Comparativo | Inteligência | Transações`.
- `src/types/backtest.ts`, `blueprint.md` — tipos e blueprint atualizados para refletir o novo fluxo de dataset/transações.

**Resultado:**
- O dashboard de resultados de backtest ficou mais denso em números, menos repetitivo entre abas e com melhor navegação entre insights operacionais e dataset bruto.

---

## 2026-03-30 — [S] Calculadora — layout e ordem dos cards (preview → código)

**O que foi feito:**
- `src/app/calculadora/layout.tsx` — `{children}` passa a renderizar diretamente sob `min-h-screen`, mantendo o header da Calculadora no topo sem o subnav antigo separado.
- `src/app/calculadora/[id]/page.tsx` — grelha de métricas: ordem **ROI (card escuro) → Aprovação → Decline → Chargeback**, alinhada ao reorder feito no preview.

**Resultado:**
- Estrutura visual da Calculadora alinhada ao preview, com navegação superior consolidada no header.

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

## 2026-03-31 — UI updates, empty states, i18n

**O que foi feito:**
- Internacionalização completa (PT, EN, ES): ficheiros `messages/*.json` criados com todas as chaves de auth, backtests, calculadora e componentes.
- `next-intl` adicionado ao projeto (`package.json`); `next.config.ts` atualizado.
- Empty states implementados nas páginas de histórico (backtests e calculadora), admin de usuários e testagens.
- Páginas de auth (`login`, `signup`, `recuperar-senha`, `atualizar-senha`) refatoradas para usar traduções via `useTranslations` / `getTranslations`.
- Admin users table, mobile header e outros componentes alinhados com i18n.
- Fix logo nas páginas `recuperar-senha` e `signup` (componente `KoinSalesHubLogo`).

**Resultado:** build OK; app totalmente traduzida nos 3 idiomas.

---

## 2026-04-13 — feat(calculadora): ROI com custos operacionais

**O que foi feito:**
- `CostSettings` e `getCostSettings()` em `benchmarks.ts` com defaults de indústria (MRC 2024, Braintree/Adyen).
- `calculateProjections()` atualizado para incluir economia de revisão manual, 3DS challenge e chargeback no ROI consolidado.
- Página `/calculadora/configuracoes` com secção de Custos Operacionais editável.
- Design alinhado ao padrão `main`: paleta Koin, `TabLink`, `CalculadoraPageContainer`, `page-shell.tsx`.
- `docs/calculadora-roi.md` criado com fórmulas e arquitetura da feature.

---

## 2026-04-13 — Fix calculadora: UX do formulário e breakdown de ROI

**O que foi feito:**
- Campo `moeda` adicionado ao formulário (seletor de moeda com `CURRENCY_OPTIONS`); campo obrigatório na validação.
- Lista de países expandida para toda a América Latina; `TagInput` com toggle multi-select e checkbox visual.
- `formatCurrency` atualizado para receber `currencyCode`; export PDF e página de análise usam a moeda do assessment.
- `getDefaultFormData()` inicializa `moeda` com `DEFAULT_CURRENCY_CODE`.
- Subtítulo 3DS ajustado; layout do export atualizado com novo CTA de download.

---

## 2026-04-14 — Fix calculadora: erro ao gerar relatório

**Causa:** Colunas `moeda`, `pct_volume_pix` e `pct_volume_apms` foram adicionadas ao código (commit `89ededf`) mas nunca foram criadas na tabela `assessments` do Supabase. O PostgREST rejeitava o payload com erro de coluna desconhecida.

**Solução:** Colunas adicionadas via Supabase Management API. Schema em `docs/supabase-assessments.sql` atualizado. Commit `f378d9d` no `main`.

---

## 2026-04-14 — Fix auth: reset de senha não funcionava

**Causa:** `uri_allow_list` no Supabase Auth estava configurado como `https://koinsaleshub.vercel.app` (sem wildcard). O link do email de reset apontava para `/auth/atualizar-senha`, que não estava na lista — o token era descartado e a página entrava em timeout de 8s.

**Solução:** `uri_allow_list` atualizado para `https://koinsaleshub.vercel.app,https://koinsaleshub.vercel.app/**` via Management API. Registado em `docs/DEPLOY-VERCEL.md`. Commit `71c5e24`.

---

## 2026-04-14 — Melhoria login: link de reset no erro de credenciais

**O que foi feito:** Quando o erro é `invalid_credentials`, a página de login passa a exibir um link clicável "Redefinir minha senha" → `/recuperar-senha`. Traduzido em PT, EN e ES. Commit `0a29de0`.

---

## 2026-04-14 — Operações de utilizadores

- **Rodrigo Pérez** (`rodrigo.m.perez@koin.com.br`): senha redefinida manualmente via Admin API (conta estava `active` mas com password desconhecida).
- **Gabriela Gallo** (`gabriela.gallo@koin.com.br`): conta criada via Admin API (Auth + `public.users` com `status=active`).

---
