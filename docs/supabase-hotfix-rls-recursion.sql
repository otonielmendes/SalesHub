-- =============================================================
-- Hotfix (produção): "infinite recursion detected in policy for relation users"
-- Sintoma: 500 / digest na Vercel ao abrir Histórico, Admin, ou qualquer SELECT em users/backtests.
-- Causa: policies admin com EXISTS (SELECT ... FROM public.users) reciclam RLS em users.
-- Ação: executar UMA VEZ no SQL Editor do Supabase (projeto de produção).
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

DROP POLICY IF EXISTS "users_admin_select_all" ON public.users;
DROP POLICY IF EXISTS "users_admin_update_all" ON public.users;

CREATE POLICY "users_admin_select_all"
  ON public.users FOR SELECT
  USING (public.is_sales_hub_admin());

CREATE POLICY "users_admin_update_all"
  ON public.users FOR UPDATE
  USING (public.is_sales_hub_admin());

DROP POLICY IF EXISTS "backtests_admin_select_all" ON public.backtests;

CREATE POLICY "backtests_admin_select_all"
  ON public.backtests FOR SELECT
  USING (public.is_sales_hub_admin());

DROP POLICY IF EXISTS "storage_admin_all" ON storage.objects;

CREATE POLICY "storage_admin_all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'backtest-files' AND
    public.is_sales_hub_admin()
  );
