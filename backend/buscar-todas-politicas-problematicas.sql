-- ========================================
-- BUSCAR TODAS LAS POLÍTICAS PROBLEMÁTICAS
-- ========================================

-- 1. Buscar políticas que contengan "admin" en cualquier parte
SELECT 
    'POLÍTICAS CON ADMIN' as tipo,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE 
    policyname ILIKE '%admin%' OR
    qual ILIKE '%admin%' OR
    with_check ILIKE '%admin%'
ORDER BY tablename, policyname;

-- 2. Buscar políticas que usen auth.role() o auth.jwt()
SELECT 
    'POLÍTICAS CON AUTH' as tipo,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE 
    qual ILIKE '%auth.role%' OR
    qual ILIKE '%auth.jwt%' OR
    with_check ILIKE '%auth.role%' OR
    with_check ILIKE '%auth.jwt%'
ORDER BY tablename, policyname;

-- 3. Mostrar TODAS las políticas existentes
SELECT 
    'TODAS LAS POLÍTICAS' as tipo,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
ORDER BY tablename, policyname;

-- 4. Verificar si hay funciones que usen roles
SELECT 
    'FUNCIONES CON ROLES' as tipo,
    proname as funcion,
    prosrc as codigo
FROM pg_proc 
WHERE prosrc ILIKE '%admin%' OR prosrc ILIKE '%role%'
ORDER BY proname; 