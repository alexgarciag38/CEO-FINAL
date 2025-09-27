-- Verificar si la tabla movimientos_recurrentes existe y tiene la columna categoria_id
-- Si no existe la tabla, la creamos primero
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

-- Añadir la columna categoria_id si no existe
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

-- Añadir la columna subcategoria_id si no existe
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

-- Añadir la clave foránea para categoria_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_movimientos_recurrentes_categoria'
        AND table_name = 'movimientos_recurrentes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes
        ADD CONSTRAINT fk_movimientos_recurrentes_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES public.categorias_financieras(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- Añadir la clave foránea para subcategoria_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_movimientos_recurrentes_subcategoria'
        AND table_name = 'movimientos_recurrentes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes
        ADD CONSTRAINT fk_movimientos_recurrentes_subcategoria
        FOREIGN KEY (subcategoria_id)
        REFERENCES public.subcategorias_financieras(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_usuario_id 
ON public.movimientos_recurrentes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_categoria_id 
ON public.movimientos_recurrentes(categoria_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_subcategoria_id 
ON public.movimientos_recurrentes(subcategoria_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_activa 
ON public.movimientos_recurrentes(activa);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.movimientos_recurrentes ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS para que los usuarios solo vean sus propios movimientos recurrentes
CREATE POLICY "Users can view their own recurrent movements" ON public.movimientos_recurrentes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own recurrent movements" ON public.movimientos_recurrentes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own recurrent movements" ON public.movimientos_recurrentes
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own recurrent movements" ON public.movimientos_recurrentes
    FOR DELETE USING (auth.uid() = usuario_id);




