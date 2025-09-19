import React from 'react';
import { 
  getColorByValue, 
  getCardSize, 
  getCriticalBadge, 
  formatValue,
  getPerformanceEmoji 
} from '@/utils/visualHelpers';
import { Speedometer } from './Speedometer';
import { AnimatedNumber } from './AnimatedNumber';

interface EnhancedKPICardProps {
  title: string;
  value: number;
  type: 'margen' | 'cartera' | 'ventas' | 'utilidad';
  format: 'currency' | 'percentage' | 'number';
  icon?: React.ReactNode;
  showSpeedometer?: boolean;
  maxValue?: number;
  average?: number;
  className?: string;
  compact?: boolean;
  // Visual overrides
  backgroundClass?: string;
  borderClass?: string;
  valueTextClass?: string;
  colSpan?: 1 | 2; // to approximate 1.5x
  // Secondary and helpers
  secondaryValue?: number;
  secondaryFormat?: 'currency' | 'percentage' | 'number';
  secondaryLabel?: string;
  trendText?: string; // e.g., "↗️ +12.5% vs mes anterior"
  extraLines?: string[]; // additional context
}

export const EnhancedKPICard: React.FC<EnhancedKPICardProps> = ({
  title,
  value,
  type,
  format,
  icon,
  showSpeedometer = false,
  maxValue = 100,
  average,
  className = '',
  compact = true,
  backgroundClass,
  borderClass,
  valueTextClass,
  colSpan,
  secondaryValue,
  secondaryFormat = 'percentage',
  secondaryLabel,
  trendText,
  extraLines = []
}) => {
  const colorClasses = getColorByValue(value, type);
  const sizeClasses = colSpan === 2 ? 'col-span-2' : getCardSize(type, value, value > 50000);
  const criticalBadge = getCriticalBadge(value, type === 'cartera' ? 50000 : type === 'margen' ? 20 : 100000);
  const performanceEmoji = average ? getPerformanceEmoji(value, average) : '';
  const isCritical = value > (type === 'cartera' ? 50000 : type === 'margen' ? 20 : 100000);

  const containerBase = `bg-white rounded-lg shadow-sm border ${compact ? 'p-4' : 'p-6'} card-hover fade-in`;
  const containerColor = `${backgroundClass ? backgroundClass : ''} ${borderClass ? borderClass : ''}`;

  return (
    <div className={`${containerBase} ${containerColor || colorClasses} ${sizeClasses} ${isCritical ? 'ring-2 ring-red-200 critical-pulse' : ''} ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {criticalBadge && (
            <span className={`${compact ? 'text-base' : 'text-lg'} animate-pulse`} title="Métrica crítica">
              {criticalBadge}
            </span>
          )}
          {performanceEmoji && (
            <span className="text-xs" title={`vs promedio: ${average?.toLocaleString()}`}>
              {performanceEmoji}
            </span>
          )}
        </div>
      </div>

      {/* Value Display */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`${compact ? 'text-xl' : 'text-2xl'} font-extrabold mb-1 ${valueTextClass || ''}`}>
            <AnimatedNumber 
              value={value} 
              format={format} 
              duration={1200}
              className={valueTextClass || (colorClasses.includes('text-red') ? 'text-red-600' : colorClasses.includes('text-yellow') ? 'text-yellow-600' : 'text-green-600')}
            />
          </div>
          {trendText && (
            <div className="text-[10px] text-gray-600 mb-1">{trendText}</div>
          )}
          {secondaryValue !== undefined && (
            <div className="text-[11px] text-gray-700">
              {formatValue(secondaryValue, secondaryFormat)}{secondaryLabel ? ` ${secondaryLabel}` : ''}
            </div>
          )}
          {average && (
            <div className="text-[10px] text-gray-500">
              vs {formatValue(average, format)} promedio
            </div>
          )}
          {extraLines.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {extraLines.map((line, idx) => (
                <div key={idx} className="text-[10px] text-gray-600">{line}</div>
              ))}
            </div>
          )}
        </div>

        {showSpeedometer && format === 'percentage' && (
          <div className={compact ? 'ml-2 scale-90' : 'ml-4'}>
            <Speedometer
              value={value}
              maxValue={maxValue}
              label=""
              color={value < 20 ? 'red' : value < 30 ? 'yellow' : 'green'}
              size={compact ? 'small' : 'medium'}
            />
          </div>
        )}
      </div>

      {/* Progress bar for critical metrics */}
      {isCritical && (
        <div className={`${compact ? 'mt-2' : 'mt-3'}`}>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((value / (type === 'cartera' ? 80000 : type === 'margen' ? 40 : 800000)) * 100, 100)}%` 
              }}
            ></div>
          </div>
          <div className={`${compact ? 'text-[10px]' : 'text-xs'} text-red-600 mt-1 font-medium`}>
            {type === 'cartera' ? 'Cartera crítica' : type === 'margen' ? 'Margen bajo' : 'Ventas bajas'}
          </div>
        </div>
      )}
    </div>
  );
}; 