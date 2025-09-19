-- ========================================
-- ARREGLAR TODAS LAS POLÍTICAS RLS PROBLEMÁTICAS
-- ========================================

-- ========================================
-- 1. ARREGLAR ventas_historico
-- ========================================

-- Habilitar RLS
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden LEER ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Los usuarios pueden CREAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Los usuarios pueden ACTUALIZAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Los usuarios pueden ELIMINAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Todos pueden LEER ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Solo admin puede CREAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Solo admin puede ACTUALIZAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Solo admin puede ELIMINAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Solo tu email puede CREAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Solo tu email puede ACTUALIZAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Solo tu email puede ELIMINAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "solo_admin_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "admin_read_ventas" ON ventas_historico;
DROP POLICY IF EXISTS "admin_write_ventas" ON ventas_historico;
DROP POLICY IF EXISTS "solo_admin_puede_leer" ON ventas_historico;
DROP POLICY IF EXISTS "solo_admin_puede_crear" ON ventas_historico;
DROP POLICY IF EXISTS "authenticated_read_ventas" ON ventas_historico;
DROP POLICY IF EXISTS "authenticated_write_ventas" ON ventas_historico;
DROP POLICY IF EXISTS "lectura_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "crear_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "actualizar_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "eliminar_ventas_historico" ON ventas_historico;

-- Crear políticas correctas para ventas_historico
CREATE POLICY "lectura_ventas_historico" ON ventas_historico
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "crear_ventas_historico" ON ventas_historico
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

CREATE POLICY "actualizar_ventas_historico" ON ventas_historico
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    ) WITH CHECK (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

CREATE POLICY "eliminar_ventas_historico" ON ventas_historico
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

-- ========================================
-- 2. ARREGLAR conversaciones_ia
-- ========================================

-- Habilitar RLS
ALTER TABLE conversaciones_ia ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden LEER sus propias conversaciones." ON conversaciones_ia;
DROP POLICY IF EXISTS "Los usuarios pueden CREAR sus propias conversaciones." ON conversaciones_ia;
DROP POLICY IF EXISTS "Los usuarios pueden ACTUALIZAR sus propias conversaciones." ON conversaciones_ia;

-- Crear políticas correctas para conversaciones_ia
CREATE POLICY "lectura_conversaciones_ia" ON conversaciones_ia
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "crear_conversaciones_ia" ON conversaciones_ia
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "actualizar_conversaciones_ia" ON conversaciones_ia
    FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

-- ========================================
-- 3. ARREGLAR usuarios (si existe)
-- ========================================

-- Verificar si la tabla usuarios existe y tiene RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        -- Habilitar RLS
        EXECUTE 'ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY';
        
        -- Eliminar políticas problemáticas
        EXECUTE 'DROP POLICY IF EXISTS "Solo admins y managers pueden insertar datos históricos" ON usuarios';
        EXECUTE 'DROP POLICY IF EXISTS "Solo admins y managers pueden actualizar datos históricos" ON usuarios';
        EXECUTE 'DROP POLICY IF EXISTS "Solo admins pueden eliminar datos históricos" ON usuarios';
        
        -- Crear políticas simples
        EXECUTE 'CREATE POLICY "lectura_usuarios" ON usuarios FOR SELECT USING (auth.role() = ''authenticated'')';
        EXECUTE 'CREATE POLICY "crear_usuarios" ON usuarios FOR INSERT WITH CHECK (auth.jwt() ->> ''email'' = ''alexgarciag38@gmail.com'')';
        EXECUTE 'CREATE POLICY "actualizar_usuarios" ON usuarios FOR UPDATE USING (auth.jwt() ->> ''email'' = ''alexgarciag38@gmail.com'') WITH CHECK (auth.jwt() ->> ''email'' = ''alexgarciag38@gmail.com'')';
    END IF;
END $$;

-- ========================================
-- VERIFICAR TODAS LAS POLÍTICAS
-- ========================================

-- Verificar políticas en ventas_historico
SELECT 'ventas_historico' as tabla, policyname, cmd FROM pg_policies WHERE tablename = 'ventas_historico'
UNION ALL
-- Verificar políticas en conversaciones_ia
SELECT 'conversaciones_ia' as tabla, policyname, cmd FROM pg_policies WHERE tablename = 'conversaciones_ia'
UNION ALL
-- Verificar políticas en usuarios (si existe)
SELECT 'usuarios' as tabla, policyname, cmd FROM pg_policies WHERE tablename = 'usuarios'
ORDER BY tabla, policyname; 