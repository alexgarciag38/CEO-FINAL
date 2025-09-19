-- ========================================
-- SOLUCIÓN FINAL: RLS CON TU EMAIL
-- ========================================

-- Habilitar RLS en la tabla
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ELIMINAR TODAS LAS POLÍTICAS EXISTENTES (INCLUYENDO LAS PROBLEMÁTICAS)
-- ========================================

-- Eliminar políticas que buscan roles que no existen
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

-- Eliminar CUALQUIER otra política que pueda existir
DROP POLICY IF EXISTS "solo_admin_ventas_historico" ON ventas_historico;
DROP POLICY IF EXISTS "admin_read_ventas" ON ventas_historico;
DROP POLICY IF EXISTS "admin_write_ventas" ON ventas_historico;
DROP POLICY IF EXISTS "solo_admin_puede_leer" ON ventas_historico;
DROP POLICY IF EXISTS "solo_admin_puede_crear" ON ventas_historico;
DROP POLICY IF EXISTS "authenticated_read_ventas" ON ventas_historico;
DROP POLICY IF EXISTS "authenticated_write_ventas" ON ventas_historico;

-- ========================================
-- CREAR SOLO LAS POLÍTICAS QUE FUNCIONAN
-- ========================================

-- Política 1: LEER (SELECT) - Todos los usuarios autenticados pueden leer
CREATE POLICY "lectura_ventas_historico" ON ventas_historico
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política 2: CREAR (INSERT) - Solo tu email puede crear
CREATE POLICY "crear_ventas_historico" ON ventas_historico
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

-- Política 3: ACTUALIZAR (UPDATE) - Solo tu email puede actualizar
CREATE POLICY "actualizar_ventas_historico" ON ventas_historico
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    ) WITH CHECK (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

-- Política 4: ELIMINAR (DELETE) - Solo tu email puede eliminar
CREATE POLICY "eliminar_ventas_historico" ON ventas_historico
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'alexgarciag38@gmail.com'
    );

-- ========================================
-- VERIFICAR QUE TODO FUNCIONE
-- ========================================

-- Verificar políticas creadas
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'ventas_historico'
ORDER BY policyname; 