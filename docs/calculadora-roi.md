# Calculadora de ROI — Lógica e Arquitetura

## Visão Geral

A Calculadora de ROI é uma ferramenta de diagnóstico e projeção financeira para merchants. A partir de dados de volume, performance e KPIs operacionais, ela estima o retorno que o merchant teria ao adotar a Koin.

---

## Arquivos Principais

```
src/lib/health-check/
  benchmarks.ts       ← defaults e helpers de settings (performance + custos)
  projections.ts      ← lógica central de cálculo do ROI
  diagnostic-rules.ts ← regras de diagnóstico (health score + insights)
  types.ts            ← tipos: Assessment, DiagnosticInsight, etc.
  store.ts            ← persistência de assessments (localStorage + Supabase)
  utils.ts            ← formatadores (moeda, percentual, data)

src/app/calculadora/
  new/page.tsx               ← formulário de entrada
  [id]/page.tsx              ← resultado com ROI e diagnóstico
  [id]/export/page.tsx       ← versão PDF do resultado
  configuracoes/page.tsx     ← painel de configurações (performance + custos)
  _components/subnav.tsx     ← navegação da seção
```

---

## Modelo de Dados: Assessment

Campos coletados no formulário (`src/lib/health-check/types.ts`):

| Campo | Tipo | Descrição |
|---|---|---|
| `vertical` | Vertical | Segmento do merchant (E-commerce, Fintech, etc.) |
| `volume_mensal` | VolumeRange | Faixa de volume mensal |
| `ticket_medio` | number | Valor médio da transação (R$) |
| `pct_volume_cartao` | number | % do volume processado em cartão |
| `taxa_aprovacao` | number | Taxa de aprovação atual (%) |
| `taxa_chargeback` | number | Taxa de chargeback atual (%) |
| `taxa_decline` | number | Taxa de declínio total (%) |
| `pct_revisao_manual` | number? | % de transações em revisão manual |
| `challenge_rate_3ds` | number? | % de transações com challenge 3DS |
| `taxa_false_decline` | number? | Taxa de falso declínio (%) |

---

## Lógica de Cálculo do ROI

**Arquivo:** `src/lib/health-check/projections.ts`
**Função:** `calculateProjections(input: ProjectionInput): ProjectionResult`

### Entradas obrigatórias

| Campo | Origem |
|---|---|
| `volume_faixa` | assessment.volume_mensal |
| `pct_volume_cartao` | assessment.pct_volume_cartao |
| `ticket_medio` | assessment.ticket_medio |
| `taxa_aprovacao` | assessment.taxa_aprovacao |
| `taxa_chargeback` | assessment.taxa_chargeback |

### Entradas opcionais (enriquecem o ROI)

| Campo | Origem | Efeito quando ausente |
|---|---|---|
| `pct_revisao_manual` | assessment.pct_revisao_manual | economia_revisao = 0 |
| `challenge_rate_3ds` | assessment.challenge_rate_3ds | economia_3ds = 0 |
| `costs` | `getCostSettings()` | usa KOIN_COST_DEFAULTS |

### Fórmulas

```
1. VOLUME BASE
   volume_mensal  = VOLUME_MAP[volume_faixa]   // lookup por faixa
   volume_cartao  = volume_mensal × (pct_volume_cartao / 100)

2. LIFT DE APROVAÇÃO
   lift_pp                = min(3, 100 - taxa_aprovacao)   // máx +3pp
   taxa_aprovacao_koin    = taxa_aprovacao + lift_pp
   receita_atual          = volume_cartao × ticket_medio × (taxa_aprovacao / 100)
   receita_projetada      = volume_cartao × ticket_medio × (taxa_aprovacao_koin / 100)
   lift_receita_mensal    = receita_projetada - receita_atual
   lift_receita_anual     = lift_receita_mensal × 12

3. CHARGEBACK
   reducao_cb_estimada    = taxa_chargeback × 0.20          // -20% estimado
   economia_cb_mensal     = volume_cartao × ticket_medio × (reducao_cb_estimada / 100)
   economia_cb_anual      = economia_cb_mensal × 12

4. REVISÃO MANUAL (requer pct_revisao_manual)
   transacoes_revisao     = volume_cartao × (pct_revisao_manual / 100)
   economia_revisao_mensal = transacoes_revisao
                            × custo_por_revisao_manual
                            × (reducao_revisao_manual_koin / 100)
   economia_revisao_anual = economia_revisao_mensal × 12

5. 3DS CHALLENGE (requer challenge_rate_3ds)
   transacoes_challenge   = volume_cartao × (challenge_rate_3ds / 100)
   economia_custo_direto  = transacoes_challenge × custo_por_3ds_challenge × 0.60
   receita_recuperada     = transacoes_challenge × (taxa_abandono_3ds / 100)
                            × ticket_medio × 0.60
   economia_3ds_mensal    = economia_custo_direto + receita_recuperada
   economia_3ds_anual     = economia_3ds_mensal × 12

   Nota: 0.60 representa a redução estimada de challenges com Koin (~60%)

6. CUSTO KOIN
   custo_koin_mensal      = receita_projetada × 0.005      // 0,5% da receita projetada

7. ROI FINAL
   roi_anual_estimado =
     lift_receita_anual
     + economia_cb_anual
     + economia_revisao_anual
     + economia_3ds_anual
     - (custo_koin_mensal × 12)
```

---

## Custos Operacionais Configuráveis

**Arquivo:** `src/lib/health-check/benchmarks.ts`
**Interface:** `CostSettings`
**Storage:** `localStorage["koin_cost_settings"]`

| Parâmetro | Default | Fonte |
|---|---|---|
| `custo_por_revisao_manual` | R$ 4,50 | MRC 2024: ~5,6 min/análise, analista júnior Brasil + encargos |
| `reducao_revisao_manual_koin` | 70% | Benchmark Koin de automação de triagem |
| `custo_por_3ds_challenge` | R$ 0,30 | Braintree/Adyen: $0,10–$0,30 por challenge |
| `taxa_abandono_3ds` | 15% | Benchmarks de conversão e-commerce |

Valores editáveis em `/calculadora/configuracoes`.

---

## Performance por Vertical

**Arquivo:** `src/lib/health-check/benchmarks.ts`
**Constante:** `KOIN_PERFORMANCE_DEFAULTS`
**Storage:** `localStorage["koin_performance_settings"]`

Define lift de aprovação e redução de chargeback esperados por segmento. Atualmente o cálculo usa `KOIN_EXPECTED_LIFT = 3pp` fixo para todos os verticais — os valores por vertical estão disponíveis mas ainda não são usados no `calculateProjections`. Oportunidade futura: usar `lift_aprovacao` do vertical correto.

---

## Health Score

```
criticalCount = nº de insights com priority = "CRITICAL"
warningCount  = nº de insights com priority = "WARNING"
healthScore   = max(0, 100 - criticalCount × 15 - warningCount × 5)

>= 70 → Saudável
>= 40 → Atenção
<  40 → Crítico
```

---

## Regras Diagnósticas

Definidas em `src/lib/health-check/diagnostic-rules.ts`. Gatilhos principais:

| Regra | Condição |
|---|---|
| REGRA 01 | taxa_chargeback > 1,0% |
| REGRA 02 | taxa_decline > 15% e taxa_false_decline > 5% |
| REGRA 03 | pct_revisao_manual > 10% |
| REGRA 04 | challenge_rate_3ds > 40% |
| REGRA 06 | device_fingerprinting = "Não" + fraude em contas novas |
| REGRA 07 | ATO como dor + validação de identidade insuficiente |
| REGRA 15 | taxa_aprovacao > 90% e taxa_chargeback > 0,8% |
| REGRA 16 | taxa_aprovacao < (benchmark do vertical - 10pp) |
| REGRA 17 | solucao_atual = "Nenhuma" |

---

## O que NÃO entra no ROI hoje (oportunidades futuras)

| Variável | Por que poderia entrar |
|---|---|
| `taxa_false_decline` | Receita perdida em transações legítimas recusadas |
| `lift_aprovacao` por vertical | Substituir o 3pp fixo por valor real do segmento |
| `pct_volume_pix` / `pct_volume_apms` | Fora do escopo Koin atual |
| `opera_crossborder` | Modifica risco e custo de 3DS |
| `validacao_identidade_onboarding` | Influencia o lift real de aprovação |
