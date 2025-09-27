import React from 'react';

// Iconos SVG profesionales
const MoneyIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const DocumentTextIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ExclamationTriangleIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

interface DashboardCardProps {
  title: string;
  value: number;
  subtitle?: string;
  type: 'dinero' | 'ingresos' | 'pagos' | 'flujo' | 'vencidos';
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  type,
  onClick
}) => {
  // Función para obtener el icono según el tipo
  const getIcon = () => {
    switch (type) {
      case 'dinero':
        return <MoneyIcon />;
      case 'ingresos':
        return <TrendingUpIcon />;
      case 'pagos':
        return <DocumentTextIcon />;
      case 'flujo':
        return <ChartBarIcon />;
      case 'vencidos':
        return <ExclamationTriangleIcon />;
      default:
        return <ChartBarIcon />;
    }
  };
  // Configuración de colores por tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'dinero':
        return {
          borderColor: '#3B82F6', // blue-500
          iconColor: '#3B82F6',
          valueColor: '#111827' // gray-900
        };
      case 'ingresos':
        return {
          borderColor: '#10B981', // emerald-500
          iconColor: '#10B981',
          valueColor: '#111827'
        };
      case 'pagos':
        return {
          borderColor: '#F59E0B', // amber-500
          iconColor: '#F59E0B',
          valueColor: '#111827'
        };
      case 'flujo':
        const isPositive = value >= 0;
        return {
          borderColor: isPositive ? '#10B981' : '#EF4444', // emerald-500 or red-500
          iconColor: '#6B7280', // gray-500
          valueColor: isPositive ? '#10B981' : '#EF4444'
        };
      case 'vencidos':
        return {
          borderColor: '#EF4444', // red-500
          iconColor: '#EF4444',
          valueColor: '#111827'
        };
      default:
        return {
          borderColor: '#E5E7EB',
          iconColor: '#6B7280',
          valueColor: '#111827'
        };
    }
  };

  const config = getTypeConfig();
  const formattedValue = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(value));

  return (
    <div 
      className={`
        bg-white border border-gray-200 rounded-xl shadow-md p-6 relative
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''}
      `}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: config.borderColor
      }}
      onClick={onClick}
    >
      {/* Icono */}
      <div 
        className="mb-4"
        style={{ color: config.iconColor }}
      >
        {getIcon()}
      </div>

      {/* Título */}
      <div 
        className="text-sm font-medium mb-2"
        style={{ color: '#6B7281' }}
      >
        {title}
      </div>

      {/* Valor Principal */}
      <div 
        className="text-4xl font-bold mb-2"
        style={{ color: config.valueColor }}
      >
        {formattedValue}
      </div>

      {/* Dato Secundario */}
      {subtitle && (
        <div 
          className="text-sm"
          style={{ color: '#6B7281' }}
        >
          {subtitle}
        </div>
      )}

      {/* Botón "Ver detalles" para Saldos Vencidos */}
      {type === 'vencidos' && onClick && (
        <button 
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Ver detalles
        </button>
      )}
    </div>
  );
};

export default DashboardCard;
