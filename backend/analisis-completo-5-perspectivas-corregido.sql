-- ========================================
-- ANÁLISIS COMPLETO DESDE 5 PERSPECTIVAS (CORREGIDO)
-- ========================================

-- PERSPECTIVA 1: VERIFICAR SI EL ROL "admin" EXISTE REALMENTE
SELECT 
    'PERSPECTIVA 1: ROLES EXISTENTES' as analisis,
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb
FROM pg_roles 
WHERE rolname IN ('admin', 'authenticated', 'anon', 'service_role', 'postgres')
ORDER BY rolname;

-- PERSPECTIVA 2: BUSCAR TODAS LAS REFERENCIAS A "admin" EN LA BASE DE DATOS
SELECT 
    'PERSPECTIVA 2: REFERENCIAS A ADMIN' as analisis,
    'POLÍTICAS' as tipo,
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

UNION ALL

SELECT 
    'PERSPECTIVA 2: REFERENCIAS A ADMIN' as analisis,
    'FUNCIONES' as tipo,
    'public' as schemaname,
    proname as tablename,
    'FUNCION' as policyname,
    prosrc as qual,
    '' as with_check
FROM pg_proc 
WHERE prosrc ILIKE '%admin%'

UNION ALL

SELECT 
    'PERSPECTIVA 2: REFERENCIAS A ADMIN' as analisis,
    'VISTAS' as tipo,
    schemaname,
    viewname as tablename,
    'VISTA' as policyname,
    definition as qual,
    '' as with_check
FROM pg_views 
WHERE definition ILIKE '%admin%'

ORDER BY tipo, tablename;

-- PERSPECTIVA 3: VERIFICAR EL ESTADO ACTUAL DE LAS POLÍTICAS
SELECT 
    'PERSPECTIVA 3: ESTADO ACTUAL DE POLÍTICAS' as analisis,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- PERSPECTIVA 4: VERIFICAR SI HAY CONFLICTOS CON FUNCIONES DE SUPABASE
SELECT 
    'PERSPECTIVA 4: FUNCIONES DE SUPABASE' as analisis,
    proname as funcion,
    prosrc as codigo
FROM pg_proc 
WHERE 
    proname IN ('role', 'auth.role', 'auth.jwt') OR
    prosrc ILIKE '%auth.role%' OR
    prosrc ILIKE '%auth.jwt%'
ORDER BY proname;

-- PERSPECTIVA 5: VERIFICAR EL ESTADO DE RLS EN LAS TABLAS
SELECT 
    'PERSPECTIVA 5: ESTADO RLS' as analisis,
    schemaname,
    tablename,
    relrowsecurity as rls_habilitado,
    relforcerowsecurity as rls_forzado
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public' 
AND tablename IN ('ventas_historico', 'conversaciones_ia', 'usuarios')
ORDER BY tablename;

-- PERSPECTIVA 6: VERIFICAR SI HAY CONFLICTOS EN EDGE FUNCTIONS
SELECT 
    'PERSPECTIVA 6: EDGE FUNCTIONS' as analisis,
    name as funcion,
    config as configuracion
FROM supabase_functions.hooks 
WHERE config::text ILIKE '%admin%' OR config::text ILIKE '%role%'; 