-- ========================================
-- ARREGLAR RLS PARA ventas_historico - SIN ROLES
-- ========================================

-- Habilitar RLS en la tabla
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- ========================================

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

-- ========================================
-- CREAR POLÍTICAS SIMPLES Y FUNCIONALES
-- ========================================

-- Política 1: LEER (SELECT) - Todos los usuarios autenticados pueden leer
CREATE POLICY "Todos pueden LEER ventas_historico." ON ventas_historico
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política 2: CREAR (INSERT) - Solo tu email puede crear
CREATE POLICY "Solo tu email puede CREAR ventas_historico." ON ventas_historico
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

-- Política 3: ACTUALIZAR (UPDATE) - Solo tu email puede actualizar
CREATE POLICY "Solo tu email puede ACTUALIZAR ventas_historico." ON ventas_historico
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    ) WITH CHECK (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

-- Política 4: ELIMINAR (DELETE) - Solo tu email puede eliminar
CREATE POLICY "Solo tu email puede ELIMINAR ventas_historico." ON ventas_historico
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

-- ========================================
-- VERIFICAR POLÍTICAS
-- ========================================

-- Verificar políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'ventas_historico'; 