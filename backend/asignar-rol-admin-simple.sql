-- ========================================
-- ASIGNAR ROL ADMIN DE FORMA SIMPLE
-- ========================================

-- 1. VERIFICAR SI EL ROL ADMIN EXISTE
SELECT 
    'VERIFICAR ROL ADMIN' as info,
    rolname,
    rolsuper,
    rolinherit
FROM pg_roles 
WHERE rolname = 'admin';

-- 2. ASIGNAR EL ROL ADMIN A TU USUARIO EN LOS METADATOS
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
)
WHERE email = 'alexgarciag38@gmail.com';

-- 3. VERIFICAR QUE SE ASIGNÓ CORRECTAMENTE
SELECT 
    'USUARIO ACTUALIZADO' as info,
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE email = 'alexgarciag38@gmail.com';

-- 4. CREAR UNA FUNCIÓN PARA VERIFICAR EL ROL
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
    )::text;
$$; 