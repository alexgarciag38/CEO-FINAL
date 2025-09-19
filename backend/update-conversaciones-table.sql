-- ========================================
-- AGREGAR CAMPO MODULO A LA TABLA conversaciones_ia
-- ========================================

-- Agregar columna modulo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversaciones_ia' AND column_name = 'modulo'
    ) THEN
        ALTER TABLE conversaciones_ia ADD COLUMN modulo VARCHAR(50) NOT NULL DEFAULT 'ventas';
    END IF;
END $$;

-- ========================================
-- ACTUALIZAR POLÍTICAS PARA INCLUIR MÓDULO
-- ========================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Los usuarios pueden LEER sus propias conversaciones." ON conversaciones_ia;
DROP POLICY IF EXISTS "Los usuarios pueden CREAR sus propias conversaciones." ON conversaciones_ia;
DROP POLICY IF EXISTS "Los usuarios pueden ACTUALIZAR sus propias conversaciones." ON conversaciones_ia;
DROP POLICY IF EXISTS "Los usuarios pueden ELIMINAR sus propias conversaciones." ON conversaciones_ia;

-- Crear nuevas políticas que incluyan el módulo
CREATE POLICY "Los usuarios pueden LEER sus propias conversaciones por módulo." ON conversaciones_ia
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden CREAR sus propias conversaciones por módulo." ON conversaciones_ia
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden ACTUALIZAR sus propias conversaciones por módulo." ON conversaciones_ia
    FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Los usuarios pueden ELIMINAR sus propias conversaciones por módulo." ON conversaciones_ia
    FOR DELETE USING (auth.uid() = usuario_id);

-- ========================================
-- CREAR ÍNDICE PARA MÓDULO
-- ========================================

CREATE INDEX IF NOT EXISTS idx_conversaciones_ia_modulo ON conversaciones_ia(modulo);

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