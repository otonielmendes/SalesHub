# Plano de testes — Koin Sales Hub

Checklist manual para regressão antes de releases. Marcar data e responsável.

## 1. Autenticação

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 1.1 | Signup domínio inválido | Email fora de `koin.com.br` / `otnl.com.br` | Rejeição clara |
| 1.2 | Signup válido | Email permitido, senha ≥ 8 | Conta criada; mensagem pending ou bootstrap admin |
| 1.3 | Login pending | Utilizador `status=pending` | Redireciono com erro `pending_approval`; sem sessão |
| 1.4 | Login disabled | `status=disabled` | Erro `account_disabled` |
| 1.5 | Login OK | Utilizador `active` | Redirect para `/backtests/testagens` |
| 1.6 | Logout | Menu conta → Sair | Redirect `/login`; rotas `/backtests` exigem login |
| 1.7 | Recuperar senha | Fluxo `/recuperar-senha` se configurado no Supabase | Email / página sem erro 500 |

## 2. Admin

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 2.1 | Não-admin | User normal acede `/admin/users` | Redirect para `/backtests/testagens` |
| 2.2 | Lista | Admin abre `/admin/users` | Tabela com emails e estados |
| 2.3 | Aprovar | Pending → Aprovar | `status=active`; login possível |
| 2.4 | Desativar | Active → Desativar (outro user) | `disabled`; não entra |
| 2.5 | Último admin | Tentar remover admin do único admin ativo | Mensagem de erro da API |

## 3. Backtest — Testagens

| # | Caso | Passos | Esperado |
|---|------|--------|----------|
| 3.1 | CSV vazio | Upload inválido | Mensagem de erro |
| 3.2 | CSV mínimo completo | Colunas payment + koin + fraud (+ amount opcional) | Blocos comparativo / matriz / financeiro conforme blueprint |
| 3.3 | CSV parcial | Só algumas colunas | Blocos sem colunas não aparecem (com `capabilities`) |
| 3.4 | Insights com API | `GEMINI_API_KEY` definida | Loading → faixa de insights ou mensagem “nenhum insight” |
| 3.5 | Insights sem API | Key ausente em preview | Estado “indisponível” com texto explicativo (não silencioso) |
| 3.6 | Salvar | Botão Salvar com ficheiro | Sucesso; entrada no histórico |

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
| 5.3 | Tabs backtests | Testagens / Histórico / Config | Navegação correta |

## 6. Smoke automatizado (opcional)

Para acrescentar depois com Playwright ou similar:

- Login com utilizador de teste (env `E2E_EMAIL` / `E2E_PASSWORD`).
- Upload de um CSV fixture em `tests/fixtures/minimal.csv`.
- Asserção: texto “transações” ou painel comparativo visível.

Comando sugerido (quando configurado): `npm run test:e2e`.

---

**Definição de pronto para release:** todos os itens 1.x, 2.x, 3.x críticos e 5.1 passam no ambiente alvo (preview ou produção).
