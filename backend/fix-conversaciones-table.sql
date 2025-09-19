-- ========================================
-- COMPLEMENTAR TABLA conversaciones_ia EXISTENTE
-- ========================================

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- Agregar mensajes si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversaciones_ia' AND column_name = 'mensajes'
    ) THEN
        ALTER TABLE conversaciones_ia ADD COLUMN mensajes JSONB DEFAULT '[]';
    END IF;

    -- Agregar ultima_actualizacion si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversaciones_ia' AND column_name = 'ultima_actualizacion'
    ) THEN
        ALTER TABLE conversaciones_ia ADD COLUMN ultima_actualizacion TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ========================================
-- CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ========================================

CREATE INDEX IF NOT EXISTS idx_conversaciones_ia_usuario_id ON conversaciones_ia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ia_created_at ON conversaciones_ia(created_at);

-- ========================================
-- FUNCIÓN PARA ACTUALIZAR automáticamente ultima_actualizacion
-- ========================================

CREATE OR REPLACE FUNCTION actualizar_ultima_conversacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ultima_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGER PARA ACTUALIZAR automáticamente
-- ========================================

DROP TRIGGER IF EXISTS trigger_actualizar_ultima_conversacion ON conversaciones_ia;
CREATE TRIGGER trigger_actualizar_ultima_conversacion
    BEFORE UPDATE ON conversaciones_ia
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_ultima_conversacion();

-- ========================================
-- VERIFICAR ESTRUCTURA FINAL
-- ========================================

SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversaciones_ia'
ORDER BY ordinal_position; 