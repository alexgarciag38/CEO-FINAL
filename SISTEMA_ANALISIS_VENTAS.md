# 🚀 Sistema de Análisis de Ventas - Documentación Completa

## 📋 **Descripción General**

Sistema completo de análisis de ventas que permite procesar archivos CSV de cobranza, pedidos y productos para generar KPIs reales, análisis ABC, simulaciones y comparaciones históricas. El sistema mantiene la estructura existente de VentasPage.tsx y alimenta todas las secciones con datos reales cuando están disponibles.

## 🏗️ **Arquitectura del Sistema**

### **Frontend (React + TypeScript)**
- **VentasPage.tsx**: Página principal con formulario de carga y visualización de datos
- **Mantiene estructura existente**: No se modifican las secciones, solo se alimentan con datos reales
- **Validación robusta**: Archivos CSV, fechas, tamaños y tipos MIME
- **Feedback visual**: Estados de carga, éxito, error y alertas de consistencia

### **Backend (Supabase Edge Functions)**
- **procesar-analisis-ventas**: Función principal para procesar CSV y calcular análisis
- **comparar-ventas**: Función para comparar datos entre períodos
- **validateUserRole**: Helper unificado para autenticación y autorización

### **Base de Datos (PostgreSQL)**
- **ventas_historico**: Tabla para almacenar análisis históricos
- **RLS**: Row Level Security para control de acceso
- **Índices optimizados**: Para consultas eficientes

## 📁 **Estructura de Archivos**

```
backend/
├── functions/
│   ├── procesar-analisis-ventas/
│   │   └── index.ts                    # Función principal de análisis
│   ├── comparar-ventas/
│   │   └── index.ts                    # Función de comparación
│   └── utils/
│       └── validateUserRole.ts         # Helper de autenticación
├── database-schema-ventas.sql          # Esquema de base de datos
└── EDGE_FUNCTIONS_HELPER.md           # Documentación del helper

src/
├── pages/ventas/
│   └── VentasPage.tsx                  # Página principal actualizada
└── components/
    ├── sales/
    │   ├── ABCAnalysisChart.tsx        # Gráfico ABC
    │   └── SalesSimulator.tsx          # Simulador de ventas
    └── ui/
        └── KPICard.tsx                 # Tarjetas de KPIs
```

## 🔧 **Funcionalidades Implementadas**

### **1. Carga de Archivos CSV**
- **3 archivos simultáneos**: cobranza.csv, pedidos.csv, productos-utilidad.csv
- **Validación estricta**: Estructura de columnas, tipos MIME, tamaños
- **Procesamiento seguro**: Sanitización de datos y manejo de errores
- **Límites**: 10MB por archivo, fechas no futuras

### **2. Estructuras CSV Requeridas**

#### **cobranza.csv**
```csv
Cliente,FechaPago,Monto,EstadoPago
Cliente A,15/01/2024,1500.00,Pagado
Cliente B,20/01/2024,2500.00,Pendiente
```

#### **pedidos.csv**
```csv
PedidoID,FechaPedido,Cliente,Producto,Cantidad,PrecioUnitario,Agente
PED001,10/01/2024,Cliente A,Producto X,5,100.00,Agente 1
PED002,12/01/2024,Cliente B,Producto Y,3,150.00,Agente 2
```

#### **productos-utilidad.csv**
```csv
Producto,CostoUnitario,PrecioVenta
Producto X,60.00,100.00
Producto Y,90.00,150.00
```

### **3. KPIs Calculados**
- **Ventas totales**: Suma de (Cantidad × PrecioUnitario)
- **Unidades vendidas**: Suma de cantidades
- **Margen bruto**: Ventas - Costos totales
- **Margen neto**: Margen bruto × 0.85 (15% impuestos/gastos)
- **Total pedidos**: Número único de PedidoID
- **Pedidos sin pago**: Pedidos sin registro de pago
- **Cartera vencida**: Suma de montos pendientes

### **4. Análisis ABC**
- **Categoría A**: 80% de ventas acumuladas
- **Categoría B**: 80-95% de ventas acumuladas
- **Categoría C**: 95-100% de ventas acumuladas
- **Cálculo por**: Ventas totales y margen por producto

### **5. Rendimiento de Agentes**
- **Ventas por agente**: Suma de ventas por campo "Agente"
- **Margen por agente**: Margen generado por agente
- **Clientes únicos**: Número de clientes por agente
- **Pedidos procesados**: Número de pedidos por agente

### **6. Simulador de Ventas**
- **Proyección**: 3 meses futuros basado en promedio histórico
- **Estacionalidad**: Factor de crecimiento del 10% mensual
- **Métricas**: Ventas y margen proyectados

### **7. Validación de Consistencia**
- **Importe teórico**: Suma de (Cantidad × PrecioVenta)
- **Importe real**: Suma de (Cantidad × PrecioUnitario)
- **Alerta**: Si diferencia > 0.5%
- **Logging**: Detalle de inconsistencias

## 🔒 **Seguridad Implementada**

### **Autenticación y Autorización**
- **Roles permitidos**: admin, manager
- **Validación unificada**: Helper `validateUserRole`
- **Tokens JWT**: Verificación automática
- **Logging de acceso**: Intentos exitosos y fallidos

### **Validación de Datos**
- **Sanitización**: Limpieza de caracteres especiales
- **Normalización**: Fechas dd/mm/yyyy → ISO
- **Validación de tipos**: Números, fechas, texto
- **Eliminación**: Filas vacías o incompletas

### **Base de Datos**
- **RLS activado**: Row Level Security
- **Políticas**: Usuarios solo ven sus datos
- **Índices**: Optimización de consultas
- **Auditoría**: Timestamps automáticos

## 📊 **Almacenamiento Histórico**

### **Tabla ventas_historico**
```sql
CREATE TABLE ventas_historico (
    id UUID PRIMARY KEY,
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    usuario_id UUID NOT NULL,
    datos JSONB NOT NULL,
    fecha_carga TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mes, anio)
);
```

### **Datos JSONB**
```json
{
  "kpis": { ... },
  "ventasMensuales": [ ... ],
  "rankingABC": { "A": [...], "B": [...], "C": [...] },
  "clientesTop": [ ... ],
  "carteraVencida": [ ... ],
  "rendimientoAgentes": [ ... ],
  "simulador": { ... },
  "consistencia": { ... }
}
```

## 🎯 **Secciones Alimentadas con Datos Reales**

### **✅ Datos Reales (cuando existen)**
- **KPIs de ventas**: Ventas totales, unidades, márgenes
- **Tendencia mensual**: Datos históricos reales
- **Rendimiento del equipo**: Basado en campo "Agente"
- **Análisis ABC**: Ranking real de productos
- **Simulador**: Proyecciones basadas en datos reales
- **Alertas de consistencia**: Validación de integridad

### **❌ Datos Mock (mantenidos)**
- **Ventas por región**: No disponible en CSV
- **Catálogo de productos**: Estructura diferente
- **Transacciones recientes**: Formato diferente
- **Clientes nuevos**: No calculable

## 🚀 **Deployment y Configuración**

### **1. Configurar Supabase**
```bash
# Ejecutar esquema de base de datos
psql -h [host] -U [user] -d [database] -f backend/database-schema-ventas.sql

# Deploy Edge Functions
supabase functions deploy procesar-analisis-ventas
supabase functions deploy comparar-ventas
```

### **2. Variables de Entorno**
```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

### **3. Configurar RLS**
```sql
-- Las políticas se crean automáticamente con el esquema
-- Verificar que estén activas:
SELECT * FROM pg_policies WHERE tablename = 'ventas_historico';
```

## 📈 **Monitoreo y Logging**

### **Logs de Acceso**
```
[EDGE ACCESS GRANTED] Usuario: admin@example.com - Rol: admin - Fecha: 2025-01-05T16:00:00.000Z
[EDGE ACCESS DENIED] Usuario: user@example.com - Rol: user - Roles requeridos: admin, manager - Razón: Insufficient role
```

### **Logs de Análisis**
```
[ANALISIS VENTAS START] Usuario: admin@example.com - Mes/Año: 12/2024 - Fecha: 2025-01-05T16:00:00.000Z
[ANALISIS VENTAS SUCCESS] Usuario: admin@example.com - Mes/Año: 12/2024 - Fecha: 2025-01-05T16:01:30.000Z
```

### **Logs de Errores**
```
[ANALISIS VENTAS ERROR] Usuario: admin@example.com - Archivo: pedidos.csv - Razón: Invalid file type
[ANALISIS VENTAS CRITICAL ERROR] Error: Missing required column 'Agente' - Stack: ...
```

## 🧪 **Testing y Validación**

### **Archivos de Prueba**
```bash
# Crear archivos CSV de prueba con 2000+ filas
python generate_test_data.py --rows 2500 --output test_data/

# Probar carga
curl -X POST \
  -H "Authorization: Bearer [token]" \
  -F "mes=12" \
  -F "anio=2024" \
  -F "cobranza=@test_data/cobranza.csv" \
  -F "pedidos=@test_data/pedidos.csv" \
  -F "productos=@test_data/productos.csv" \
  https://[project].supabase.co/functions/v1/procesar-analisis-ventas
```

### **Validación de Consistencia**
```bash
# Verificar alertas de consistencia
curl -X POST \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"mes1": 11, "anio1": 2024, "mes2": 12, "anio2": 2024}' \
  https://[project].supabase.co/functions/v1/comparar-ventas
```

## 🔧 **Mantenimiento y Optimización**

### **Limpieza de Datos**
```sql
-- Eliminar datos antiguos (más de 2 años)
DELETE FROM ventas_historico 
WHERE anio < EXTRACT(YEAR FROM NOW()) - 2;

-- Optimizar tabla
VACUUM ANALYZE ventas_historico;
```

### **Monitoreo de Rendimiento**
```sql
-- Verificar tamaño de datos JSONB
SELECT 
  mes, 
  anio, 
  pg_size_pretty(pg_column_size(datos)) as data_size
FROM ventas_historico 
ORDER BY fecha_carga DESC;
```

## 🎯 **Próximos Pasos**

### **Mejoras Futuras**
1. **Procesamiento asíncrono**: Colas para archivos grandes
2. **Caché de resultados**: Redis para consultas frecuentes
3. **Exportación**: PDF, Excel de análisis
4. **Notificaciones**: Email/Slack para alertas
5. **Dashboard en tiempo real**: WebSockets para actualizaciones

### **Escalabilidad**
1. **Particionamiento**: Tablas por año
2. **Archivado**: Datos antiguos a storage
3. **CDN**: Archivos CSV grandes
4. **Load balancing**: Múltiples Edge Functions

---

## ✅ **Checklist de Implementación**

- [x] Edge Function `procesar-analisis-ventas` creada
- [x] Edge Function `comparar-ventas` creada
- [x] Helper `validateUserRole` implementado
- [x] Esquema de base de datos creado
- [x] VentasPage.tsx actualizada
- [x] Formulario de carga implementado
- [x] Validación de archivos CSV
- [x] Cálculo de KPIs reales
- [x] Análisis ABC implementado
- [x] Simulador alimentado con datos reales
- [x] Alertas de consistencia
- [x] RLS y políticas de seguridad
- [x] Logging completo
- [x] Documentación completa

**¡Sistema completamente implementado y listo para producción!** 🚀 