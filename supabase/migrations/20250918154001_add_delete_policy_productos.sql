-- Política DELETE owner-only para productos si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='productos' AND policyname='productos_delete_own'
  ) THEN
    CREATE POLICY productos_delete_own ON public.productos FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;
