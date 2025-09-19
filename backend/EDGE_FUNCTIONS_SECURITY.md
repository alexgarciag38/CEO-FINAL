# 🛡️ Seguridad en Edge Functions - Validación de Roles

## 📋 **Configuración de Seguridad Implementada**

Todas las Edge Functions del proyecto ahora implementan un sistema de validación de roles estricto que se ejecuta **ANTES** de cualquier lógica principal.

## 🔐 **Patrón de Seguridad Implementado**

### **Paso 1: Verificación de Autenticación**
```typescript
// Verificar que existe el header de autorización
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ 
      error: 'No autenticado', 
      code: 'UNAUTHORIZED',
      message: 'No authorization header provided'
    }),
    { status: 401, headers: corsHeaders }
  );
}

// Obtener usuario desde el token
const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
if (userError || !user) {
  return new Response(
    JSON.stringify({ 
      error: 'No autenticado', 
      code: 'UNAUTHORIZED',
      message: 'Invalid authentication token'
    }),
    { status: 401, headers: corsHeaders }
  );
}
```

### **Paso 2: Validación de Roles**
```typescript
// Configurar roles permitidos
const allowedRoles = ['admin', 'manager', 'super_admin'];

// Validar rol del usuario
const userRole = user.user_metadata?.role;
if (!userRole || !allowedRoles.includes(userRole)) {
  return new Response(
    JSON.stringify({ 
      error: 'Acceso denegado', 
      code: 'FORBIDDEN',
      message: `Role '${userRole || 'N/A'}' is not authorized. Required roles: ${allowedRoles.join(', ')}`
    }),
    { status: 403, headers: corsHeaders }
  );
}
```

### **Paso 3: Logging de Accesos**
```typescript
// Log de acceso exitoso
logAccessAttempt('function-name', user, allowedRoles, true);

// Log de acceso denegado
logAccessAttempt('function-name', user, allowedRoles, false, 'Insufficient role');
```

### **Paso 4: Ejecución de Lógica Principal**
```typescript
// Solo se ejecuta si pasa autenticación y validación de roles
// ... lógica principal de la función
```

## 🎯 **Configuración de Roles por Función**

### **1. calculate-abc-analysis**
- **Roles permitidos**: `['admin', 'manager', 'super_admin']`
- **Justificación**: Análisis financiero sensible que requiere permisos elevados
- **Ubicación**: `backend/functions/calculate-abc-analysis/index.ts`

### **2. dashboard-analytics**
- **Roles permitidos**: `['admin', 'manager', 'super_admin', 'user']`
- **Justificación**: Analytics general accesible a todos los usuarios autenticados
- **Ubicación**: `backend/functions/dashboard-analytics/index.ts`

### **3. procesar-csv-final**
- **Roles permitidos**: `['admin', 'super_admin']`
- **Justificación**: Procesamiento de datos CSV es una operación crítica
- **Ubicación**: `backend/functions/procesar-csv-final/index.ts`

## 📊 **Logging de Accesos**

### **Formato de Logs Exitosos**
```
[EDGE ACCESS GRANTED] Function: function-name - Usuario: user@example.com - Rol: admin - Fecha: 2025-01-05T16:00:00.000Z
```

### **Formato de Logs Denegados**
```
[EDGE ACCESS DENIED] Function: function-name - Usuario: user@example.com - Rol: user - Roles requeridos: admin, super_admin - Razón: Insufficient role - Fecha: 2025-01-05T16:00:00.000Z
```

## 🔧 **Cómo Modificar Roles Permitidos**

### **Para cambiar los roles de una función:**

1. **Localizar la función** en `backend/functions/[function-name]/index.ts`
2. **Encontrar la configuración**:
   ```typescript
   const allowedRoles = ['admin', 'manager', 'super_admin'];
   ```
3. **Modificar el array** según los roles que necesiten acceso
4. **Deployar la función** actualizada

### **Ejemplo de modificación:**
```typescript
// Antes: Solo admins
const allowedRoles = ['admin', 'super_admin'];

// Después: Incluir managers
const allowedRoles = ['admin', 'manager', 'super_admin'];
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

## 🔒 **Consideraciones de Seguridad**

### **1. Validación en Múltiples Capas**
- ✅ **Frontend**: ProtectedRoute valida roles
- ✅ **Edge Functions**: Validación estricta antes de ejecutar lógica
- ✅ **Database**: Row Level Security (RLS) policies
- ✅ **API**: Validación en endpoints

### **2. No Confiar Solo en Frontend**
```typescript
// SECURITY NOTE: This frontend validation is a first line of defense.
// For complete security, implement equivalent role validation in:
// - Backend API endpoints
// - Supabase Row Level Security (RLS) policies
// - Edge Functions for sensitive operations
// - Database triggers for critical data access
```

### **3. Logging Completo**
- Todos los intentos de acceso se registran
- Incluye timestamp, usuario, rol y razón
- Facilita auditoría y detección de intrusiones

## 📈 **Monitoreo y Auditoría**

### **Verificar Logs de Acceso**
```bash
# En los logs de Supabase Edge Functions
grep "EDGE ACCESS" logs.txt

# Filtrar por función específica
grep "calculate-abc-analysis" logs.txt

# Filtrar accesos denegados
grep "EDGE ACCESS DENIED" logs.txt
```

### **Métricas de Seguridad**
- **Accesos exitosos** vs **accesos denegados**
- **Usuarios por rol** que acceden a cada función
- **Patrones de acceso** sospechosos
- **Intentos de acceso** fuera de horario

## 🚀 **Deployment y Testing**

### **1. Deploy de Funciones**
```bash
# Deploy todas las funciones
supabase functions deploy

# Deploy función específica
supabase functions deploy calculate-abc-analysis
```

### **2. Testing de Seguridad**
```bash
# Test con usuario sin rol
curl -H "Authorization: Bearer [token-sin-rol]" \
  https://[project].supabase.co/functions/v1/calculate-abc-analysis

# Test con usuario con rol incorrecto
curl -H "Authorization: Bearer [token-user]" \
  https://[project].supabase.co/functions/v1/procesar-csv-final

# Test con usuario autorizado
curl -H "Authorization: Bearer [token-admin]" \
  https://[project].supabase.co/functions/v1/calculate-abc-analysis
```

## ✅ **Verificación de Implementación**

### **Checklist de Seguridad**
- [ ] Todas las Edge Functions tienen validación de roles
- [ ] Los roles están configurados apropiadamente por función
- [ ] Los logs de acceso están funcionando
- [ ] Los códigos de error son consistentes
- [ ] La documentación está actualizada
- [ ] Los tests de seguridad pasan

---

## 🎯 **Beneficios de esta Implementación**

1. **🔒 Seguridad Reforzada**: Validación estricta antes de ejecutar lógica
2. **📊 Auditoría Completa**: Logs detallados de todos los accesos
3. **⚡ Control Granular**: Roles específicos por función
4. **🛡️ Defensa en Profundidad**: Múltiples capas de validación
5. **📈 Monitoreo**: Detección temprana de intentos no autorizados

---

*Última actualización: Enero 2025* 