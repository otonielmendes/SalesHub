-- =============================================================
-- Koin Sales Hub — SQL Setup (idempotente — pode rodar múltiplas vezes)
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. TABELA: users
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  name        text,
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_login  timestamptz
);

-- 2. TABELA: backtests
CREATE TABLE IF NOT EXISTS public.backtests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prospect_name    text NOT NULL,
  filename         text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  row_count        integer,
  fraud_count      integer,
  metrics_json     jsonb,
  ai_insights_json jsonb
);

-- 3. TABELA: backtest_files
CREATE TABLE IF NOT EXISTS public.backtest_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backtest_id  uuid NOT NULL REFERENCES public.backtests(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

-- 4. TABELA: demo_sessions (Demos > Device Fingerprinting)
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

-- =============================================================
-- RLS: Ativar em todas as tabelas
-- =============================================================
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_sessions  ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- Função auxiliar: admin sem recursão nas policies
-- Políticas que fazem EXISTS (SELECT ... FROM public.users) dentro
-- de policies em `users` causam "infinite recursion detected in policy
-- for relation users". SECURITY DEFINER lê a tabela com privilégios do
-- dono da função, fora do ciclo RLS.
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_sales_hub_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_sales_hub_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_sales_hub_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_sales_hub_admin() TO service_role;

-- =============================================================
-- POLICIES: users (drop + recreate para ser idempotente)
-- =============================================================
DROP POLICY IF EXISTS "users_select_own"        ON public.users;
DROP POLICY IF EXISTS "users_update_own"         ON public.users;
DROP POLICY IF EXISTS "users_admin_select_all"   ON public.users;
DROP POLICY IF EXISTS "users_admin_update_all"   ON public.users;
DROP POLICY IF EXISTS "users_insert_service"     ON public.users;

CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users_admin_select_all"
  ON public.users FOR SELECT
  USING (public.is_sales_hub_admin());

CREATE POLICY "users_admin_update_all"
  ON public.users FOR UPDATE
  USING (public.is_sales_hub_admin());

CREATE POLICY "users_insert_service"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- =============================================================
-- POLICIES: backtests
-- =============================================================
DROP POLICY IF EXISTS "backtests_select_own"       ON public.backtests;
DROP POLICY IF EXISTS "backtests_insert_own"       ON public.backtests;
DROP POLICY IF EXISTS "backtests_update_own"       ON public.backtests;
DROP POLICY IF EXISTS "backtests_delete_own"       ON public.backtests;
DROP POLICY IF EXISTS "backtests_admin_select_all" ON public.backtests;

CREATE POLICY "backtests_select_own"
  ON public.backtests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "backtests_insert_own"
  ON public.backtests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "backtests_update_own"
  ON public.backtests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "backtests_delete_own"
  ON public.backtests FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "backtests_admin_select_all"
  ON public.backtests FOR SELECT
  USING (public.is_sales_hub_admin());

-- =============================================================
-- POLICIES: backtest_files
-- =============================================================
DROP POLICY IF EXISTS "backtest_files_select_own" ON public.backtest_files;
DROP POLICY IF EXISTS "backtest_files_insert_own" ON public.backtest_files;

CREATE POLICY "backtest_files_select_own"
  ON public.backtest_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.backtests b
      WHERE b.id = backtest_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "backtest_files_insert_own"
  ON public.backtest_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.backtests b
      WHERE b.id = backtest_id AND b.user_id = auth.uid()
    )
  );

-- =============================================================
-- POLICIES: demo_sessions
-- =============================================================
DROP POLICY IF EXISTS "demo_sessions_select_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_insert_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_update_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_delete_own"       ON public.demo_sessions;
DROP POLICY IF EXISTS "demo_sessions_admin_select_all" ON public.demo_sessions;

CREATE POLICY "demo_sessions_select_own"
  ON public.demo_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_sessions_insert_own"
  ON public.demo_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "demo_sessions_update_own"
  ON public.demo_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_sessions_delete_own"
  ON public.demo_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "demo_sessions_admin_select_all"
  ON public.demo_sessions FOR SELECT
  TO authenticated
  USING (public.is_sales_hub_admin());

-- =============================================================
-- STORAGE: Bucket backtest-files
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('backtest-files', 'backtest-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_select_own"  ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_own"  ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own"  ON storage.objects;
DROP POLICY IF EXISTS "storage_admin_all"   ON storage.objects;

CREATE POLICY "storage_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'backtest-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'backtest-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'backtest-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_admin_all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'backtest-files' AND
    public.is_sales_hub_admin()
  );

-- =============================================================
-- ÍNDICES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_backtests_user_id        ON public.backtests(user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_created_at     ON public.backtests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_files_backtest  ON public.backtest_files(backtest_id);
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

-- =============================================================
-- Demos: expiração automática segura via pg_cron
-- =============================================================
-- Roda dentro do Postgres, sem endpoint público, e só altera sessões
-- pending cujo expires_at já passou.
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

-- =============================================================
-- Após rodar: promover primeiro admin manualmente
-- UPDATE public.users SET role = 'admin', status = 'active' WHERE email = 'seu@koin.com.br';
-- =============================================================
