# CEO Final - Dashboard Ejecutivo Empresarial

![CEO Final Logo](https://img.shields.io/badge/CEO%20Final-Dashboard%20Ejecutivo-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![Status](https://img.shields.io/badge/status-Production%20Ready-success?style=for-the-badge)

## 🚀 Aplicación Desplegada

**URL de Producción**: [https://tyqsfenp.manus.space](https://tyqsfenp.manus.space)

**Credenciales de Demo**:
- Email: `admin@ceofinal.com`
- Contraseña: `password123`

## 📋 Descripción

CEO Final es un dashboard ejecutivo empresarial completo desarrollado con React y TypeScript, diseñado para proporcionar análisis integral de métricas empresariales, visualizaciones interactivas y herramientas de inteligencia de negocio.

### ✨ Características Principales

- **Dashboard Ejecutivo**: Métricas KPI en tiempo real con visualizaciones interactivas
- **Módulo de Ventas**: Análisis ABC, simulador de ventas y gestión de productos
- **Módulo Financiero**: Estados financieros, ratios y análisis de flujo de caja
- **Módulo Marketing**: Gestión de campañas, análisis de ROI y embudo de conversión
- **Módulo CRM**: Gestión de clientes, leads y pipeline de ventas
- **Módulo RRHH**: Gestión de empleados, reclutamiento y nóminas
- **Módulo Estratégico**: Objetivos, iniciativas y análisis de riesgos
- **Procesamiento CSV**: Carga y validación segura de datos empresariales
- **Asistente IA**: Chatbot inteligente para análisis de datos y recomendaciones
- **Autenticación Segura**: Sistema robusto con rate limiting y 2FA

## 🏗️ Arquitectura Técnica

### Frontend
- **React 18** con TypeScript
- **Vite** para build y desarrollo
- **TailwindCSS** para estilos
- **Recharts** para visualizaciones
- **React Router** para navegación
- **Zod** para validación de datos
- **React Hook Form** para formularios

### Backend
- **Supabase** como BaaS (Backend as a Service)
- **PostgreSQL** con Row Level Security (RLS)
- **Edge Functions** para lógica de negocio
- **Autenticación JWT** integrada

### Seguridad
- Validación doble (frontend/backend)
- Sanitización automática de datos
- Protección XSS y CSRF
- Rate limiting en autenticación
- Detección de contenido malicioso

## 📊 Módulos Implementados

### 1. Dashboard Ejecutivo
- 6 KPIs principales con tendencias
- 4 métricas financieras adicionales
- Gráficas interactivas (línea, pie, barras, área)
- Actividad reciente en tiempo real
- Top productos con análisis de rendimiento

### 2. Módulo de Ventas
- **Resumen**: KPIs de ventas y tendencias
- **Análisis ABC**: Clasificación automática de productos (74.1% A, 18.9% B, 7.0% C)
- **Simulador**: Proyecciones con 7 variables ajustables
- **Productos**: Catálogo con métricas de rendimiento
- **Equipo**: Rendimiento individual de vendedores

### 3. Módulo Financiero
- **P&L**: Estado de pérdidas y ganancias
- **Balance**: Balance general con activos/pasivos
- **Flujo de Caja**: Análisis de liquidez mensual
- **Ratios**: Indicadores de rentabilidad y eficiencia
- **Presupuesto**: Comparación presupuesto vs real

### 4. Módulo Marketing
- **Campañas**: Gestión de 6 tipos de campañas
- **Canales**: Análisis de ROI por canal
- **Embudo**: Customer journey completo
- **Audiencia**: Segmentación de 4 grupos
- **Competencia**: Análisis comparativo

### 5. Módulo CRM
- Gestión completa de clientes y leads
- Pipeline de ventas con etapas
- Análisis de oportunidades
- Seguimiento de interacciones

### 6. Módulo RRHH
- Gestión de 127 empleados
- Reclutamiento y onboarding
- Evaluaciones de rendimiento
- Gestión de nóminas y beneficios

### 7. Módulo Estratégico
- Objetivos estratégicos (73.5% cumplidos)
- Iniciativas y proyectos
- Análisis de riesgos (crítico/alto/medio/bajo)
- Análisis de mercado (15.2% cuota)

## 🔒 Seguridad Implementada

### Autenticación y Autorización
- Sistema Supabase Auth con JWT tokens
- Row Level Security (RLS) en base de datos
- Rate limiting (5 intentos, 15 min lockout)
- Sesiones configurables (15-480 minutos)

### Validación de Datos
- Esquemas Zod para validación estricta
- Sanitización automática de entrada
- Detección de contenido malicioso
- Límites de tamaño de archivo (25MB)

### Protección de Archivos CSV
- Validación de tipos (.csv, .xlsx, .xls)
- Escaneo de amenazas de seguridad
- Limpieza automática de datos
- Vista previa segura de contenido

## 🤖 Asistente de IA

El chatbot integrado proporciona:
- Análisis contextual de métricas empresariales
- Recomendaciones estratégicas basadas en datos
- Interpretación de gráficas y tendencias
- Ayuda con procesamiento de CSV
- Respuestas inteligentes por módulo

**Ejemplos de consultas**:
- "Analizar ventas del mes"
- "Revisar métricas de marketing"
- "Estado financiero actual"
- "Recomendaciones estratégicas"

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- pnpm (recomendado) o npm
- Cuenta de Supabase

### Configuración Local

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd ceo-final
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

4. **Iniciar desarrollo**
```bash
pnpm run dev
```

5. **Construir para producción**
```bash
pnpm run build
```

### Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development
```

## 📁 Estructura del Proyecto

```
ceo-final/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ai/             # Chatbot y asistente IA
│   │   ├── charts/         # Componentes de gráficas
│   │   ├── csv/            # Procesamiento de CSV
│   │   ├── layout/         # Layout y navegación
│   │   ├── sales/          # Componentes de ventas
│   │   └── ui/             # Componentes UI base
│   ├── contexts/           # Contextos de React
│   ├── data/              # Datos mock y tipos
│   ├── lib/               # Configuración de librerías
│   ├── pages/             # Páginas de la aplicación
│   │   ├── auth/          # Autenticación
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── ventas/        # Módulo de ventas
│   │   ├── financiero/    # Módulo financiero
│   │   ├── marketing/     # Módulo marketing
│   │   ├── crm/           # Módulo CRM
│   │   ├── rrhh/          # Módulo RRHH
│   │   ├── estrategico/   # Módulo estratégico
│   │   └── settings/      # Configuración
│   ├── routes/            # Configuración de rutas
│   ├── types/             # Definiciones TypeScript
│   └── utils/             # Utilidades y validación
├── backend/               # Configuración Supabase
│   ├── database-schema.sql
│   └── functions/         # Edge Functions
├── public/                # Archivos estáticos
├── SECURITY.md           # Documentación de seguridad
└── README.md             # Este archivo
```

## 🧪 Testing y Calidad

### Auditoría de Seguridad
- ✅ 2 vulnerabilidades de severidad baja (aceptable)
- ✅ Validación de entrada implementada
- ✅ Protección XSS y CSRF activa
- ✅ Autenticación y autorización robusta

### Build de Producción
- ✅ Bundle optimizado (1.1MB gzipped: 302.91KB)
- ✅ TypeScript compilation exitosa
- ✅ Todas las dependencias resueltas
- ✅ Assets optimizados

### Testing Funcional
- ✅ Todos los módulos funcionando
- ✅ Navegación entre páginas
- ✅ Autenticación en producción
- ✅ Gráficas y visualizaciones
- ✅ Chatbot IA operativo
- ✅ Procesamiento CSV funcional

## 📈 Métricas de Rendimiento

### Datos de Ejemplo Incluidos
- **12 productos** con análisis ABC
- **127 empleados** con métricas de RRHH
- **6 campañas** de marketing activas
- **5 vendedores** con objetivos y rendimiento
- **Transacciones** de los últimos 6 meses
- **Estados financieros** completos

### KPIs Principales
- Ingresos: €1.268.000 (+12.5%)
- Órdenes: 2,847 (+8.3%)
- Clientes activos: 1,890 (+15.7%)
- Satisfacción: 4.6/5 (+0.3)
- ROE: 22.3%
- Cuota de mercado: 15.2%

## 🔧 Configuración Avanzada

### Personalización de Temas
El sistema utiliza TailwindCSS con paleta corporativa:
- Primario: Azul (#3B82F6)
- Secundario: Gris (#6B7280)
- Éxito: Verde (#10B981)
- Advertencia: Amarillo (#F59E0B)
- Error: Rojo (#EF4444)

### Configuración de Supabase
1. Crear proyecto en Supabase
2. Ejecutar `database-schema.sql`
3. Configurar RLS policies
4. Desplegar Edge Functions
5. Configurar autenticación

## 📞 Soporte y Contacto

### Reportar Issues
- **Seguridad**: security@ceofinal.com
- **Bugs**: Crear issue en el repositorio
- **Features**: Solicitudes de mejora

### Documentación Adicional
- [SECURITY.md](./SECURITY.md) - Documentación de seguridad
- [Backend Schema](./backend/database-schema.sql) - Esquema de base de datos
- [Edge Functions](./backend/functions/) - Funciones serverless

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo LICENSE para más detalles.

## 🙏 Agradecimientos

Desarrollado con las mejores prácticas de seguridad, arquitectura limpia y experiencia de usuario optimizada para ejecutivos y tomadores de decisiones empresariales.

---

**CEO Final Dashboard** - Transformando datos en decisiones estratégicas.

*Última actualización: Agosto 2025*

