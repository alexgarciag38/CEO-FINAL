-- Tabla para almacenar el historial de conversaciones con la IA
CREATE TABLE IF NOT EXISTS conversaciones_ia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mensajes JSONB NOT NULL DEFAULT '[]',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_conversaciones_ia_usuario_id ON conversaciones_ia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_ia_fecha_creacion ON conversaciones_ia(fecha_creacion);

-- Políticas de Row Level Security (RLS)
ALTER TABLE conversaciones_ia ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias conversaciones
CREATE POLICY "Usuarios pueden ver sus propias conversaciones" ON conversaciones_ia
    FOR SELECT USING (auth.uid() = usuario_id);

-- Política: Los usuarios solo pueden insertar sus propias conversaciones
CREATE POLICY "Usuarios pueden insertar sus propias conversaciones" ON conversaciones_ia
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política: Los usuarios solo pueden actualizar sus propias conversaciones
CREATE POLICY "Usuarios pueden actualizar sus propias conversaciones" ON conversaciones_ia
    FOR UPDATE USING (auth.uid() = usuario_id);

-- Política: Los usuarios solo pueden eliminar sus propias conversaciones
CREATE POLICY "Usuarios pueden eliminar sus propias conversaciones" ON conversaciones_ia
    FOR DELETE USING (auth.uid() = usuario_id);

-- Función para actualizar automáticamente fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_conversacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE TRIGGER trigger_actualizar_fecha_conversacion
    BEFORE UPDATE ON conversaciones_ia
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_conversacion(); 