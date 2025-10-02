# Navegación entre Meses - Módulo de Ventas

## Descripción

Se ha implementado un sistema de navegación temporal en el módulo de ventas que permite a los usuarios seleccionar y visualizar datos de diferentes períodos (meses) que ya han sido procesados y almacenados en la base de datos.

## Componentes Implementados

### 1. Función Backend: `obtener-meses-ventas`

**Ubicación:** `supabase/functions/obtener-meses-ventas/index.ts`

**Funcionalidades:**
- `get_available_months`: Obtiene todos los meses con datos procesados disponibles
- `get_month_data`: Obtiene los datos específicos de un mes/año seleccionado

**Seguridad:**
- Validación de autenticación JWT
- Verificación de roles (admin, colaborador)
- Validación de parámetros de entrada
- Manejo robusto de errores

### 2. Hook Personalizado: `useVentasNavigation`

**Ubicación:** `src/hooks/useVentasNavigation.ts`

**Funcionalidades:**
- Gestión del estado de meses disponibles
- Carga automática de datos del mes seleccionado
- Persistencia en localStorage
- Manejo de estados de carga y errores

**Estados gestionados:**
- `mesesDisponibles`: Lista de períodos con datos
- `mesActual`: Período seleccionado actualmente
- `datosMesActual`: Datos del período seleccionado
- `loading`: Estado de carga
- `error`: Errores de navegación

### 3. Componente UI: `MonthSelector`

**Ubicación:** `src/components/sales/MonthSelector.tsx`

**Características:**
- Dropdown interactivo con lista de meses disponibles
- Indicador visual del mes actual
- Información de fecha de carga
- Estados de carga y error
- Accesibilidad (teclado, escape, click fuera)
- Diseño consistente con el sistema

## Integración en VentasPage

### Cambios Realizados

1. **Importación de nuevos componentes:**
   ```typescript
   import { useVentasNavigation } from '@/hooks/useVentasNavigation';
   import { MonthSelector } from '@/components/sales/MonthSelector';
   ```

2. **Uso del hook de navegación:**
   ```typescript
   const { 
     mesesDisponibles, 
     mesActual, 
     datosMesActual, 
     loading: navigationLoading, 
     error: navigationError,
     cambiarAMes 
   } = useVentasNavigation();
   ```

3. **Actualización de la fuente de datos:**
   ```typescript
   const analisisData = useSalesAnalysis(processedData || datosMesActual || rawData);
   ```

4. **Reemplazo del indicador estático por el dropdown:**
   ```tsx
   <MonthSelector
     mesesDisponibles={mesesDisponibles}
     mesActual={mesActual}
     onMonthChange={cambiarAMes}
     loading={navigationLoading}
   />
   ```

## Flujo de Funcionamiento

1. **Carga Inicial:**
   - El hook `useVentasNavigation` se ejecuta al montar el componente
   - Se obtienen todos los meses disponibles con datos procesados
   - Se selecciona automáticamente el mes más reciente

2. **Navegación:**
   - El usuario hace clic en el dropdown del mes actual
   - Se muestra la lista de meses disponibles con fechas de carga
   - Al seleccionar un mes, se cargan los datos específicos de ese período

3. **Persistencia:**
   - El mes seleccionado se guarda en localStorage
   - Al recargar la página, se mantiene la selección

4. **Actualización de Datos:**
   - Los datos del mes seleccionado se cargan automáticamente
   - Todo el dashboard se actualiza con la información del período elegido

## Beneficios

1. **Navegación Temporal:** Los usuarios pueden analizar datos históricos fácilmente
2. **UX Mejorada:** Interfaz intuitiva con dropdown visual
3. **Rendimiento:** Carga eficiente solo de los datos necesarios
4. **Seguridad:** Validación robusta en backend y frontend
5. **Mantenibilidad:** Código modular y reutilizable
6. **Accesibilidad:** Cumple estándares de accesibilidad web

## Consideraciones Técnicas

- **Compatibilidad:** Mantiene compatibilidad con el sistema existente
- **Fallbacks:** Maneja casos donde no hay datos disponibles
- **Optimización:** Evita cargas innecesarias de datos
- **Error Handling:** Manejo robusto de errores en todas las capas
- **TypeScript:** Tipado completo para mejor desarrollo

## Próximas Mejoras Sugeridas

1. **Filtros Avanzados:** Añadir filtros por año o rango de fechas
2. **Comparación:** Permitir comparar datos entre períodos
3. **Caché:** Implementar caché para mejorar rendimiento
4. **Exportación:** Permitir exportar datos de períodos específicos
5. **Notificaciones:** Alertas cuando hay nuevos datos disponibles

