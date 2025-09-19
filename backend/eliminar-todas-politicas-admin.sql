-- ========================================
-- ELIMINAR TODAS LAS POLÍTICAS QUE BUSCAN ROL "admin"
-- ========================================

-- Encontrar y eliminar TODAS las políticas que contengan "admin" en cualquier tabla
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Buscar todas las políticas que contengan "admin" en el nombre o en la condición
    FOR policy_record IN 
        SELECT 
            schemaname,
            tablename,
            policyname,
            qual,
            with_check
        FROM pg_policies 
        WHERE 
            policyname ILIKE '%admin%' OR
            qual ILIKE '%admin%' OR
            with_check ILIKE '%admin%'
    LOOP
        -- Eliminar la política
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON %s.%s', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
        
        RAISE NOTICE 'Eliminada política: % en tabla %', policy_record.policyname, policy_record.tablename;
    END LOOP;
END $$;

-- ========================================
-- ELIMINAR POLÍTICAS ESPECÍFICAS PROBLEMÁTICAS
-- ========================================

-- Eliminar políticas específicas que sabemos que causan problemas
DROP POLICY IF EXISTS "Solo admins y managers pueden insertar datos históricos" ON usuarios;
DROP POLICY IF EXISTS "Solo admins y managers pueden actualizar datos históricos" ON usuarios;
DROP POLICY IF EXISTS "Solo admins pueden eliminar datos históricos" ON usuarios;

-- ========================================
-- CREAR POLÍTICAS SIMPLES Y FUNCIONALES
-- ========================================

-- Para ventas_historico
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectura_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "crear_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "actualizar_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "eliminar_ventas_historico" ON ventas_historico;

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

DROP POLICY IF EXISTS "lectura_conversaciones_ia" ON conversaciones_ia;
DROP POLICY IF EXISTS "crear_conversaciones_ia" ON conversaciones_ia;
DROP POLICY IF EXISTS "actualizar_conversaciones_ia" ON conversaciones_ia;

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
        
        DROP POLICY IF EXISTS "lectura_usuarios" ON usuarios;
        DROP POLICY IF EXISTS "crear_usuarios" ON usuarios;
        DROP POLICY IF EXISTS "actualizar_usuarios" ON usuarios;
        
        CREATE POLICY "lectura_usuarios" ON usuarios
            FOR SELECT USING (auth.role() = 'authenticated');
        
        CREATE POLICY "crear_usuarios" ON usuarios
            FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com');
        
        CREATE POLICY "actualizar_usuarios" ON usuarios
            FOR UPDATE USING (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com')
            WITH CHECK (auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com');
    END IF;
END $$;

-- ========================================
-- VERIFICAR QUE NO QUEDEN POLÍTICAS CON "admin"
-- ========================================

SELECT 
    'POLÍTICAS RESTANTES' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE 
    policyname ILIKE '%admin%' OR
    qual ILIKE '%admin%' OR
    with_check ILIKE '%admin%'
ORDER BY tablename, policyname; 