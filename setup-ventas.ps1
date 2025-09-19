# Script de Configuracion del Sistema de Analisis de Ventas
# CEO Final - Setup Automatizado

Write-Host "Configurando Sistema de Analisis de Ventas..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "Error: No se encontro package.json. Ejecuta este script desde la raiz del proyecto." -ForegroundColor Red
    exit 1
}

# Verificar que existe el archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "Error: No se encontro el archivo .env. Crea uno con tus credenciales de Supabase." -ForegroundColor Red
    Write-Host "Ejemplo:" -ForegroundColor Yellow
    Write-Host "VITE_SUPABASE_URL=https://tu-proyecto.supabase.co" -ForegroundColor Yellow
    Write-Host "VITE_SUPABASE_ANON_KEY=tu-anon-key" -ForegroundColor Yellow
    exit 1
}

Write-Host "Verificaciones basicas completadas" -ForegroundColor Green

# Verificar que los archivos necesarios existen
$requiredFiles = @(
    "backend/database-schema-ventas.sql",
    "backend/functions/procesar-analisis-ventas/index.ts",
    "backend/functions/comparar-ventas/index.ts",
    "src/pages/ventas/VentasPage.tsx",
    "ejemplos/cobranza.csv",
    "ejemplos/pedidos.csv",
    "ejemplos/productos-utilidad.csv"
)

Write-Host "Verificando archivos del sistema..." -ForegroundColor Blue

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "OK: $file" -ForegroundColor Green
    } else {
        Write-Host "ERROR: $file - NO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "PROXIMOS PASOS MANUALES:" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Crear tabla en Supabase:" -ForegroundColor Cyan
Write-Host "   - Ve a tu dashboard de Supabase"
Write-Host "   - SQL Editor -> Copia y ejecuta: backend/database-schema-ventas.sql"
Write-Host ""
Write-Host "2. Desplegar Edge Functions:" -ForegroundColor Cyan
Write-Host "   - Edge Functions -> Create new function"
Write-Host "   - Nombre: 'procesar-analisis-ventas'"
Write-Host "   - Copia contenido de: backend/functions/procesar-analisis-ventas/index.ts"
Write-Host "   - Repite para 'comparar-ventas'"
Write-Host ""
Write-Host "3. Configurar usuario administrador:" -ForegroundColor Cyan
Write-Host "   - Authentication -> Users -> Add user"
Write-Host "   - Asigna rol 'admin' via SQL"
Write-Host ""
Write-Host "4. Probar el sistema:" -ForegroundColor Cyan
Write-Host "   - npm run dev"
Write-Host "   - Ve a Ventas -> Cargar Datos"
Write-Host "   - Usa los archivos CSV de ejemplo en: ejemplos/"
Write-Host ""
Write-Host "Guia completa: GUIA_DESPLEGUE_VENTAS.md" -ForegroundColor Magenta
Write-Host ""
Write-Host "Configuracion local completada!" -ForegroundColor Green
Write-Host "Continua con los pasos manuales para completar el despliegue." -ForegroundColor Yellow 