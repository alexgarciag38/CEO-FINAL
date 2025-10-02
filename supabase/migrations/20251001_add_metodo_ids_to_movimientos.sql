-- Agrega columnas de método/submétodo a movimientos_financieros y movimientos_historial

-- Agrega metodo_categoria_id a movimientos_financieros
ALTER TABLE IF EXISTS public.movimientos_financieros
ADD COLUMN IF NOT EXISTS metodo_categoria_id UUID NULL;

-- Agrega metodo_subcategoria_id a movimientos_financieros
ALTER TABLE IF EXISTS public.movimientos_financieros
ADD COLUMN IF NOT EXISTS metodo_subcategoria_id UUID NULL;

-- Índices opcionales para rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_metodo_categoria_id
ON public.movimientos_financieros (metodo_categoria_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_metodo_subcategoria_id
ON public.movimientos_financieros (metodo_subcategoria_id);


-- Agrega metodo_categoria_id a movimientos_historial
ALTER TABLE IF EXISTS public.movimientos_historial
ADD COLUMN IF NOT EXISTS metodo_categoria_id UUID NULL;

-- Agrega metodo_subcategoria_id a movimientos_historial
ALTER TABLE IF EXISTS public.movimientos_historial
ADD COLUMN IF NOT EXISTS metodo_subcategoria_id UUID NULL;

-- Índices opcionales para rendimiento
CREATE INDEX IF NOT EXISTS idx_movimientos_historial_metodo_categoria_id
ON public.movimientos_historial (metodo_categoria_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_historial_metodo_subcategoria_id
ON public.movimientos_historial (metodo_subcategoria_id);


