-- Script para crear categorías con tipo - VERSIÓN SIMPLE
-- Este script funciona sin autenticación en el SQL Editor

-- 1. Agregar columna 'tipo' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categorias_financieras' 
        AND column_name = 'tipo'
    ) THEN
        ALTER TABLE categorias_financieras 
        ADD COLUMN tipo VARCHAR(20) DEFAULT 'Egreso' NOT NULL;
    END IF;
END $$;

-- 2. Obtener el primer usuario_id disponible (para testing)
-- En producción, esto debería ser el usuario real
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Intentar obtener un usuario existente
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Si no hay usuarios, crear uno de prueba (solo para desarrollo)
    IF test_user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, last_sign_in_at, confirmation_sent_at, recovery_sent_at, email_change_sent_at, phone_change, phone_change_token, phone_change_sent_at, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous)
        VALUES (
            gen_random_uuid(),
            'test@example.com',
            crypt('password123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            'authenticated',
            'authenticated',
            '',
            '',
            '',
            '',
            now(),
            now(),
            now(),
            now(),
            '',
            '',
            now(),
            0,
            null,
            '',
            now(),
            false,
            null,
            false
        ) RETURNING id INTO test_user_id;
    END IF;

    -- 3. Crear categorías de ejemplo para Egreso
    INSERT INTO categorias_financieras (usuario_id, nombre, color, tipo) 
    SELECT 
        test_user_id,
        v.nombre,
        v.color,
        v.tipo
    FROM (VALUES
    ('Alimentación', '#EF4444', 'Egreso'),
    ('Transporte', '#3B82F6', 'Egreso'),
    ('Servicios Públicos', '#10B981', 'Egreso'),
    ('Entretenimiento', '#F59E0B', 'Egreso'),
    ('Salud', '#8B5CF6', 'Egreso'),
    ('Educación', '#06B6D4', 'Egreso'),
    ('Tecnología', '#84CC16', 'Egreso'),
    ('Hogar', '#EC4899', 'Egreso'),
    ('Ropa', '#F97316', 'Egreso'),
    ('Deportes', '#6366F1', 'Egreso')
    ) AS v(nombre, color, tipo)
    WHERE NOT EXISTS (
        SELECT 1 FROM categorias_financieras c 
        WHERE c.nombre = v.nombre 
        AND c.tipo = v.tipo 
        AND c.usuario_id = test_user_id
    );

    -- 4. Crear categorías de ejemplo para Ingreso
    INSERT INTO categorias_financieras (usuario_id, nombre, color, tipo) 
    SELECT 
        test_user_id,
        v.nombre,
        v.color,
        v.tipo
    FROM (VALUES
    ('Ventas', '#10B981', 'Ingreso'),
    ('Servicios Profesionales', '#3B82F6', 'Ingreso'),
    ('Inversiones', '#8B5CF6', 'Ingreso'),
    ('Salario', '#06B6D4', 'Ingreso'),
    ('Bonificaciones', '#F59E0B', 'Ingreso'),
    ('Comisiones', '#EF4444', 'Ingreso'),
    ('Alquileres', '#84CC16', 'Ingreso'),
    ('Intereses', '#6366F1', 'Ingreso'),
    ('Reembolsos', '#EC4899', 'Ingreso'),
    ('Otros Ingresos', '#F97316', 'Ingreso')
    ) AS v(nombre, color, tipo)
    WHERE NOT EXISTS (
        SELECT 1 FROM categorias_financieras c 
        WHERE c.nombre = v.nombre 
        AND c.tipo = v.tipo 
        AND c.usuario_id = test_user_id
    );

    -- 5. Crear subcategorías de ejemplo para Egreso
    INSERT INTO subcategorias_financieras (nombre, color, categoria_id) 
    SELECT 
        v.nombre,
        v.color,
        c.id as categoria_id
    FROM (VALUES
    -- Alimentación
    ('Supermercado', '#EF4444', 'Alimentación'),
    ('Restaurantes', '#EF4444', 'Alimentación'),
    ('Bebidas', '#EF4444', 'Alimentación'),
    
    -- Transporte
    ('Gasolina', '#3B82F6', 'Transporte'),
    ('Transporte Público', '#3B82F6', 'Transporte'),
    ('Mantenimiento', '#3B82F6', 'Transporte'),
    
    -- Servicios Públicos
    ('Luz', '#10B981', 'Servicios Públicos'),
    ('Agua', '#10B981', 'Servicios Públicos'),
    ('Internet', '#10B981', 'Servicios Públicos')
    ) AS v(nombre, color, categoria_nombre)
    JOIN categorias_financieras c ON c.nombre = v.categoria_nombre 
        AND c.tipo = 'Egreso' 
        AND c.usuario_id = test_user_id
    WHERE NOT EXISTS (
        SELECT 1 FROM subcategorias_financieras s 
        WHERE s.nombre = v.nombre
    );

    -- 6. Crear subcategorías de ejemplo para Ingreso
    INSERT INTO subcategorias_financieras (nombre, color, categoria_id) 
    SELECT 
        v.nombre,
        v.color,
        c.id as categoria_id
    FROM (VALUES
    -- Ventas
    ('Productos', '#10B981', 'Ventas'),
    ('Servicios', '#10B981', 'Ventas'),
    
    -- Servicios Profesionales
    ('Consultoría', '#3B82F6', 'Servicios Profesionales'),
    ('Freelance', '#3B82F6', 'Servicios Profesionales'),
    
    -- Salario
    ('Nómina', '#06B6D4', 'Salario'),
    ('Horas Extra', '#06B6D4', 'Salario')
    ) AS v(nombre, color, categoria_nombre)
    JOIN categorias_financieras c ON c.nombre = v.categoria_nombre 
        AND c.tipo = 'Ingreso' 
        AND c.usuario_id = test_user_id
    WHERE NOT EXISTS (
        SELECT 1 FROM subcategorias_financieras s 
        WHERE s.nombre = v.nombre
    );

    -- 7. Mostrar resultado
    RAISE NOTICE 'Categorías creadas para usuario: %', test_user_id;
    
END $$;

-- 8. Verificar que todo se creó correctamente
SELECT 
    c.nombre as categoria,
    c.tipo,
    c.color,
    c.usuario_id,
    COUNT(s.id) as subcategorias_count
FROM categorias_financieras c
LEFT JOIN subcategorias_financieras s ON s.categoria_id = c.id
GROUP BY c.id, c.nombre, c.tipo, c.color, c.usuario_id
ORDER BY c.tipo, c.nombre;



