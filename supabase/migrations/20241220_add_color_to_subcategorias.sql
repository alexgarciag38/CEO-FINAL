-- Add optional color to subcategories to avoid select errors in joins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'subcategorias_financieras'
      AND column_name = 'color'
  ) THEN
    ALTER TABLE public.subcategorias_financieras
    ADD COLUMN color TEXT;
  END IF;
END $$;

-- Optional: backfill subcategory color with parent category color
-- (keeps UI consistent until specific subcategory colors are set)
UPDATE public.subcategorias_financieras s
SET color = c.color
FROM public.categorias_financieras c
WHERE s.categoria_id = c.id
  AND (s.color IS NULL OR s.color = '');





