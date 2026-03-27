# Findings — Koin Sales Hub

> Descobertas, constraints, decisões técnicas e aprendizados.
> Registar aqui tudo o que for descoberto durante a execução.
> Erros resolvidos devem incluir a solução para não repetir.

---

## Descobertas Iniciais (do PRD — 2026-03-27)

### CSV & Parsing

- **CSV é agnóstico de prospect**: a ferramenta não deve depender de nomes exatos de colunas. Cada campo é detectado por lista de keywords case-insensitive. O caso Megatone (Argentina) usa espanhol; outros prospects podem usar inglês ou português.
- **Dois caminhos de backtest**:
  1. *Automático (fast track)*: pipeline padrão contra modelos e regras gerais
  2. *Customizado*: time de modelos calibra modelo e rule set específico para o prospect
  Em ambos os casos o entregável é um CSV com coluna `Veredicto Koin` (Accept/Reject).
- **Valores monetários multilíngue**: amounts podem ter formato `$ 107.970` (Argentina) ou outros formatos. Parser deve ser robusto a separadores de milhar e símbolo de moeda.
- **Coluna `Fraud` pode ser vazia**: vazio = transação legítima. Qualquer valor não vazio (exceto `"0"`, `"false"`, `"no"`) = fraude.

### Renderização Condicional

- **Bloco só aparece se coluna existe**: se `bin` não está no CSV, a tabela "BINs de Alto Riesgo" simplesmente não renderiza. Sem mensagem de erro, sem placeholder. Isso é intencional — cada prospect tem colunas diferentes.
- **Análise dividida em 2 camadas**: estática (sempre, client-side, sem API) e AI (opcional, server-side, requer Gemini). O dashboard é 100% funcional sem a camada AI.

### Gemini AI

- **Nunca enviar CSV bruto ao Gemini**: por segurança e limite de tokens. Enviar apenas resumo estatístico: lista de colunas disponíveis, métricas agregadas já calculadas, top N de cada dimensão (top 10 categorias, top 10 BINs, etc.).
- **Cache obrigatório**: insights Gemini são salvos em `ai_insights_json` na tabela `backtests`. Não recalcular a cada visualização — é caro e lento.
- **Modelo**: Gemini Flash para análise rápida (< 3s). Gemini Pro como fallback para datasets complexos (> 100k linhas ou muitas dimensões).

### Auth & Acesso

- **Aprovação manual obrigatória**: sign-up cria conta em estado `pending`. Admin deve aprovar explicitamente. Isso evita que qualquer pessoa com email `@koin.com.br` acesse imediatamente.
- **Navegação "como usuário" para admin**: admin pode selecionar um usuário e ver o Sales Hub como se fosse aquele usuário. Deve haver indicador visual claro de que está em modo admin (banner ou badge).
- **Domínio restrito**: apenas `@koin.com.br` (e domínios a serem autorizados futuramente) podem se registrar. Validação deve ocorrer no servidor (não apenas no cliente).

### Design & UI

- **Layout Informational Pages 02**: o padrão de página da Untitled UI (`informational-pages-02`) é a referência para o layout geral do Sales Hub.
- **Fonte mono para valores numéricos**: usar `--font-mono` (Roboto Mono / SFMono-Regular / Menlo) para exibir valores de amount, percentuais e contagens. Facilita leitura de tabelas financeiras.
- **PDF gerado server-side**: não client-side. Razão: tamanho do dashboard, consistência de renderização, e possibilidade de incluir dados não carregados na tela atual.

### Performance

- **Parsing client-side para v1.0**: CSV processado no browser. Para arquivos grandes (> 50k linhas) pode ser lento — considerar Web Worker em v1.x se necessário.
- **`metrics_json` evita reprocessamento**: ao salvar um backtest, todas as métricas já calculadas são persistidas em JSON no Supabase. Ao abrir um backtest do histórico, carrega direto sem reprocessar o CSV.

### Supabase

- **RLS é obrigatório e sempre ativo**: nunca desativar para debugging em produção. Usar `service_role_key` apenas em server-side para operações admin.
- **Storage path**: `{user_id}/{backtest_id}/{filename}.csv` — estrutura hierárquica facilita RLS por pasta.

---

## Decisões Técnicas

| Decisão | Alternativa considerada | Razão |
|---|---|---|
| Parsing client-side (v1.0) | Server-side parsing | Latência menor, sem custo de função serverless para cada upload |
| Gemini Flash como modelo primário | GPT-4, Claude | Custo menor, latência < 3s, suficiente para análise estatística |
| Supabase Auth | Clerk, NextAuth | Integração nativa com DB e Storage no mesmo projeto |
| Resumo estatístico para Gemini | CSV completo | Segurança (dados sensíveis), limite de tokens, custo |
| `metrics_json` cacheado | Reprocessar CSV sempre | Performance ao abrir histórico, CSV pode não estar mais disponível |
| React Aria (Untitled UI) | Radix UI | Acessibilidade nativa, padrão do design system escolhido |

---

## Constraints Conhecidos

- **Limite de upload de arquivo**: Supabase Storage tem limite de 50MB por arquivo por padrão. CSV de backtest típico tem 5-20MB. OK para v1.0.
- **Vercel Function timeout**: 60s no plano Hobby, 300s no Pro. Geração de PDF pode ser pesada — verificar plano.
- **Gemini API quota**: verificar limites de RPM (requests per minute) do plano gratuito vs. pago antes de ir para produção.
- **CSV encoding**: prospects podem enviar arquivos em UTF-8, ISO-8859-1, ou Windows-1252. Parser deve detectar encoding ou normalizar para UTF-8.

---

## Pendente de Investigação

- [ ] Confirmar formato exato do PDF: usar `@react-pdf/renderer`, `puppeteer`, ou `html2canvas + jsPDF`?
- [ ] Confirmar domínio final do Sales Hub: `hub.koin.com.br` ou `sales.koin.com.br`?
- [ ] Limite de tamanho de CSV que o browser consegue processar sem travar (testar com arquivos reais)
- [ ] Confirmar se Gemini Flash 1.5 ou 2.0 para o projeto (verificar pricing e disponibilidade em 2026)

---

*Atualizar este ficheiro sempre que: um erro for resolvido, uma constraint for descoberta, ou uma decisão técnica for tomada.*
