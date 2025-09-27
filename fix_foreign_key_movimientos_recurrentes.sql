-- Script SQL para establecer la relación de clave foránea entre movimientos_recurrentes y categorias_financieras
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Verificar si la tabla movimientos_recurrentes existe, si no la creamos
CREATE TABLE IF NOT EXISTS public.movimientos_recurrentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso','Egreso')),
    categoria_id UUID,
    subcategoria_id UUID,
    proveedor_cliente TEXT,
    descripcion TEXT,
    monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
    forma_pago TEXT,
    fiscal BOOLEAN DEFAULT FALSE,
    frecuencia TEXT NOT NULL CHECK (frecuencia IN ('Diaria','Semanal','Quincenal','Mensual','Anual')),
    dia_especifico INTEGER NOT NULL CHECK (dia_especifico >= 1 AND dia_especifico <= 31),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    numero_repeticiones INTEGER,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Añadir la columna categoria_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_recurrentes' 
        AND column_name = 'categoria_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes 
        ADD COLUMN categoria_id UUID;
    END IF;
END $$;

-- 3. Añadir la columna subcategoria_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_recurrentes' 
        AND column_name = 'subcategoria_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes 
        ADD COLUMN subcategoria_id UUID;
    END IF;
END $$;

-- 4. Eliminar restricciones existentes si existen (para evitar conflictos)
DO $$ 
BEGIN
    -- Eliminar FK de categoria_id si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_movimientos_recurrentes_categoria'
        AND table_name = 'movimientos_recurrentes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes
        DROP CONSTRAINT fk_movimientos_recurrentes_categoria;
    END IF;
    
    -- Eliminar FK de subcategoria_id si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_movimientos_recurrentes_subcategoria'
        AND table_name = 'movimientos_recurrentes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes
        DROP CONSTRAINT fk_movimientos_recurrentes_subcategoria;
    END IF;
END $$;

-- 5. Añadir la clave foránea para categoria_id
ALTER TABLE public.movimientos_recurrentes
ADD CONSTRAINT fk_movimientos_recurrentes_categoria
FOREIGN KEY (categoria_id)
REFERENCES public.categorias_financieras(id)
ON DELETE RESTRICT;

-- 6. Añadir la clave foránea para subcategoria_id
ALTER TABLE public.movimientos_recurrentes
ADD CONSTRAINT fk_movimientos_recurrentes_subcategoria
FOREIGN KEY (subcategoria_id)
REFERENCES public.subcategorias_financieras(id)
ON DELETE RESTRICT;

-- 7. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_usuario_id 
ON public.movimientos_recurrentes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_categoria_id 
ON public.movimientos_recurrentes(categoria_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_subcategoria_id 
ON public.movimientos_recurrentes(subcategoria_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_activa 
ON public.movimientos_recurrentes(activa);

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE public.movimientos_recurrentes ENABLE ROW LEVEL SECURITY;

-- 9. Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view their own recurrent movements" ON public.movimientos_recurrentes;
DROP POLICY IF EXISTS "Users can insert their own recurrent movements" ON public.movimientos_recurrentes;
DROP POLICY IF EXISTS "Users can update their own recurrent movements" ON public.movimientos_recurrentes;
DROP POLICY IF EXISTS "Users can delete their own recurrent movements" ON public.movimientos_recurrentes;

-- 10. Crear políticas RLS para que los usuarios solo vean sus propios movimientos recurrentes
CREATE POLICY "Users can view their own recurrent movements" ON public.movimientos_recurrentes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own recurrent movements" ON public.movimientos_recurrentes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own recurrent movements" ON public.movimientos_recurrentes
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own recurrent movements" ON public.movimientos_recurrentes
    FOR DELETE USING (auth.uid() = usuario_id);

-- 11. Verificar que las claves foráneas se crearon correctamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='movimientos_recurrentes';




