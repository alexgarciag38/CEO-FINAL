-- Script para crear categorías con tipo automáticamente
-- Este script obtiene el usuario_id del usuario autenticado automáticamente

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

-- 2. Crear categorías de ejemplo para Egreso (usando auth.uid())
INSERT INTO categorias_financieras (usuario_id, nombre, color, tipo) 
SELECT 
    auth.uid() as usuario_id,
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
    AND c.usuario_id = auth.uid()
);

-- 3. Crear categorías de ejemplo para Ingreso (usando auth.uid())
INSERT INTO categorias_financieras (usuario_id, nombre, color, tipo) 
SELECT 
    auth.uid() as usuario_id,
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
    AND c.usuario_id = auth.uid()
);

-- 4. Crear subcategorías de ejemplo para Egreso
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
    AND c.usuario_id = auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM subcategorias_financieras s 
    WHERE s.nombre = v.nombre
);

-- 5. Crear subcategorías de ejemplo para Ingreso
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
    AND c.usuario_id = auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM subcategorias_financieras s 
    WHERE s.nombre = v.nombre
);

-- 6. Verificar que todo se creó correctamente
SELECT 
    c.nombre as categoria,
    c.tipo,
    c.color,
    c.usuario_id,
    COUNT(s.id) as subcategorias_count
FROM categorias_financieras c
LEFT JOIN subcategorias_financieras s ON s.categoria_id = c.id
WHERE c.usuario_id = auth.uid()
GROUP BY c.id, c.nombre, c.tipo, c.color, c.usuario_id
ORDER BY c.tipo, c.nombre;



