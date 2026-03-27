# Progress — Koin Sales Hub

> Log de execução. Registar aqui o que foi feito, erros encontrados e resultados.
> Atualizar após **cada sessão de trabalho**.
> Formato: `## YYYY-MM-DD — [Fase] Descrição`

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
