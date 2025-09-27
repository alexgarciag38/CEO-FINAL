-- Add origen column to movimientos_financieros to track if movement is 'unico' or 'recurrente'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_financieros' 
        AND column_name = 'origen'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_financieros 
        ADD COLUMN origen TEXT DEFAULT 'unico' CHECK (origen IN ('unico', 'recurrente'));
    END IF;
END $$;

-- Update existing records to have 'unico' as default origen
UPDATE public.movimientos_financieros 
SET origen = 'unico' 
WHERE origen IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_origen 
ON public.movimientos_financieros(origen);




