-- =============================================================
-- Koin Sales Hub — Demos > Device Fingerprinting
-- Tabela demo_sessions + RLS + Realtime + expiração automática (idempotente)
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.demo_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'captured', 'expired')),
  prospect_name text,
  share_token   uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  signals_json  jsonb,
  insights_json jsonb
);

ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_sessions_select_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_insert_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_update_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_delete_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_admin_select_all" ON public.demo_sessions;

CREATE POLICY "demo_sessions_select_own"
  ON public.demo_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "demo_sessions_insert_own"
  ON public.demo_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "demo_sessions_update_own"
  ON public.demo_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "demo_sessions_delete_own"
  ON public.demo_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "demo_sessions_admin_select_all"
  ON public.demo_sessions FOR SELECT
  USING (public.is_sales_hub_admin());

CREATE INDEX IF NOT EXISTS idx_demo_sessions_user_created
  ON public.demo_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_status_expires
  ON public.demo_sessions(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_share_token
  ON public.demo_sessions(share_token);

-- Necessário para Supabase Realtime entregar UPDATEs no detalhe da demo.
ALTER TABLE public.demo_sessions REPLICA IDENTITY FULL;

DO $realtime$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'demo_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.demo_sessions;
  END IF;
END;
$realtime$;

-- Expiração automática segura:
-- - roda dentro do Postgres via pg_cron, sem endpoint público
-- - só altera sessões pending já vencidas
-- - retorna a quantidade de linhas expiradas para auditoria nos logs do cron
CREATE OR REPLACE FUNCTION public.expire_demo_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE public.demo_sessions
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_demo_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_demo_sessions() TO service_role;

DO $expire_job$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'expire-demo-sessions'
  ) THEN
    PERFORM cron.unschedule('expire-demo-sessions');
  END IF;

  PERFORM cron.schedule(
    'expire-demo-sessions',
    '*/15 * * * *',
    $$SELECT public.expire_demo_sessions();$$
  );
END;
$expire_job$;
