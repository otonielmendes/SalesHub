# Relatório de QA — Koin Sales Hub

Data da execução: 2026-04-14

## 1. Base de teste local

- Base CSV grande mantida apenas localmente para QA.
- ~19,2 M caracteres, **121.620** linhas de dados.
- A base não foi publicada nem enviada para nenhum serviço externo durante este QA.
- Colunas principais reconhecidas: Payment Status, Veredicto Koin, Fraud, Total Amount, BIN, etc.

## 2. Pipeline offline (parse + métricas)

Comando:

```bash
npm run qa:csv
# ou, com caminho explícito:
npx --yes tsx scripts/qa-backtest-csv.ts "/caminho/para/ficheiro.csv"
```

**Resultado da base local grande:**

| Verificação | Resultado |
|-------------|-----------|
| `parseCsv` | OK (~378 ms na última execução) |
| Detecção de colunas | Chaves principais mapeadas |
| `calculateMetrics` | OK (~923 ms na última execução) |
| `totalRows` | 121.620 |
| `approvalRateToday` | 72,58% |
| `approvalRateKoin` | 90,59% |
| `recoverableTransactions` | 13.946 |
| `detectionRate` | 75,43% |
| `preventedPct` | 81,11% |
| `capabilities.comparativo` / `confusionMatrix` | `true` |

## 3. Normalização CSV

Smoke HTTP local:

```bash
POST /api/backtest/normalize
```

**Resultado:**

| Caso | Resultado |
|------|-----------|
| Headers por aliases (`documento`, `fecha`, `brand`, `status`, etc.) | Normalizados para o padrão |
| Colunas obrigatórias presentes | OK |
| Colunas opcionais ausentes (`Shipping Cost`, `IP`, `Item Quantity`) | Aviso não bloqueante |
| CSV ajustado | Retornado pela API |

## 4. Build de produção

```bash
npm run build
```

**Resultado:** compilação e TypeScript OK (Next.js 16.1.6).

## 5. Lint

| Comando | Resultado |
|---------|-----------|
| `npm run lint` global | **Passou** |

## 6. Smoke HTTP local

URL: `http://localhost:3000`

| Rota | Observação |
|------|------------|
| `/` | Redireciona para `/login` sem sessão |
| `/backtests/testagens` | Redireciona para `/login` sem sessão |
| `/backtests/configuracoes` | Redireciona para `/login` sem sessão |
| `/backtests/historico` | Redireciona para `/login` sem sessão |
| `POST /api/backtest/transactions` sem sessão | `401 Unauthorized` |

## 7. Áreas validadas nesta rodada

| Área | Estado |
|------|--------|
| Normalização automática de CSV | **Passou** |
| Template CSV hospedado | **Implementado** |
| Dados parciais/opcionais faltantes | **Passou como relatório parcial** |
| Colunas extras | **Preservadas e ignoradas nos cálculos oficiais** |
| Transações paginadas server-side | **Implementado** |
| Skeleton/loading em planilhas | **Implementado** |
| Tabs do dashboard em padrão Untitled local | **Implementado** |
| Traduções Backtestes PT/EN/ES | **Revisadas** |
| Matriz de confusão compacta | **Implementado** |
| Paginação padronizada nas tabelas | **Implementado** |
| Paginação traduzida PT/EN/ES | **Implementado** |

**Upload do CSV de ~121k linhas no browser:** possível mas pesado (memória e tempo de parse no cliente). Para smoke test rápido, usar um CSV mais pequeno ou confiar no script `npm run qa:csv` para o ficheiro completo.

## 8. Produção (Vercel)

- Confirmar envs em **Project → Settings → Environment Variables** (`NEXT_PUBLIC_SUPABASE_*`, `GEMINI_API_KEY`, etc.).
- Insights AI só aparecem com `GEMINI_API_KEY` definida (ver `docs/DEPLOY-VERCEL.md`).
- Gate local desta rodada: `npm run lint`, `npm run build` e `npm run qa:csv` passaram.

## 9. Resumo

| Área | Estado |
|------|--------|
| CSV local grande + métricas | **Passou** |
| Normalização CSV | **Passou** |
| Transações/API protegida | **Passou** |
| `npm run lint` global | **Passou** |
| `npm run build` | **Passou** |
| Smoke HTTP local | **Passou** |
