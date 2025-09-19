-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA ANÁLISIS DE VENTAS
-- =====================================================

-- Tabla para almacenar datos históricos de análisis de ventas
CREATE TABLE IF NOT EXISTS ventas_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    anio INTEGER NOT NULL CHECK (anio >= 2020),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    datos JSONB NOT NULL,
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índice único para evitar duplicados por mes/año
    UNIQUE(mes, anio)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ventas_historico_mes_anio ON ventas_historico(mes, anio);
CREATE INDEX IF NOT EXISTS idx_ventas_historico_usuario ON ventas_historico(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_historico_fecha ON ventas_historico(fecha_carga);
CREATE INDEX IF NOT EXISTS idx_ventas_historico_datos ON ventas_historico USING GIN(datos);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

-- Política: Solo usuarios autenticados pueden ver sus propios datos
CREATE POLICY "Usuarios pueden ver sus propios datos históricos" ON ventas_historico
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- Política: Solo admins y managers pueden insertar datos
CREATE POLICY "Solo admins y managers pueden insertar datos históricos" ON ventas_historico
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'manager')
        )
    );

-- Política: Solo admins y managers pueden actualizar datos
CREATE POLICY "Solo admins y managers pueden actualizar datos históricos" ON ventas_historico
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'manager')
        )
    );

-- Política: Solo admins pueden eliminar datos
CREATE POLICY "Solo admins pueden eliminar datos históricos" ON ventas_historico
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- FUNCIONES DE AUDITORÍA
-- =====================================================

-- Función para actualizar automáticamente fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE TRIGGER trigger_update_fecha_actualizacion
    BEFORE UPDATE ON ventas_historico
    FOR EACH ROW
    EXECUTE FUNCTION update_fecha_actualizacion();

-- =====================================================
-- FUNCIONES DE CONSULTA ÚTILES
-- =====================================================

-- Función para obtener el último análisis por mes/año
CREATE OR REPLACE FUNCTION get_ultimo_analisis_ventas()
RETURNS TABLE (
    mes INTEGER,
    anio INTEGER,
    datos JSONB,
    fecha_carga TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vh.mes,
        vh.anio,
        vh.datos,
        vh.fecha_carga
    FROM ventas_historico vh
    WHERE vh.usuario_id = auth.uid()
    ORDER BY vh.anio DESC, vh.mes DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener análisis por rango de fechas
CREATE OR REPLACE FUNCTION get_analisis_ventas_rango(
    mes_inicio INTEGER,
    anio_inicio INTEGER,
    mes_fin INTEGER,
    anio_fin INTEGER
)
RETURNS TABLE (
    mes INTEGER,
    anio INTEGER,
    datos JSONB,
    fecha_carga TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vh.mes,
        vh.anio,
        vh.datos,
        vh.fecha_carga
    FROM ventas_historico vh
    WHERE vh.usuario_id = auth.uid()
    AND (
        (vh.anio > anio_inicio) OR 
        (vh.anio = anio_inicio AND vh.mes >= mes_inicio)
    )
    AND (
        (vh.anio < anio_fin) OR 
        (vh.anio = anio_fin AND vh.mes <= mes_fin)
    )
    ORDER BY vh.anio ASC, vh.mes ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para resumen de KPIs por mes
CREATE OR REPLACE VIEW v_resumen_kpis_mensual AS
SELECT 
    mes,
    anio,
    datos->'kpis'->>'ventasTotales' as ventas_totales,
    datos->'kpis'->>'unidadesVendidas' as unidades_vendidas,
    datos->'kpis'->>'margenBruto' as margen_bruto,
    datos->'kpis'->>'margenNeto' as margen_neto,
    datos->'kpis'->>'margenBrutoPct' as margen_bruto_pct,
    datos->'kpis'->>'margenNetoPct' as margen_neto_pct,
    datos->'kpis'->>'totalPedidos' as total_pedidos,
    datos->'kpis'->>'pedidosSinPago' as pedidos_sin_pago,
    datos->'kpis'->>'carteraVencida' as cartera_vencida,
    fecha_carga
FROM ventas_historico
WHERE usuario_id = auth.uid();

-- Vista para resumen de consistencia
CREATE OR REPLACE VIEW v_resumen_consistencia AS
SELECT 
    mes,
    anio,
    datos->'consistencia'->>'importeTeorico' as importe_teorico,
    datos->'consistencia'->>'importeReal' as importe_real,
    datos->'consistencia'->>'utilidadTeorica' as utilidad_teorica,
    datos->'consistencia'->>'utilidadReal' as utilidad_real,
    datos->'consistencia'->>'diferenciaImportePct' as diferencia_importe_pct,
    datos->'consistencia'->>'diferenciaUtilidadPct' as diferencia_utilidad_pct,
    datos->'consistencia'->>'alerta' as alerta,
    fecha_carga
FROM ventas_historico
WHERE usuario_id = auth.uid();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE ventas_historico IS 'Almacena datos históricos de análisis de ventas procesados desde archivos CSV';
COMMENT ON COLUMN ventas_historico.mes IS 'Mes del análisis (1-12)';
COMMENT ON COLUMN ventas_historico.anio IS 'Año del análisis (>= 2020)';
COMMENT ON COLUMN ventas_historico.usuario_id IS 'ID del usuario que cargó el análisis';
COMMENT ON COLUMN ventas_historico.datos IS 'Datos JSON del análisis completo (KPIs, rankings, etc.)';
COMMENT ON COLUMN ventas_historico.fecha_carga IS 'Fecha y hora de la carga inicial';
COMMENT ON COLUMN ventas_historico.fecha_actualizacion IS 'Fecha y hora de la última actualización';

COMMENT ON FUNCTION get_ultimo_analisis_ventas() IS 'Obtiene el análisis más reciente del usuario actual';
COMMENT ON FUNCTION get_analisis_ventas_rango(INTEGER, INTEGER, INTEGER, INTEGER) IS 'Obtiene análisis en un rango de fechas específico';

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Nota: Los datos de ejemplo se insertarían solo en desarrollo
-- y serían eliminados en producción

/*
-- Ejemplo de inserción de datos de prueba
INSERT INTO ventas_historico (mes, anio, usuario_id, datos) VALUES (
    12,
    2024,
    '00000000-0000-0000-0000-000000000000', -- Reemplazar con ID real
    '{
        "kpis": {
            "ventasTotales": 150000,
            "unidadesVendidas": 1500,
            "margenBruto": 45000,
            "margenNeto": 38250,
            "margenBrutoPct": 30.0,
            "margenNetoPct": 25.5,
            "totalPedidos": 120,
            "pedidosSinPago": 15,
            "carteraVencida": 25000
        },
        "consistencia": {
            "importeTeorico": 150000,
            "importeReal": 149500,
            "utilidadTeorica": 45000,
            "utilidadReal": 44850,
            "diferenciaImportePct": 0.33,
            "diferenciaUtilidadPct": 0.33,
            "alerta": false
        }
    }'::jsonb
);
*/ 