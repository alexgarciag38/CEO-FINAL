# Guía de Despliegue - Sistema de Análisis de Ventas

## 📋 Requisitos Previos

- Proyecto Supabase configurado
- Usuario con rol 'admin' o 'manager'
- Archivos CSV con estructura específica

## 🗄️ 1. Configuración de Base de Datos

### 1.1 Crear Tabla ventas_historico

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta el siguiente script:

```sql
-- Crear tabla para almacenar análisis históricos
CREATE TABLE IF NOT EXISTS ventas_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  datos JSONB NOT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_historico_mes_anio ON ventas_historico(mes, anio);
CREATE INDEX IF NOT EXISTS idx_ventas_historico_user_id ON ventas_historico(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_historico_fecha_creacion ON ventas_historico(fecha_creacion);

-- Índice único para evitar duplicados por mes/año/usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_historico_unique ON ventas_historico(mes, anio, user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE ventas_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admin y manager
CREATE POLICY "Admin y Manager pueden ver todos los registros" ON ventas_historico
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin y Manager pueden insertar registros" ON ventas_historico
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin y Manager pueden actualizar registros" ON ventas_historico
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admin y Manager pueden eliminar registros" ON ventas_historico
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IN ('admin', 'manager')
    )
  );

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fecha_actualizacion
  BEFORE UPDATE ON ventas_historico
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_actualizacion();

-- Función para obtener el último análisis
CREATE OR REPLACE FUNCTION get_ultimo_analisis_ventas(user_uuid UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT datos 
    FROM ventas_historico 
    WHERE user_id = user_uuid 
    ORDER BY fecha_creacion DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener análisis por rango de fechas
CREATE OR REPLACE FUNCTION get_analisis_ventas_rango(
  user_uuid UUID,
  mes_inicio INTEGER,
  anio_inicio INTEGER,
  mes_fin INTEGER,
  anio_fin INTEGER
)
RETURNS TABLE (
  mes INTEGER,
  anio INTEGER,
  datos JSONB,
  fecha_creacion TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT vh.mes, vh.anio, vh.datos, vh.fecha_creacion
  FROM ventas_historico vh
  WHERE vh.user_id = user_uuid
    AND (
      (vh.anio > anio_inicio) OR 
      (vh.anio = anio_inicio AND vh.mes >= mes_inicio)
    )
    AND (
      (vh.anio < anio_fin) OR 
      (vh.anio = anio_fin AND vh.mes <= mes_fin)
    )
  ORDER BY vh.anio, vh.mes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔧 2. Despliegue de Edge Functions

### 2.1 Función procesar-analisis-ventas

1. Ve a **Supabase Dashboard** → **Edge Functions**
2. Haz clic en **"Create a new function"**
3. Nombre: `procesar-analisis-ventas`
4. Copia el contenido de `backend/functions/procesar-analisis-ventas/index.ts`
5. Haz clic en **"Deploy"**

### 2.2 Función comparar-ventas

1. Ve a **Supabase Dashboard** → **Edge Functions**
2. Haz clic en **"Create a new function"**
3. Nombre: `comparar-ventas`
4. Copia el contenido de `backend/functions/comparar-ventas/index.ts`
5. Haz clic en **"Deploy"**

## 🔐 3. Configuración de Variables de Entorno

### 3.1 Verificar Secrets

1. Ve a **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Verifica que existan estos secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

Si no existen, agrégalos con los valores de tu proyecto.

## 👤 4. Configuración de Usuario y Roles

### 4.1 Asignar Rol Admin

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta este comando (reemplaza con tu email):

```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'tu-email@ejemplo.com';
```

## 🧪 5. Pruebas del Sistema

### 5.1 Verificar Frontend

1. Asegúrate de que la aplicación esté corriendo (`npm run dev`)
2. Inicia sesión con tu cuenta admin
3. Ve a la página **"Ventas"**
4. Verifica que aparezca la pestaña **"Cargar Datos"**

### 5.2 Probar Carga de Archivos

1. Usa los archivos de ejemplo en la carpeta `ejemplos/`:
   - `cobranza.csv`
   - `pedidos.csv`
   - `productos-utilidad.csv`
2. Selecciona mes y año (ej: Diciembre 2024)
3. Sube los tres archivos
4. Haz clic en **"Procesar Datos"**

## 📊 6. Verificación de Resultados

### 6.1 Verificar KPIs

Después de procesar, deberías ver:
- **Ventas Totales**: Número calculado
- **Unidades Vendidas**: Número calculado
- **Margen Bruto**: Porcentaje calculado
- **Total de Pedidos**: Número calculado

### 6.2 Verificar Gráficos

- **Tendencia Mensual**: Gráfico de líneas
- **Análisis ABC**: Gráfico de barras
- **Rendimiento de Equipo**: Gráfico de barras
- **Simulador de Ventas**: Proyecciones

## 🔍 7. Monitoreo y Logs

### 7.1 Verificar Logs

1. Ve a **Supabase Dashboard** → **Edge Functions**
2. Selecciona la función
3. Ve a la pestaña **"Logs"**
4. Verifica que no haya errores

### 7.2 Verificar Base de Datos

1. Ve a **Supabase Dashboard** → **Table Editor**
2. Selecciona la tabla `ventas_historico`
3. Verifica que se hayan creado registros

## 🚨 8. Solución de Problemas

### 8.1 Error de Autenticación

- Verifica que el usuario tenga rol 'admin' o 'manager'
- Verifica que el token de autenticación sea válido

### 8.2 Error de Archivos CSV

- Verifica que los archivos sean CSV válidos
- Verifica que tengan las columnas requeridas
- Verifica que no excedan 10MB

### 8.3 Error de Procesamiento

- Verifica los logs de la Edge Function
- Verifica que los datos CSV sean consistentes

## 📝 9. Notas Importantes

- Los archivos CSV deben tener codificación UTF-8
- Las fechas deben estar en formato ISO (YYYY-MM-DD)
- Los montos deben ser números válidos
- El sistema valida automáticamente la consistencia de datos

## 🎯 10. Próximos Pasos

1. **Personalizar KPIs**: Modificar cálculos según necesidades
2. **Agregar Filtros**: Implementar filtros por fecha, cliente, producto
3. **Exportar Datos**: Agregar funcionalidad de exportación
4. **Notificaciones**: Implementar alertas automáticas

---

**¡El sistema está listo para usar! 🎉**

## 📌 AJUSTE DE VALIDACIÓN DE COLUMNAS EN procesar-analisis-ventas

### 🔄 Validación Flexible de Headers CSV

El sistema ahora incluye **validación flexible de columnas** que maneja variaciones en los nombres de headers:

#### Normalización Automática:
- **Convertir a minúsculas**
- **Quitar espacios**
- **Quitar acentos**

#### Mapeo de Columnas Soportado:

**COBRANZA:**
- `Cliente` → acepta: `cliente`, `client`
- `FechaPago` → acepta: `fechapago`, `fechadepago`, `fecha de pago`, `fecha_pago`
- `Monto` → acepta: `monto`, `amount`, `valor`, `importe`
- `EstadoPago` → acepta: `estadopago`, `estado`, `status`, `estado_pago`

**PEDIDOS:**
- `PedidoID` → acepta: `pedidoid`, `pedido_id`, `idpedido`, `id_pedido`, `pedido`
- `FechaPedido` → acepta: `fechapedido`, `fecha_pedido`, `fecha de pedido`
- `Cliente` → acepta: `cliente`, `client`
- `Producto` → acepta: `producto`, `product`, `item`
- `Cantidad` → acepta: `cantidad`, `qty`, `quantity`
- `PrecioUnitario` → acepta: `preciounitario`, `precio_unitario`, `precio`, `unitprice`
- `Agente` → acepta: `agente`, `agent`, `vendedor`, `salesperson`

**PRODUCTOS-UTILIDAD:**
- `Producto` → acepta: `producto`, `product`, `item`
- `CostoUnitario` → acepta: `costounitario`, `costo_unitario`, `costo`, `unitcost`
- `PrecioVenta` → acepta: `precioventa`, `precio_venta`, `precio`, `sellingprice`

#### Comportamiento:
- ✅ **Si encuentra una columna** → la mapea al nombre estándar
- ❌ **Si no encuentra ninguna variante** → devuelve error 400 con lista de columnas faltantes
- 🔄 **Procesamiento automático** → usa el mapeo para acceder a los datos correctamente

#### Ejemplo de Error Mejorado:
```json
{
  "error": "Estructura de cobranza inválida",
  "message": "Faltan columnas en el archivo de cobranza: fechapago, monto"
}
```

**¡Ahora puedes usar archivos CSV con headers en diferentes formatos sin problemas! 🎉** 