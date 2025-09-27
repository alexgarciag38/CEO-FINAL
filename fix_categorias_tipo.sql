-- Script para asegurar que las categorías tengan el campo 'tipo'
-- y agregar categorías de ejemplo para Ingreso y Egreso

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

-- 2. Crear categorías de ejemplo para Egreso (si no existen)
-- NOTA: Necesitas reemplazar 'TU_USER_ID_AQUI' con tu ID de usuario real
INSERT INTO categorias_financieras (usuario_id, nombre, color, tipo) 
SELECT * FROM (VALUES
('TU_USER_ID_AQUI', 'Alimentación', '#EF4444', 'Egreso'),
('TU_USER_ID_AQUI', 'Transporte', '#3B82F6', 'Egreso'),
('TU_USER_ID_AQUI', 'Servicios Públicos', '#10B981', 'Egreso'),
('TU_USER_ID_AQUI', 'Entretenimiento', '#F59E0B', 'Egreso'),
('TU_USER_ID_AQUI', 'Salud', '#8B5CF6', 'Egreso'),
('TU_USER_ID_AQUI', 'Educación', '#06B6D4', 'Egreso'),
('TU_USER_ID_AQUI', 'Tecnología', '#84CC16', 'Egreso'),
('TU_USER_ID_AQUI', 'Hogar', '#EC4899', 'Egreso'),
('TU_USER_ID_AQUI', 'Ropa', '#F97316', 'Egreso'),
('TU_USER_ID_AQUI', 'Deportes', '#6366F1', 'Egreso')
) AS v(usuario_id, nombre, color, tipo)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_financieras c 
    WHERE c.nombre = v.nombre AND c.tipo = v.tipo AND c.usuario_id = v.usuario_id
);

-- 3. Crear categorías de ejemplo para Ingreso (si no existen)
INSERT INTO categorias_financieras (usuario_id, nombre, color, tipo) 
SELECT * FROM (VALUES
('TU_USER_ID_AQUI', 'Ventas', '#10B981', 'Ingreso'),
('TU_USER_ID_AQUI', 'Servicios Profesionales', '#3B82F6', 'Ingreso'),
('TU_USER_ID_AQUI', 'Inversiones', '#8B5CF6', 'Ingreso'),
('TU_USER_ID_AQUI', 'Salario', '#06B6D4', 'Ingreso'),
('TU_USER_ID_AQUI', 'Bonificaciones', '#F59E0B', 'Ingreso'),
('TU_USER_ID_AQUI', 'Comisiones', '#EF4444', 'Ingreso'),
('TU_USER_ID_AQUI', 'Alquileres', '#84CC16', 'Ingreso'),
('TU_USER_ID_AQUI', 'Intereses', '#6366F1', 'Ingreso'),
('TU_USER_ID_AQUI', 'Reembolsos', '#EC4899', 'Ingreso'),
('TU_USER_ID_AQUI', 'Otros Ingresos', '#F97316', 'Ingreso')
) AS v(usuario_id, nombre, color, tipo)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias_financieras c 
    WHERE c.nombre = v.nombre AND c.tipo = v.tipo AND c.usuario_id = v.usuario_id
);

-- 4. Crear subcategorías de ejemplo para Egreso
INSERT INTO subcategorias_financieras (nombre, color, categoria_id) 
SELECT * FROM (VALUES
-- Alimentación
('Supermercado', '#EF4444', (SELECT id FROM categorias_financieras WHERE nombre = 'Alimentación' AND tipo = 'Egreso')),
('Restaurantes', '#EF4444', (SELECT id FROM categorias_financieras WHERE nombre = 'Alimentación' AND tipo = 'Egreso')),
('Bebidas', '#EF4444', (SELECT id FROM categorias_financieras WHERE nombre = 'Alimentación' AND tipo = 'Egreso')),

-- Transporte
('Gasolina', '#3B82F6', (SELECT id FROM categorias_financieras WHERE nombre = 'Transporte' AND tipo = 'Egreso')),
('Transporte Público', '#3B82F6', (SELECT id FROM categorias_financieras WHERE nombre = 'Transporte' AND tipo = 'Egreso')),
('Mantenimiento', '#3B82F6', (SELECT id FROM categorias_financieras WHERE nombre = 'Transporte' AND tipo = 'Egreso')),

-- Servicios Públicos
('Luz', '#10B981', (SELECT id FROM categorias_financieras WHERE nombre = 'Servicios Públicos' AND tipo = 'Egreso')),
('Agua', '#10B981', (SELECT id FROM categorias_financieras WHERE nombre = 'Servicios Públicos' AND tipo = 'Egreso')),
('Internet', '#10B981', (SELECT id FROM categorias_financieras WHERE nombre = 'Servicios Públicos' AND tipo = 'Egreso'))
) AS v(nombre, color, categoria_id)
WHERE NOT EXISTS (
    SELECT 1 FROM subcategorias_financieras s 
    WHERE s.nombre = v.nombre
);

-- 5. Crear subcategorías de ejemplo para Ingreso
INSERT INTO subcategorias_financieras (nombre, color, categoria_id) 
SELECT * FROM (VALUES
-- Ventas
('Productos', '#10B981', (SELECT id FROM categorias_financieras WHERE nombre = 'Ventas' AND tipo = 'Ingreso')),
('Servicios', '#10B981', (SELECT id FROM categorias_financieras WHERE nombre = 'Ventas' AND tipo = 'Ingreso')),

-- Servicios Profesionales
('Consultoría', '#3B82F6', (SELECT id FROM categorias_financieras WHERE nombre = 'Servicios Profesionales' AND tipo = 'Ingreso')),
('Freelance', '#3B82F6', (SELECT id FROM categorias_financieras WHERE nombre = 'Servicios Profesionales' AND tipo = 'Ingreso')),

-- Salario
('Nómina', '#06B6D4', (SELECT id FROM categorias_financieras WHERE nombre = 'Salario' AND tipo = 'Ingreso')),
('Horas Extra', '#06B6D4', (SELECT id FROM categorias_financieras WHERE nombre = 'Salario' AND tipo = 'Ingreso'))
) AS v(nombre, color, categoria_id)
WHERE NOT EXISTS (
    SELECT 1 FROM subcategorias_financieras s 
    WHERE s.nombre = v.nombre
);

-- 6. Verificar que todo se creó correctamente
SELECT 
    c.nombre as categoria,
    c.tipo,
    c.color,
    COUNT(s.id) as subcategorias_count
FROM categorias_financieras c
LEFT JOIN subcategorias_financieras s ON s.categoria_id = c.id
GROUP BY c.id, c.nombre, c.tipo, c.color
ORDER BY c.tipo, c.nombre;
