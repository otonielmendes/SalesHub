-- =============================================================
-- Koin Sales Hub — Tabela assessments (Fraud Health Check)
-- Executar no SQL Editor do Supabase: kyicouglpzrirypxtrse
-- Idempotente — pode rodar múltiplas vezes com segurança
-- =============================================================

-- 1. FUNÇÃO: atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. TABELA: assessments
CREATE TABLE IF NOT EXISTS public.assessments (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now(),
  user_id                         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status                          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),

  -- Perfil do negócio
  merchant_name                   text NOT NULL,
  vertical                        text,
  volume_mensal                   text,
  moeda                           text,
  ticket_medio                    numeric,
  modelo_negocio                  text,
  pct_volume_cartao               numeric,
  pct_volume_pix                  numeric,
  pct_volume_apms                 numeric,
  opera_crossborder               boolean DEFAULT false,
  crossborder_paises              text,
  tem_programa_fidelidade         boolean DEFAULT false,

  -- KPIs de Fraude
  taxa_aprovacao                  numeric,
  taxa_chargeback                 numeric,
  taxa_decline                    numeric,
  pct_revisao_manual              numeric,
  challenge_rate_3ds              numeric,
  challenge_rate_outras           numeric,
  taxa_false_decline              numeric,
  tempo_revisao_manual            text,
  solucao_atual                   text,

  -- Dores & Capacidades
  dores                           text[],
  tem_regras_customizadas         text,
  validacao_identidade_onboarding text,
  device_fingerprinting           text,
  monitora_behavioral_signals     text,
  origem_fraude                   text[],
  notas_comercial                 text
);

-- 3. TRIGGER: manter updated_at sincronizado
DROP TRIGGER IF EXISTS set_assessments_updated_at ON public.assessments;
CREATE TRIGGER set_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (drop + recreate para ser idempotente)
DROP POLICY IF EXISTS "assessments_select_own"       ON public.assessments;
DROP POLICY IF EXISTS "assessments_insert_own"       ON public.assessments;
DROP POLICY IF EXISTS "assessments_update_own"       ON public.assessments;
DROP POLICY IF EXISTS "assessments_delete_own"       ON public.assessments;
DROP POLICY IF EXISTS "assessments_admin_select_all" ON public.assessments;

CREATE POLICY "assessments_select_own"
  ON public.assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "assessments_insert_own"
  ON public.assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assessments_update_own"
  ON public.assessments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "assessments_delete_own"
  ON public.assessments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "assessments_admin_select_all"
  ON public.assessments FOR SELECT
  USING (public.is_sales_hub_admin());

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_assessments_user_id    ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_updated_at ON public.assessments(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_status     ON public.assessments(status);

-- =============================================================
-- Após rodar: verificar com
-- SELECT count(*) FROM public.assessments;
-- =============================================================
