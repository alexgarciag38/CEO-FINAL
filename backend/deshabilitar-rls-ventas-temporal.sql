-- ========================================
-- DESHABILITAR RLS TEMPORALMENTE PARA VENTAS
-- ========================================

-- Deshabilitar RLS en ventas_historico (sin restricciones)
ALTER TABLE ventas_historico DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en conversaciones_ia (sin restricciones)
ALTER TABLE conversaciones_ia DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en usuarios (sin restricciones)
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Verificar el estado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('ventas_historico', 'conversaciones_ia', 'usuarios')
  AND schemaname = 'public';

-- Mostrar mensaje de confirmación
SELECT 'RLS DESHABILITADO TEMPORALMENTE' as estado; 