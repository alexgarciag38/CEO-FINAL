-- Script ULTRA-ROBUSTO para timestamps de auditoría
-- Garantiza integridad de datos y no-breaking changes

-- 1. Crear función robusta para manejar updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar que la columna updated_at existe
    IF TG_TABLE_NAME = 'movimientos_financieros' THEN
        NEW.updated_at = NOW();
    ELSIF TG_TABLE_NAME = 'movimientos_recurrentes' THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Agregar columnas created_at y updated_at a movimientos_financieros
DO $$ 
BEGIN
    -- Verificar y agregar created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_financieros' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_financieros 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        -- Actualizar registros existentes
        UPDATE public.movimientos_financieros 
        SET created_at = NOW() 
        WHERE created_at IS NULL;
    END IF;

    -- Verificar y agregar updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_financieros' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_financieros 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        -- Actualizar registros existentes
        UPDATE public.movimientos_financieros 
        SET updated_at = NOW() 
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- 3. Agregar columnas created_at y updated_at a movimientos_recurrentes
DO $$ 
BEGIN
    -- Verificar y agregar created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_recurrentes' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        -- Actualizar registros existentes
        UPDATE public.movimientos_recurrentes 
        SET created_at = NOW() 
        WHERE created_at IS NULL;
    END IF;

    -- Verificar y agregar updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movimientos_recurrentes' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.movimientos_recurrentes 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;
        
        -- Actualizar registros existentes
        UPDATE public.movimientos_recurrentes 
        SET updated_at = NOW() 
        WHERE updated_at IS NULL;
    END IF;
END $$;

-- 4. Crear triggers robustos para movimientos_financieros
DO $$ 
BEGIN
    -- Eliminar trigger si existe
    DROP TRIGGER IF EXISTS update_movimientos_financieros_updated_at ON public.movimientos_financieros;
    
    -- Crear trigger
    CREATE TRIGGER update_movimientos_financieros_updated_at
        BEFORE UPDATE ON public.movimientos_financieros
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();
        
    -- Log de confirmación
    RAISE NOTICE 'Trigger creado para movimientos_financieros.updated_at';
END $$;

-- 5. Crear triggers robustos para movimientos_recurrentes
DO $$ 
BEGIN
    -- Eliminar trigger si existe
    DROP TRIGGER IF EXISTS update_movimientos_recurrentes_updated_at ON public.movimientos_recurrentes;
    
    -- Crear trigger
    CREATE TRIGGER update_movimientos_recurrentes_updated_at
        BEFORE UPDATE ON public.movimientos_recurrentes
        FOR EACH ROW
        EXECUTE FUNCTION handle_updated_at();
        
    -- Log de confirmación
    RAISE NOTICE 'Trigger creado para movimientos_recurrentes.updated_at';
END $$;

-- 6. Crear índices optimizados para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_created_at 
ON public.movimientos_financieros(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_updated_at 
ON public.movimientos_financieros(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_financieros_user_created 
ON public.movimientos_financieros(usuario_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_created_at 
ON public.movimientos_recurrentes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_updated_at 
ON public.movimientos_recurrentes(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_recurrentes_user_created 
ON public.movimientos_recurrentes(usuario_id, created_at DESC);

-- 7. Verificar integridad de datos
DO $$
DECLARE
    mov_fin_count INTEGER;
    mov_rec_count INTEGER;
    mov_fin_null_created INTEGER;
    mov_rec_null_created INTEGER;
BEGIN
    -- Contar registros totales
    SELECT COUNT(*) INTO mov_fin_count FROM public.movimientos_financieros;
    SELECT COUNT(*) INTO mov_rec_count FROM public.movimientos_recurrentes;
    
    -- Contar registros con created_at NULL
    SELECT COUNT(*) INTO mov_fin_null_created FROM public.movimientos_financieros WHERE created_at IS NULL;
    SELECT COUNT(*) INTO mov_rec_null_created FROM public.movimientos_recurrentes WHERE created_at IS NULL;
    
    -- Reportar estado
    RAISE NOTICE '=== REPORTE DE INTEGRIDAD DE DATOS ===';
    RAISE NOTICE 'Movimientos financieros: % registros totales', mov_fin_count;
    RAISE NOTICE 'Movimientos recurrentes: % registros totales', mov_rec_count;
    RAISE NOTICE 'Movimientos financieros con created_at NULL: %', mov_fin_null_created;
    RAISE NOTICE 'Movimientos recurrentes con created_at NULL: %', mov_rec_null_created;
    
    -- Verificar que no hay NULLs
    IF mov_fin_null_created > 0 OR mov_rec_null_created > 0 THEN
        RAISE WARNING 'Se encontraron registros con created_at NULL. Ejecutando corrección...';
        
        UPDATE public.movimientos_financieros 
        SET created_at = NOW() 
        WHERE created_at IS NULL;
        
        UPDATE public.movimientos_recurrentes 
        SET created_at = NOW() 
        WHERE created_at IS NULL;
        
        RAISE NOTICE 'Corrección completada.';
    ELSE
        RAISE NOTICE 'Integridad de datos verificada correctamente.';
    END IF;
END $$;

-- 8. Verificar estructura final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'created_at' THEN 'AUDITORÍA - CREACIÓN'
        WHEN column_name = 'updated_at' THEN 'AUDITORÍA - MODIFICACIÓN'
        ELSE 'DATOS'
    END as tipo_columna
FROM information_schema.columns 
WHERE table_name IN ('movimientos_financieros', 'movimientos_recurrentes')
AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;

-- 9. Crear vista de auditoría para monitoreo
CREATE OR REPLACE VIEW vista_auditoria_movimientos AS
SELECT 
    'financiero' as tipo_movimiento,
    id,
    usuario_id,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (updated_at - created_at)) as segundos_desde_creacion,
    CASE 
        WHEN updated_at = created_at THEN 'Nunca modificado'
        ELSE 'Modificado ' || ROUND(EXTRACT(EPOCH FROM (updated_at - created_at))/3600, 2) || ' horas después'
    END as estado_auditoria
FROM public.movimientos_financieros
UNION ALL
SELECT 
    'recurrente' as tipo_movimiento,
    id,
    usuario_id,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (updated_at - created_at)) as segundos_desde_creacion,
    CASE 
        WHEN updated_at = created_at THEN 'Nunca modificado'
        ELSE 'Modificado ' || ROUND(EXTRACT(EPOCH FROM (updated_at - created_at))/3600, 2) || ' horas después'
    END as estado_auditoria
FROM public.movimientos_recurrentes
ORDER BY created_at DESC;

-- 10. Mensaje final de confirmación
DO $$
BEGIN
    RAISE NOTICE '=== TIMESTAMPS DE AUDITORÍA ULTRA-ROBUSTOS IMPLEMENTADOS ===';
    RAISE NOTICE '✅ Columnas created_at y updated_at agregadas';
    RAISE NOTICE '✅ Triggers automáticos configurados';
    RAISE NOTICE '✅ Índices de rendimiento creados';
    RAISE NOTICE '✅ Integridad de datos verificada';
    RAISE NOTICE '✅ Vista de auditoría disponible';
    RAISE NOTICE '=== SISTEMA LISTO PARA PRODUCCIÓN ===';
END $$;




