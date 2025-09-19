-- ========================================
-- BUSCAR TODAS LAS REFERENCIAS AL ROL "admin"
-- ========================================

-- 1. BUSCAR EN TODAS LAS FUNCIONES
SELECT 
    'FUNCIONES' as tipo,
    proname as nombre,
    prosrc as codigo
FROM pg_proc 
WHERE prosrc ILIKE '%admin%' OR prosrc ILIKE '%role%'
ORDER BY proname;

-- 2. BUSCAR EN TODAS LAS VISTAS
SELECT 
    'VISTAS' as tipo,
    viewname as nombre,
    definition as codigo
FROM pg_views 
WHERE definition ILIKE '%admin%' OR definition ILIKE '%role%'
ORDER BY viewname;

-- 3. BUSCAR EN TODOS LOS TRIGGERS
SELECT 
    'TRIGGERS' as tipo,
    tgname as nombre,
    tgdef as codigo
FROM pg_trigger 
WHERE tgdef ILIKE '%admin%' OR tgdef ILIKE '%role%'
ORDER BY tgname;

-- 4. BUSCAR EN TODAS LAS POLÍTICAS (DETALLADO)
SELECT 
    'POLÍTICAS' as tipo,
    schemaname || '.' || tablename as tabla,
    policyname as nombre,
    qual as condicion,
    with_check as check_condicion
FROM pg_policies 
WHERE 
    policyname ILIKE '%admin%' OR
    qual ILIKE '%admin%' OR
    with_check ILIKE '%admin%' OR
    policyname ILIKE '%role%' OR
    qual ILIKE '%role%' OR
    with_check ILIKE '%role%'
ORDER BY tablename, policyname;

-- 5. BUSCAR EN TODAS LAS TABLAS DE SISTEMA
SELECT 
    'SISTEMA' as tipo,
    'pg_roles' as tabla,
    rolname as nombre,
    'ROL' as tipo_objeto
FROM pg_roles 
WHERE rolname ILIKE '%admin%' OR rolname ILIKE '%role%'

UNION ALL

SELECT 
    'SISTEMA' as tipo,
    'pg_authid' as tabla,
    rolname as nombre,
    'AUTH' as tipo_objeto
FROM pg_authid 
WHERE rolname ILIKE '%admin%' OR rolname ILIKE '%role%'

ORDER BY nombre;

-- 6. VERIFICAR SI HAY CONFLICTOS EN EDGE FUNCTIONS
SELECT 
    'EDGE FUNCTIONS' as tipo,
    name as nombre,
    'CONFIG' as tipo_objeto,
    config::text as codigo
FROM supabase_functions.hooks 
WHERE config::text ILIKE '%admin%' OR config::text ILIKE '%role%'

UNION ALL

SELECT 
    'EDGE FUNCTIONS' as tipo,
    name as nombre,
    'IMPORTS' as tipo_objeto,
    imports::text as codigo
FROM supabase_functions.hooks 
WHERE imports::text ILIKE '%admin%' OR imports::text ILIKE '%role%'

ORDER BY nombre; 