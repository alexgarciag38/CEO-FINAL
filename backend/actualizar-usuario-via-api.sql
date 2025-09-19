-- ========================================
-- ACTUALIZAR USUARIO VÍA API DE SUPABASE
-- ========================================

-- Esta es la forma correcta de actualizar metadatos de usuario
-- usando la función admin.update_user_metadata()

-- 1. VERIFICAR SI LA FUNCIÓN EXISTE
SELECT 
    'FUNCIONES DISPONIBLES' as info,
    proname as funcion,
    prosrc as codigo
FROM pg_proc 
WHERE proname LIKE '%user%' OR proname LIKE '%metadata%'
ORDER BY proname;

-- 2. INTENTAR ACTUALIZAR USUARIO (si la función existe)
DO $$
BEGIN
    -- Intentar usar la función de Supabase para actualizar metadatos
    PERFORM auth.update_user_metadata(
        (SELECT id FROM auth.users WHERE email = 'alexgarciag38@gmail.com'),
        '{"role": "admin"}'::jsonb
    );
    RAISE NOTICE 'Usuario actualizado exitosamente';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error actualizando usuario: %', SQLERRM;
END $$;

-- 3. VERIFICAR EL ESTADO ACTUAL
SELECT 
    'ESTADO ACTUAL' as info,
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
WHERE email = 'alexgarciag38@gmail.com'; 