import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPI } from '@/types';

interface KPICardProps {
  kpi: KPI;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showChange?: boolean;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  kpi,
  className = '',
  size = 'md',
  showIcon = true,
  showChange = true,
  onClick
}) => {
  // Format value based on type
  const formatValue = (value: number | string, format: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      case 'number':
        return new Intl.NumberFormat('es-ES').format(value);
      
      default:
        return value.toString();
    }
  };

  // Get change indicator
  const getChangeIndicator = () => {
    if (!kpi.change || !showChange) return null;
    
    const changeValue = Math.abs(kpi.change);
    const changeText = kpi.format === 'percentage' ? `${changeValue}%` : `${changeValue}`;
    
    switch (kpi.changeType) {
      case 'increase':
        return (
          <div className="flex items-center text-green-600 text-sm font-medium">
            <TrendingUp className="w-4 h-4 mr-1" />
            +{changeText}
          </div>
        );
      
      case 'decrease':
        return (
          <div className="flex items-center text-red-600 text-sm font-medium">
            <TrendingDown className="w-4 h-4 mr-1" />
            -{changeText}
          </div>
        );
      
      case 'neutral':
        return (
          <div className="flex items-center text-gray-600 text-sm font-medium">
            <Minus className="w-4 h-4 mr-1" />
            {changeText}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* KPI Title */}
          <h3 className="text-sm text-gray-600 font-medium mb-2">
            {kpi.title}
          </h3>
          
          {/* KPI Value */}
          <div className={`${valueSizeClasses[size]} font-bold text-gray-900 mb-2`}>
            {formatValue(kpi.value, kpi.format || 'number')}
          </div>
          
          {/* Change Indicator */}
          {getChangeIndicator()}
        </div>
        
        {/* Icon */}
        {showIcon && kpi.icon && (
          <div className="ml-4">
            <div className="bg-blue-100 rounded-lg p-3">
              {/* Dynamic icon rendering would require icon mapping */}
              <div className={`${iconSizeClasses[size]} text-blue-600`}>
                {/* Placeholder for icon - in real implementation, use icon mapping */}
                <div className="w-full h-full bg-blue-600 rounded opacity-20" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Additional info or description */}
      {kpi.change && showChange && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Comparado con el período anterior
          </p>
        </div>
      )}
    </div>
  );
};

// KPI Grid component for displaying multiple KPIs
interface KPIGridProps {
  kpis: KPI[];
  columns?: 1 | 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onKPIClick?: (kpi: KPI) => void;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  columns = 4,
  size = 'md',
  className = '',
  onKPIClick
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.id}
          kpi={kpi}
          size={size}
          onClick={onKPIClick ? () => onKPIClick(kpi) : undefined}
        />
      ))}
    </div>
  );
};

// Compact KPI component for smaller spaces
export const CompactKPI: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  className?: string;
}> = ({ title, value, change, changeType, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
        
        {change && changeType && (
          <div className={`text-sm font-medium ${
            changeType === 'increase' ? 'text-green-600' :
            changeType === 'decrease' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {changeType === 'increase' && '+'}
            {changeType === 'decrease' && '-'}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
};

