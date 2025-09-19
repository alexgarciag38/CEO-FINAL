# 🔧 Helper Unificado para Edge Functions - Validación de Usuarios y Roles

## 📋 **Descripción General**

Se ha creado un helper unificado `validateUserRole.ts` que centraliza toda la lógica de validación de autenticación y roles para las Edge Functions. Esto elimina la duplicación de código y mantiene consistencia de seguridad en todo el proyecto.

## 🛠️ **Archivo Helper: `backend/utils/validateUserRole.ts`**

### **Funciones Exportadas:**

#### **1. `validateUserRole(req: Request, allowedRoles: string[])`**
Función principal que valida autenticación y roles del usuario.

**Parámetros:**
- `req`: Objeto Request de la Edge Function
- `allowedRoles`: Array de roles permitidos para la función

**Retorna:**
- **Éxito**: `{ user }` - Objeto con el usuario validado
- **Error**: `{ status, body }` - Respuesta de error con código y mensaje

#### **2. `createErrorResponse(validationResult: ValidationError)`**
Helper para crear respuestas de error estandarizadas.

#### **3. `handleCorsPreflight(req: Request)`**
Helper para manejar requests CORS preflight.

## 🔄 **Cómo Usar el Helper en Edge Functions**

### **Patrón Estándar de Implementación:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateUserRole, createErrorResponse, handleCorsPreflight } from '../../utils/validateUserRole.ts';

// ROLES CONFIGURATION
const allowedRoles = ['admin', 'manager', 'super_admin'];

serve(async (req) => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  try {
    // STEP 1: VALIDATE USER AUTHENTICATION AND ROLE
    const validation = await validateUserRole(req, allowedRoles);
    if ('status' in validation) {
      return createErrorResponse(validation);
    }
    const { user } = validation;

    // STEP 2: EXECUTE MAIN LOGIC (only if authentication and role validation pass)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // ... tu lógica principal aquí ...

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: true,
        message: 'Internal server error',
        context: { module: 'your-function', payload: error.message }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

## ✅ **Edge Functions Actualizadas**

### **1. `calculate-abc-analysis`**
- **Roles permitidos**: `['admin', 'manager', 'super_admin']`
- **Estado**: ✅ Actualizada con helper
- **Ubicación**: `backend/functions/calculate-abc-analysis/index.ts`

### **2. `dashboard-analytics`**
- **Roles permitidos**: `['admin', 'manager', 'super_admin', 'user']`
- **Estado**: ✅ Actualizada con helper
- **Ubicación**: `backend/functions/dashboard-analytics/index.ts`

### **3. `procesar-csv-final`**
- **Roles permitidos**: `['admin', 'super_admin']`
- **Estado**: ✅ Actualizada con helper
- **Ubicación**: `backend/functions/procesar-csv-final/index.ts`

## 🔒 **Beneficios de la Implementación**

### **1. Consistencia de Seguridad**
- ✅ Validación idéntica en todas las funciones
- ✅ Códigos de error estandarizados
- ✅ Logging uniforme de accesos

### **2. Mantenibilidad**
- ✅ Un solo lugar para modificar lógica de validación
- ✅ Eliminación de código duplicado
- ✅ Fácil actualización de políticas de seguridad

### **3. Tipado Estricto**
- ✅ TypeScript con tipos bien definidos
- ✅ Interfaces claras para respuestas
- ✅ Detección temprana de errores

### **4. Logging Centralizado**
- ✅ Formato consistente de logs
- ✅ Información detallada de accesos
- ✅ Facilita auditoría y monitoreo

## 📊 **Formato de Logs**

### **Acceso Exitoso:**
```
[EDGE ACCESS GRANTED] Usuario: admin@example.com - Rol: admin - Fecha: 2025-01-05T16:00:00.000Z
```

### **Acceso Denegado:**
```
[EDGE ACCESS DENIED] Usuario: user@example.com - Rol: user - Roles requeridos: admin, super_admin - Razón: Insufficient role - Fecha: 2025-01-05T16:00:00.000Z
```

## 🚨 **Códigos de Error Estándar**

### **401 - No Autenticado**
```json
{
  "error": "No autenticado",
  "code": "UNAUTHORIZED",
  "message": "Invalid authentication token"
}
```

### **403 - Acceso Denegado**
```json
{
  "error": "Acceso denegado",
  "code": "FORBIDDEN",
  "message": "Role 'user' is not authorized. Required roles: admin, super_admin"
}
```

### **500 - Error de Configuración**
```json
{
  "error": "Error de configuración",
  "code": "CONFIG_ERROR",
  "message": "Missing Supabase configuration"
}
```

## 🔧 **Cómo Agregar el Helper a una Nueva Edge Function**

### **Paso 1: Importar el Helper**
```typescript
import { validateUserRole, createErrorResponse, handleCorsPreflight } from '../../utils/validateUserRole.ts';
```

### **Paso 2: Definir Roles Permitidos**
```typescript
const allowedRoles = ['admin', 'manager']; // Ajustar según necesidades
```

### **Paso 3: Implementar Validación**
```typescript
serve(async (req) => {
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const validation = await validateUserRole(req, allowedRoles);
    if ('status' in validation) {
      return createErrorResponse(validation);
    }
    const { user } = validation;

    // Tu lógica principal aquí...
  } catch (error) {
    // Manejo de errores...
  }
});
```

## 🚀 **Deployment y Testing**

### **1. Deploy del Helper**
```bash
# El helper se incluye automáticamente con las Edge Functions
supabase functions deploy
```

### **2. Testing de Validación**
```bash
# Test sin autenticación
curl https://[project].supabase.co/functions/v1/calculate-abc-analysis

# Test con rol incorrecto
curl -H "Authorization: Bearer [token-user]" \
  https://[project].supabase.co/functions/v1/procesar-csv-final

# Test con rol correcto
curl -H "Authorization: Bearer [token-admin]" \
  https://[project].supabase.co/functions/v1/calculate-abc-analysis
```

## 📈 **Monitoreo y Auditoría**

### **Verificar Logs de Acceso**
```bash
# Filtrar logs de acceso
grep "EDGE ACCESS" logs.txt

# Filtrar accesos denegados
grep "EDGE ACCESS DENIED" logs.txt

# Filtrar por función específica
grep "calculate-abc-analysis" logs.txt
```

## ✅ **Checklist de Implementación**

- [x] Helper `validateUserRole.ts` creado
- [x] Función `calculate-abc-analysis` actualizada
- [x] Función `dashboard-analytics` actualizada
- [x] Función `procesar-csv-final` actualizada
- [x] Documentación completa
- [x] Códigos de error estandarizados
- [x] Logging centralizado
- [x] Tipado estricto implementado

## 🎯 **Próximos Pasos**

1. **Deploy** todas las Edge Functions actualizadas
2. **Testear** con diferentes roles de usuario
3. **Monitorear** logs de acceso
4. **Documentar** cualquier nueva Edge Function siguiendo este patrón

---

*Última actualización: Enero 2025* 