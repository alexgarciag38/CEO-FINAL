-- =====================================================
-- MINIMAL DATABASE UPDATES FOR FINANZAS MODULE
-- =====================================================
-- Execute this script in Supabase SQL Editor

-- STEP 1: Add origen column to movimientos_financieros
ALTER TABLE public.movimientos_financieros 
ADD COLUMN IF NOT EXISTS origen TEXT DEFAULT 'unico';

-- Update existing records to have 'unico' as default origen
UPDATE public.movimientos_financieros 
SET origen = 'unico' 
WHERE origen IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_origen 
ON public.movimientos_financieros(origen);

-- STEP 2: Add color column to subcategorias_financieras
ALTER TABLE public.subcategorias_financieras
ADD COLUMN IF NOT EXISTS color TEXT;

-- Backfill subcategory color with parent category color
UPDATE public.subcategorias_financieras s
SET color = c.color
FROM public.categorias_financieras c
WHERE s.categoria_id = c.id
  AND (s.color IS NULL OR s.color = '');

-- STEP 3: Create movimientos_recurrentes table
CREATE TABLE IF NOT EXISTS public.movimientos_recurrentes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    categoria_id UUID,
    subcategoria_id UUID,
    proveedor_cliente TEXT,
    descripcion TEXT,
    monto DECIMAL(10,2) NOT NULL,
    forma_pago TEXT,
    fiscal BOOLEAN DEFAULT false,
    notas TEXT,
    frecuencia TEXT NOT NULL,
    dia_del_mes INTEGER,
    dia_de_la_semana INTEGER,
    fecha_inicio_serie DATE NOT NULL,
    fecha_fin_serie DATE,
    numero_repeticiones INTEGER,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: Add foreign key constraints
ALTER TABLE public.movimientos_recurrentes 
ADD CONSTRAINT fk_movimientos_recurrentes_categoria 
FOREIGN KEY (categoria_id) REFERENCES public.categorias_financieras(id) ON DELETE RESTRICT;

ALTER TABLE public.movimientos_recurrentes 
ADD CONSTRAINT fk_movimientos_recurrentes_subcategoria 
FOREIGN KEY (subcategoria_id) REFERENCES public.subcategorias_financieras(id) ON DELETE RESTRICT;

-- STEP 5: Create indexes for performance (only if columns exist)
DO $$
BEGIN
    -- Create usuario_id index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_recurrentes' AND column_name = 'usuario_id' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_usuario_id 
        ON public.movimientos_recurrentes(usuario_id);
    END IF;

    -- Create categoria_id index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_recurrentes' AND column_name = 'categoria_id' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_categoria_id 
        ON public.movimientos_recurrentes(categoria_id);
    END IF;

    -- Create subcategoria_id index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_recurrentes' AND column_name = 'subcategoria_id' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_subcategoria_id 
        ON public.movimientos_recurrentes(subcategoria_id);
    END IF;

    -- Create activo index
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_recurrentes' AND column_name = 'activo' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_activo 
        ON public.movimientos_recurrentes(activo);
    END IF;
END $$;

-- STEP 6: Enable Row Level Security (RLS)
ALTER TABLE public.movimientos_recurrentes ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create RLS policies
CREATE POLICY "Users can view their own recurring movements" 
ON public.movimientos_recurrentes FOR SELECT 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert their own recurring movements" 
ON public.movimientos_recurrentes FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own recurring movements" 
ON public.movimientos_recurrentes FOR UPDATE 
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own recurring movements" 
ON public.movimientos_recurrentes FOR DELETE 
USING (auth.uid() = usuario_id);

-- STEP 8: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 9: Create trigger for updated_at
CREATE TRIGGER update_movimientos_recurrentes_updated_at
    BEFORE UPDATE ON public.movimientos_recurrentes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify origen column exists and has data
SELECT 
    'movimientos_financieros' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN origen = 'unico' THEN 1 END) as unico_count,
    COUNT(CASE WHEN origen = 'recurrente' THEN 1 END) as recurrente_count
FROM public.movimientos_financieros;

-- Verify subcategorias_financieras has color column
SELECT 
    'subcategorias_financieras' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN color IS NOT NULL THEN 1 END) as with_color_count
FROM public.subcategorias_financieras;

-- Verify movimientos_recurrentes table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'movimientos_recurrentes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'movimientos_recurrentes';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Database updates completed successfully!' as status;




