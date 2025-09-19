-- ========================================
-- ANÁLISIS SIMPLIFICADO FINAL
-- ========================================

-- 1. VERIFICAR SI EL ROL "admin" EXISTE
SELECT 
    '1. ROLES EXISTENTES' as analisis,
    rolname,
    rolsuper,
    rolinherit
FROM pg_roles 
WHERE rolname IN ('admin', 'authenticated', 'anon', 'service_role', 'postgres')
ORDER BY rolname;

-- 2. BUSCAR POLÍTICAS CON "admin"
SELECT 
    '2. POLÍTICAS CON ADMIN' as analisis,
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
ORDER BY tablename, policyname;

-- 3. MOSTRAR TODAS LAS POLÍTICAS ACTUALES
SELECT 
    '3. TODAS LAS POLÍTICAS' as analisis,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFICAR FUNCIONES QUE USAN "role"
SELECT 
    '4. FUNCIONES CON ROLE' as analisis,
    proname as funcion,
    prosrc as codigo
FROM pg_proc 
WHERE 
    proname = 'role' OR
    prosrc ILIKE '%auth.role%' OR
    prosrc ILIKE '%auth.jwt%'
ORDER BY proname;

-- 5. VERIFICAR ESTADO RLS
SELECT 
    '5. ESTADO RLS' as analisis,
    schemaname,
    tablename,
    relrowsecurity as rls_habilitado
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public' 
AND tablename IN ('ventas_historico', 'conversaciones_ia', 'usuarios')
ORDER BY tablename; 