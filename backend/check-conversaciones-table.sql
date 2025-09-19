-- Verificar la estructura actual de la tabla conversaciones_ia
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'conversaciones_ia'
ORDER BY ordinal_position;

-- Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- Agregar fecha_creacion si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversaciones_ia' AND column_name = 'fecha_creacion'
    ) THEN
        ALTER TABLE conversaciones_ia ADD COLUMN fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Agregar fecha_actualizacion si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversaciones_ia' AND column_name = 'fecha_actualizacion'
    ) THEN
        ALTER TABLE conversaciones_ia ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Agregar usuario_id si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversaciones_ia' AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE conversaciones_ia ADD COLUMN usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Agregar mensajes si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversaciones_ia' AND column_name = 'mensajes'
    ) THEN
        ALTER TABLE conversaciones_ia ADD COLUMN mensajes JSONB NOT NULL DEFAULT '[]';
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_conversaciones_ia_usuario_id ON conversaciones_ia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ia_fecha_creacion ON conversaciones_ia(fecha_creacion);

-- Habilitar RLS si no está habilitado
ALTER TABLE conversaciones_ia ENABLE ROW LEVEL SECURITY;

-- Crear políticas si no existen
DO $$
BEGIN
    -- Política para SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversaciones_ia' AND policyname = 'Usuarios pueden ver sus propias conversaciones'
    ) THEN
        CREATE POLICY "Usuarios pueden ver sus propias conversaciones" ON conversaciones_ia
            FOR SELECT USING (auth.uid() = usuario_id);
    END IF;

    -- Política para INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversaciones_ia' AND policyname = 'Usuarios pueden insertar sus propias conversaciones'
    ) THEN
        CREATE POLICY "Usuarios pueden insertar sus propias conversaciones" ON conversaciones_ia
            FOR INSERT WITH CHECK (auth.uid() = usuario_id);
    END IF;

    -- Política para UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversaciones_ia' AND policyname = 'Usuarios pueden actualizar sus propias conversaciones'
    ) THEN
        CREATE POLICY "Usuarios pueden actualizar sus propias conversaciones" ON conversaciones_ia
            FOR UPDATE USING (auth.uid() = usuario_id);
    END IF;

    -- Política para DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversaciones_ia' AND policyname = 'Usuarios pueden eliminar sus propias conversaciones'
    ) THEN
        CREATE POLICY "Usuarios pueden eliminar sus propias conversaciones" ON conversaciones_ia
            FOR DELETE USING (auth.uid() = usuario_id);
    END IF;
END $$;

-- Crear función y trigger para fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_conversacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_actualizar_fecha_conversacion ON conversaciones_ia;
CREATE TRIGGER trigger_actualizar_fecha_conversacion
    BEFORE UPDATE ON conversaciones_ia
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_conversacion();

-- Mostrar la estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'conversaciones_ia'
ORDER BY ordinal_position; 