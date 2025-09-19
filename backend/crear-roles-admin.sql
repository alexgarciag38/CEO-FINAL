-- ========================================
-- CREAR ROLES Y ASIGNAR PERMISOS
-- ========================================

-- 1. CREAR EL ROL "admin"
DO $$
BEGIN
    -- Crear el rol admin si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin;
        RAISE NOTICE 'Rol "admin" creado exitosamente';
    ELSE
        RAISE NOTICE 'El rol "admin" ya existe';
    END IF;
END $$;

-- 2. ASIGNAR PERMISOS AL ROL ADMIN
GRANT USAGE ON SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- 3. ASIGNAR EL ROL ADMIN A TU USUARIO
-- Primero necesitamos obtener tu user_id
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Buscar tu usuario por email
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'alexgarciag38@gmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Asignar el rol admin a tu usuario
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"admin"'
        )
        WHERE id = user_id;
        
        RAISE NOTICE 'Rol "admin" asignado al usuario %', 'alexgarciag38@gmail.com';
    ELSE
        RAISE NOTICE 'Usuario no encontrado: %', 'alexgarciag38@gmail.com';
    END IF;
END $$;

-- 4. VERIFICAR QUE TODO ESTÉ CORRECTO
SELECT 
    'ROLES CREADOS' as info,
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb
FROM pg_roles 
WHERE rolname IN ('admin', 'authenticated', 'anon', 'service_role', 'postgres')
ORDER BY rolname;

-- 5. VERIFICAR TU USUARIO
SELECT 
    'TU USUARIO' as info,
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE email = 'alexgarciag38@gmail.com'; 