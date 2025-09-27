-- Script MÍNIMO para agregar campo 'tipo' a categorías
-- Este script solo agrega la columna y no crea datos

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
        
        RAISE NOTICE 'Columna "tipo" agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna "tipo" ya existe';
    END IF;
END $$;

-- 2. Verificar la estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'categorias_financieras' 
ORDER BY ordinal_position;

-- 3. Mostrar categorías existentes (si las hay)
SELECT 
    id,
    usuario_id,
    nombre,
    color,
    tipo,
    created_at
FROM categorias_financieras 
ORDER BY created_at DESC
LIMIT 10;



