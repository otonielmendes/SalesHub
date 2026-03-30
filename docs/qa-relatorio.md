# Relatório de QA — Koin Sales Hub

Data da execução: 2026-03-28

## 1. Base de teste (Downloads)

| Ficheiro | Caminho típico |
|----------|----------------|
| **megatone_results.csv** | `~/Downloads/megatone_results.csv` |

- ~19,2 M caracteres, **121.620** linhas de dados.
- Colunas alinhadas ao PRD: Payment Status, Veredicto Koin, Fraud, Total Amount, BIN, etc.

## 2. Pipeline offline (parse + métricas)

Comando:

```bash
npm run qa:csv
# ou, com caminho explícito:
npx --yes tsx scripts/qa-backtest-csv.ts "/caminho/para/ficheiro.csv"
```

**Resultado (megatone_results.csv):**

| Verificação | Resultado |
|-------------|-----------|
| `parseCsv` | OK (~250 ms) |
| Deteção de colunas | Todas as chaves necessárias mapeadas |
| `calculateMetrics` | OK (~1 s) |
| `totalRows` | 121.620 |
| `recoverableTransactions` | 13.866 |
| `detectionRate` | ~10,47% |
| `preventedPct` | ~76,49% |
| `capabilities.comparativo` / `confusionMatrix` | `true` |

## 3. Build de produção

```bash
npm run build
```

**Resultado:** compilação e TypeScript OK (Next.js 16.1.6).

## 4. QA manual no browser (dev local)

URL: `http://localhost:3000`

| Rota | Observação |
|------|------------|
| `/backtests/testagens` | Header **Koin Sales Hub**, menu PT (Retrotestes, Demonstrações, Guias), subtabs e área de upload presentes. |
| `/backtests/historico` | Depende do Supabase: em ambiente de teste pode aparecer erro PostgREST/RLS (ex.: políticas em `users`). Corrigir políticas em `docs/supabase-setup.sql` / painel Supabase. |

**Upload do CSV de ~121k linhas no browser:** possível mas pesado (memória e tempo de parse no cliente). Para smoke test rápido, usar um CSV mais pequeno ou confiar no script `npm run qa:csv` para o ficheiro completo.

## 5. Produção (Vercel)

- Confirmar envs em **Project → Settings → Environment Variables** (`NEXT_PUBLIC_SUPABASE_*`, `GEMINI_API_KEY`, etc.).
- Insights AI só aparecem com `GEMINI_API_KEY` definida (ver `docs/DEPLOY-VERCEL.md`).

## 6. Resumo

| Área | Estado |
|------|--------|
| CSV megatone (Downloads) + métricas | **Passou** |
| `npm run build` | **Passou** |
| UI Testagens (snapshot local) | **Passou** |
| Histórico | **Condicional** — requer Supabase/RLS corretos |
