Param(
  [Parameter(Mandatory=$true)][string]$ProjectRef,
  [Parameter()][string]$AccessToken = "",
  [switch]$OnlyIncidencias
)

$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[ERR]  $msg" -ForegroundColor Red }

function Ensure-SupabaseCLI {
  if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Info "Instalando Supabase CLI..."
    try {
      iwr https://supabase.com/cli/install/windows -UseBasicParsing | iex
      Write-Ok "Supabase CLI instalado"
    } catch {
      Write-Err "No se pudo instalar Supabase CLI: $($_.Exception.Message)"
      exit 1
    }
  } else {
    Write-Ok "Supabase CLI encontrado"
  }
}

function Do-Login {
  try {
    if ($AccessToken -and $AccessToken.Trim().Length -gt 0) {
      Write-Info "Login con token..."
      supabase login --token $AccessToken | Out-Null
    } else {
      Write-Warn "No se proporcionó token. Se abrirá login interactivo si es necesario."
      supabase login | Out-Null
    }
    Write-Ok "Login correcto"
  } catch {
    Write-Err "Fallo en login: $($_.Exception.Message)"
    exit 1
  }
}

function Link-Project {
  try {
    Write-Info "Vinculando proyecto ($ProjectRef)..."
    supabase link --project-ref $ProjectRef | Out-Null
    Write-Ok "Proyecto vinculado"
  } catch {
    Write-Err "Fallo al vincular proyecto: $($_.Exception.Message)"
    exit 1
  }
}

function Db-Push {
  try {
    Write-Info "Aplicando migraciones (db push)..."
    supabase db push | Out-Null
    Write-Ok "Migraciones aplicadas"
  } catch {
    Write-Err "Fallo en db push: $($_.Exception.Message)"
    exit 1
  }
}

function Deploy-Functions {
  $failed = @()
  if ($OnlyIncidencias) {
    $functions = @(
      'employees-create','employees-get','employees-update','employees-delete',
      'incident-types-create','incident-types-get','incident-types-update','incident-types-delete',
      'incidents-create','incidents-get','incidents-get-details','incidents-update','incidents-delete','incidents-dashboard',
      'incident-comments-create','incident-comments-get'
    )
  } else {
    # Desplegar todas las funciones del repo excepto la carpeta _shared
    $functions = Get-ChildItem "$PSScriptRoot\..\supabase\functions" -Directory |
      Where-Object { $_.Name -ne '_shared' } |
      Select-Object -ExpandProperty Name
  }

  foreach ($fn in $functions) {
    try {
      Write-Info "Desplegando función: $fn"
      supabase functions deploy $fn | Out-Null
      Write-Ok "Desplegada: $fn"
    } catch {
      Write-Err "Fallo: $fn => $($_.Exception.Message)"
      $failed += $fn
    }
  }

  if ($failed.Count -gt 0) {
    Write-Warn ("Funciones con error: " + ($failed -join ', '))
    exit 1
  }
}

# MAIN
try {
  # Posicionarse en la raíz del repo
  Set-Location "$PSScriptRoot\.." | Out-Null

  Ensure-SupabaseCLI
  Do-Login
  Link-Project
  Db-Push
  Deploy-Functions

  Write-Ok "Todo listo. Puedes ejecutar 'pnpm dev' para iniciar la app."
} catch {
  Write-Err "Error no controlado: $($_.Exception.Message)"
  exit 1
}


