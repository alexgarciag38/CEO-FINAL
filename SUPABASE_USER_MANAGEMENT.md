# 🛡️ Gestión de Usuarios en Supabase - Sistema Cerrado

## 📋 **Configuración del Sistema Cerrado**

Este sistema está configurado como **cerrado**, lo que significa que solo los administradores pueden crear usuarios directamente desde el dashboard de Supabase.

## 🔐 **Crear Usuarios desde Supabase Dashboard**

### 1. **Acceder al Dashboard de Supabase**
- Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Selecciona tu proyecto: `ceo-final`
- Ve a **Authentication** → **Users**

### 2. **Crear Usuario Manualmente**
1. Haz clic en **"Add user"**
2. Completa los campos:
   - **Email**: `usuario@empresa.com`
   - **Password**: `ContraseñaSegura123!`
   - **Email confirm**: ✅ (marcar para confirmar automáticamente)

### 3. **Asignar Rol al Usuario**
1. Ve a **SQL Editor**
2. Ejecuta esta consulta para asignar rol:

```sql
-- Asignar rol 'admin' a un usuario específico
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', '"admin"'
) 
WHERE email = 'admin@ceofinal.com';

-- Asignar rol 'manager' a un usuario específico
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', '"manager"'
) 
WHERE email = 'manager@empresa.com';

-- Asignar rol 'user' a un usuario específico
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', '"user"'
) 
WHERE email = 'usuario@empresa.com';
```

## 🎯 **Roles Disponibles**

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `super_admin` | Super Administrador | Acceso total a todo el sistema |
| `admin` | Administrador | Gestión de usuarios y configuración |
| `manager` | Gerente | Acceso a módulos de gestión |
| `user` | Usuario | Acceso básico a dashboard |

## 🔧 **Configurar Row Level Security (RLS)**

### 1. **Habilitar RLS en tablas**
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
```

### 2. **Políticas de acceso por rol**
```sql
-- Política para super_admin (acceso total)
CREATE POLICY "super_admin_all_access" ON public.profiles
FOR ALL USING (
  auth.jwt() ->> 'role' = 'super_admin'
);

-- Política para admin (acceso a usuarios de su nivel o inferior)
CREATE POLICY "admin_limited_access" ON public.profiles
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'role' = 'manager' OR
  auth.jwt() ->> 'role' = 'user'
);

-- Política para manager (acceso limitado)
CREATE POLICY "manager_limited_access" ON public.profiles
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'manager' OR
  auth.jwt() ->> 'role' = 'user'
);
```

## 📊 **Monitoreo de Usuarios**

### 1. **Ver usuarios activos**
```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users 
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

### 2. **Ver intentos de login fallidos**
```sql
SELECT 
  user_id,
  ip_address,
  user_agent,
  created_at
FROM auth.audit_log_entries 
WHERE event_type = 'login_failed'
ORDER BY created_at DESC;
```

## 🚨 **Seguridad Adicional**

### 1. **Configurar autenticación**
- Ve a **Authentication** → **Settings**
- Configura:
  - **Enable email confirmations**: ✅
  - **Enable phone confirmations**: ❌
  - **Enable signup**: ❌ (deshabilitado para sistema cerrado)

### 2. **Configurar políticas de contraseñas**
- **Minimum password length**: 8
- **Require uppercase letters**: ✅
- **Require lowercase letters**: ✅
- **Require numbers**: ✅
- **Require special characters**: ✅

## 📞 **Proceso para Nuevos Usuarios**

1. **Solicitud**: Usuario solicita acceso al administrador
2. **Creación**: Administrador crea usuario en Supabase
3. **Asignación de rol**: Administrador asigna rol apropiado
4. **Notificación**: Administrador envía credenciales al usuario
5. **Primer login**: Usuario cambia contraseña en primer acceso

## 🔄 **Mantenimiento**

### **Revisión mensual de usuarios**
```sql
-- Usuarios inactivos (sin login en 30 días)
SELECT 
  email,
  last_sign_in_at,
  created_at
FROM auth.users 
WHERE last_sign_in_at < NOW() - INTERVAL '30 days'
AND deleted_at IS NULL;
```

### **Backup de usuarios**
```sql
-- Exportar lista de usuarios activos
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users 
WHERE deleted_at IS NULL
ORDER BY email;
```

---

## ✅ **Ventajas del Sistema Cerrado**

- 🔒 **Control total** sobre quién tiene acceso
- 🛡️ **Seguridad mejorada** sin registro público
- 📊 **Auditoría completa** de todos los accesos
- 🎯 **Roles específicos** para cada usuario
- 🚫 **Sin usuarios no deseados** o spam

---

*Última actualización: Enero 2025* 