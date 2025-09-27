-- Script para agregar timestamps de auditoría a las tablas de movimientos
-- Este script es seguro y no rompe datos existentes

-- 1. Agregar columnas created_at y updated_at a movimientos_financieros
DO $$ 
BEGIN
    -- Agregar created_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_financieros' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_financieros 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Agregar updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_financieros' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_financieros 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. Agregar columnas created_at y updated_at a movimientos_recurrentes
DO $$ 
BEGIN
    -- Agregar created_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_recurrentes' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Agregar updated_at si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_recurrentes' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear trigger para movimientos_financieros
DO $$ 
BEGIN
    -- Eliminar trigger si existe
    DROP TRIGGER IF EXISTS update_movimientos_financieros_updated_at ON public.movimientos_financieros;
    
    -- Crear trigger
    CREATE TRIGGER update_movimientos_financieros_updated_at
        BEFORE UPDATE ON public.movimientos_financieros
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- 5. Crear trigger para movimientos_recurrentes
DO $$ 
BEGIN
    -- Eliminar trigger si existe
    DROP TRIGGER IF EXISTS update_movimientos_recurrentes_updated_at ON public.movimientos_recurrentes;
    
    -- Crear trigger
    CREATE TRIGGER update_movimientos_recurrentes_updated_at
        BEFORE UPDATE ON public.movimientos_recurrentes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- 6. Actualizar registros existentes que tengan NULL en created_at
UPDATE public.movimientos_financieros 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE public.movimientos_financieros 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

UPDATE public.movimientos_recurrentes 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE public.movimientos_recurrentes 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- 7. Crear índices para mejorar rendimiento de consultas por timestamps
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_created_at 
ON public.movimientos_financieros(created_at);

CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_updated_at 
ON public.movimientos_financieros(updated_at);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_created_at 
ON public.movimientos_recurrentes(created_at);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_updated_at 
ON public.movimientos_recurrentes(updated_at);

-- 8. Verificar que las columnas se crearon correctamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('movimientos_financieros', 'movimientos_recurrentes')
AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;




