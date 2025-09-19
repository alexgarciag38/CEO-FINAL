-- ========================================
-- CONFIGURAR RLS PARA ventas_historico - SOLO ADMIN PUEDE GUARDAR
-- ========================================

-- Habilitar RLS en la tabla
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ELIMINAR POLÍTICAS EXISTENTES
-- ========================================

DROP POLICY IF EXISTS "Los usuarios pueden LEER ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Los usuarios pueden CREAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Los usuarios pueden ACTUALIZAR ventas_historico." ON ventas_historico;
DROP POLICY IF EXISTS "Los usuarios pueden ELIMINAR ventas_historico." ON ventas_historico;

-- ========================================
-- CREAR POLÍTICAS DE SEGURIDAD
-- ========================================

-- Política 1: LEER (SELECT) - Todos los usuarios autenticados pueden leer
CREATE POLICY "Todos pueden LEER ventas_historico." ON ventas_historico
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política 2: CREAR (INSERT) - Solo admin puede crear
CREATE POLICY "Solo admin puede CREAR ventas_historico." ON ventas_historico
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'admin@centermanu.com' OR 
        auth.jwt() ->> 'email' = 'usuario@centermanu.com' OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Política 3: ACTUALIZAR (UPDATE) - Solo admin puede actualizar
CREATE POLICY "Solo admin puede ACTUALIZAR ventas_historico." ON ventas_historico
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'admin@centermanu.com' OR 
        auth.jwt() ->> 'email' = 'usuario@centermanu.com' OR
        auth.jwt() ->> 'role' = 'admin'
    ) WITH CHECK (
        auth.jwt() ->> 'email' = 'admin@centermanu.com' OR 
        auth.jwt() ->> 'email' = 'usuario@centermanu.com' OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Política 4: ELIMINAR (DELETE) - Solo admin puede eliminar
CREATE POLICY "Solo admin puede ELIMINAR ventas_historico." ON ventas_historico
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'admin@centermanu.com' OR 
        auth.jwt() ->> 'email' = 'usuario@centermanu.com' OR
        auth.jwt() ->> 'role' = 'admin'
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
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ventas_historico'; 