-- Crear la tabla conversaciones_ia
CREATE TABLE IF NOT EXISTS conversaciones_ia (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id UUID NOT NULL DEFAULT auth.uid(),
    mensajes JSONB,
    ultima_actualizacion TIMESTAMPTZ
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE conversaciones_ia ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad

-- Política 1: LEER (SELECT)
CREATE POLICY "Los usuarios pueden LEER sus propias conversaciones." ON conversaciones_ia
    FOR SELECT USING (auth.uid() = usuario_id);

-- Política 2: CREAR (INSERT)
CREATE POLICY "Los usuarios pueden CREAR sus propias conversaciones." ON conversaciones_ia
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política 3: ACTUALIZAR (UPDATE)
CREATE POLICY "Los usuarios pueden ACTUALIZAR sus propias conversaciones." ON conversaciones_ia
    FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id); 