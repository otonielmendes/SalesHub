-- =============================================================
-- Koin Sales Hub — Lock demo_sessions RLS to authenticated users
-- =============================================================

ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

DO $drop_demo_policies$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'demo_sessions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.demo_sessions', policy_record.policyname);
  END LOOP;
END;
$drop_demo_policies$;

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
