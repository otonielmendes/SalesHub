# Plano de testes — Koin Sales Hub

Checklist manual para regressão antes de releases. Marcar data e responsável.

## 1. Autenticação

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 1.1 | Signup domínio inválido | Email fora de `koin.com.br` / `otnl.com.br` | Rejeição clara |
| 1.2 | Signup válido | Email permitido, senha ≥ 8 | Conta criada; mensagem pending ou bootstrap admin |
| 1.3 | Login pending | Utilizador `status=pending` | Redireciono com erro `pending_approval`; sem sessão |
| 1.4 | Login disabled | `status=disabled` | Erro `account_disabled` |
| 1.5 | Login OK | Utilizador `active` | Redirect para `/backtests/historico` |
| 1.6 | Logout | Menu conta → Sair | Redirect `/login`; rotas `/backtests` exigem login |
| 1.7 | Recuperar senha | Fluxo `/recuperar-senha` se configurado no Supabase | Email / página sem erro 500 |

## 2. Admin

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 2.1 | Não-admin | User normal acede `/admin/users` | Redirect para `/backtests/historico` |
| 2.2 | Lista | Admin abre `/admin/users` | Tabela com emails e estados |
| 2.3 | Aprovar | Pending → Aprovar | `status=active`; login possível |
| 2.4 | Desativar | Active → Desativar (outro user) | `disabled`; não entra |
| 2.5 | Último admin | Tentar remover admin do único admin ativo | Mensagem de erro da API |

## 3. Backtest — Nova análise

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 3.1 | CSV vazio | Upload inválido | Mensagem de erro |
| 3.2 | CSV no padrão | Upload com colunas exatamente no template | Segue direto para parse/salvamento sem ajuste |
| 3.3 | CSV com aliases | Upload com aliases conhecidos (`documento`, `fecha`, `brand`, etc.) | Modal informa ajuste; ao confirmar, CSV é normalizado |
| 3.4 | CSV com colunas obrigatórias faltantes | Remover uma coluna obrigatória | Upload bloqueado com mensagem clara |
| 3.5 | CSV sem opcionais | Remover `Shipping Cost`, `IP`, `Item Quantity` | Relatório parcial; cards dependentes de dados faltantes não devem quebrar |
| 3.6 | CSV com colunas extras | Adicionar coluna desconhecida | Coluna extra é preservada no CSV salvo e ignorada nos cálculos oficiais |
| 3.7 | Template CSV | Clicar em baixar template | Download com cabeçalho padrão e linha de exemplo |
| 3.8 | Insights com API | `GEMINI_API_KEY` definida | Loading → faixa de insights ou mensagem “nenhum insight” |
| 3.9 | Insights sem API | Key ausente em preview | Estado “indisponível” com texto explicativo (não silencioso) |
| 3.10 | Salvar | Botão Salvar com ficheiro | Sucesso; entrada no histórico |

## 3.1 Backtest — Resultado e Transações

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 3.11 | Abas do relatório | Abrir relatório salvo | Abas em padrão Untitled: Comparativo, Inteligência, Transações |
| 3.12 | Matriz de confusão compacta | Abrir Comparativo em PT/ES/EN | Siglas em uma linha; tooltip/aria mantêm nome completo |
| 3.13 | Fraude por valor | Abrir Comparativo com dados financeiros | Card alinhado à matriz e sem altura excessiva |
| 3.14 | Transações paginadas | Abrir aba Transações com CSV grande | Primeira página carrega sem renderizar todas as linhas no browser |
| 3.15 | Busca de transações | Buscar pedido/email/documento | Resultado filtrado no servidor, página volta para 1 |
| 3.16 | Filtro de transações | Alternar fraude/limpa/rejeitada/aprovada | Resultado filtrado no servidor |
| 3.17 | Loading de planilha | Trocar busca/filtro/página | Skeleton/overlay aparecem durante carregamento |
| 3.18 | Download de página | Clicar em baixar página | CSV exporta somente a página/resultado carregado |
| 3.19 | API sem sessão | Chamar `/api/backtest/transactions` sem login | `401 Unauthorized` |

## 4. Histórico

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 4.1 | User | Lista só os próprios backtests | RLS |
| 4.2 | Admin | Lista inclui outros se política “admins see all” ativa | Conforme SQL em produção |

## 5. UI / Navegação

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 5.1 | Links externos Untitled | Abrir menu mobile e desktop | Sem `untitledui.com` em links de produto |
| 5.2 | Configurações | Link no menu | `/backtests/configuracoes` abre |
| 5.3 | Tabs backtests | Nova análise / Histórico / Config | Navegação correta; clique no produto abre Histórico |
| 5.8 | Tabs Fingerprinting | Abrir `/fingerprinting/new` | Apenas `Nova análise` fica selecionada, não `Histórico` |
| 5.4 | Idioma PT/EN/ES | Alterar idioma pelo header | Textos de Backtestes mudam após reload automático |
| 5.5 | Tradução espanhol | Abrir Comparativo em ES | Sem textos mistos como “Fraude prevenido” ou labels em inglês |
| 5.6 | Paginação padrão | Abrir Histórico de Backtestes, Histórico da Calculadora, Admin, Transações e modais de Inteligência | Todas usam o mesmo modelo Untitled: contagem à esquerda e Previous/Next agrupados à direita |
| 5.7 | Paginação traduzida | Alternar PT/EN/ES e abrir uma tabela paginada | Rótulos visuais e `aria-labels` da paginação seguem o idioma selecionado |

## 6. Smoke automatizado (opcional)

Para acrescentar depois com Playwright ou similar:

- Login com utilizador de teste (env `E2E_EMAIL` / `E2E_PASSWORD`).
- Upload de um CSV fixture em `tests/fixtures/minimal.csv`.
- Asserção: texto “transações” ou painel comparativo visível.

Comando sugerido (quando configurado): `npm run test:e2e`.

## 7. Segurança / Dependências

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 7.1 | Audit de dependências | Rodar `npm audit --audit-level=moderate` antes de release/deploy | Zero vulnerabilidades abertas ou exceção documentada |
| 7.2 | Vulnerabilidade high/critical runtime | Se `npm audit` apontar pacote usado em runtime (`next`, auth, Supabase, parsing, APIs) | Bloqueia release até upgrade, mitigação ou aceite formal documentado |
| 7.3 | Vulnerabilidade em ferramenta dev | Se afetar apenas tooling local/CI | Avaliar exposição; pode seguir com aceite temporário documentado em `progress.md` |
| 7.4 | QA Fingerprinting Realtime | Rodar `npm run qa:demos:realtime` com envs Supabase de teste; para preview protegido, setar `QA_APP_ORIGIN` e `QA_PREVIEW_ACCESS_URL` | Vendedor vê `Capturado`/`INSIGHTS` sem reload; usuário QA temporário é removido |
| 7.5 | Expiração Fingerprinting via banco | Rodar `npm run qa:demos:expiration`; em produção, confirmar no Supabase que o job `expire-demo-sessions` existe em `cron.job` | Apenas sessões `pending` com `expires_at < now()` mudam para `expired`; sessões `captured` não mudam |
| 7.6 | Segurança Fingerprinting pública | Rodar `npm run qa:demos:security` com app disponível em `QA_APP_ORIGIN` ou `localhost:3000`; para preview protegido, setar `QA_PREVIEW_ACCESS_URL` | Anon key não lê `demo_sessions`; token expirado retorna 410; sessão capturada não é sobrescrita; token inexistente retorna 404 |
| 7.7 | Partilha Fingerprinting por canal | Rodar `npm run qa:demos:share` com app disponível em `QA_APP_ORIGIN` ou `localhost:3000`; para preview protegido, setar `QA_PREVIEW_ACCESS_URL` | WhatsApp inclui telefone e link; Gmail inclui destinatário e link; QR renderiza; canal copiar grava o link; sem console errors |

---

**Definição de pronto para release:** todos os itens 1.x, 2.x, 3.x críticos, 5.1 e 7.1 passam no ambiente alvo (preview ou produção). Vulnerabilidades `high`/`critical` em runtime bloqueiam release salvo exceção explícita registada.
