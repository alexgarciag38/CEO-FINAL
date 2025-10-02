-- Habilitar Row Level Security en la tabla movimientos_financieros
ALTER TABLE public.movimientos_financieros ENABLE ROW LEVEL SECURITY;

-- Crear política que permite a los usuarios seleccionar (ver) sus propios movimientos
CREATE POLICY "Users can select their own financial movements"
ON public.movimientos_financieros
FOR SELECT
USING (auth.uid() = usuario_id);

-- Crear política que permite a los usuarios insertar sus propios movimientos
CREATE POLICY "Users can insert their own financial movements"
ON public.movimientos_financieros
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Crear política que permite a los usuarios actualizar sus propios movimientos
CREATE POLICY "Users can update their own financial movements"
ON public.movimientos_financieros
FOR UPDATE
USING (auth.uid() = usuario_id);

-- Crear política que permite a los usuarios eliminar sus propios movimientos
CREATE POLICY "Users can delete their own financial movements"
ON public.movimientos_financieros
FOR DELETE
USING (auth.uid() = usuario_id);


