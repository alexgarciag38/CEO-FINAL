-- ========================================
-- ELIMINAR TODAS LAS POLÍTICAS Y RECREARLAS CORRECTAMENTE
-- ========================================

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE TODAS LAS TABLAS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Eliminar TODAS las políticas existentes
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON %s.%s', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        RAISE NOTICE 'Eliminada política: % en tabla %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- 2. DESHABILITAR RLS TEMPORALMENTE EN TODAS LAS TABLAS
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('ventas_historico', 'conversaciones_ia', 'usuarios')
    LOOP
        EXECUTE format('ALTER TABLE %s DISABLE ROW LEVEL SECURITY', table_record.tablename);
        RAISE NOTICE 'RLS deshabilitado en: %', table_record.tablename;
    END LOOP;
END $$;

-- 3. HABILITAR RLS Y CREAR POLÍTICAS CORRECTAS

-- Para ventas_historico
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_ventas_historico" ON ventas_historico
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "crear_ventas_historico" ON ventas_historico
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com');

CREATE POLICY "actualizar_ventas_historico" ON ventas_historico
    FOR UPDATE USING (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com');

CREATE POLICY "eliminar_ventas_historico" ON ventas_historico
    FOR DELETE USING (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com');

-- Para conversaciones_ia
ALTER TABLE conversaciones_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_conversaciones_ia" ON conversaciones_ia
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "crear_conversaciones_ia" ON conversaciones_ia
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "actualizar_conversaciones_ia" ON conversaciones_ia
    FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

-- Para usuarios (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "lectura_usuarios" ON usuarios
            FOR SELECT USING (auth.role() = 'authenticated');
        
        CREATE POLICY "crear_usuarios" ON usuarios
            FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com');
        
        CREATE POLICY "actualizar_usuarios" ON usuarios
            FOR UPDATE USING (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com')
            WITH CHECK (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com');
    END IF;
END $$;

-- 4. VERIFICAR QUE TODO ESTÉ CORRECTO
SELECT 
    'POLÍTICAS FINALES' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 