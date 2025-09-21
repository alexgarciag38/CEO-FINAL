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
  
  // Presentational-only helpers for progress + status (no business logic changes)
  const showProgressBar = (type === 'ventas' && !!average) || (type === 'margen' && typeof secondaryValue === 'number');
  const progressWidth = (() => {
    if (type === 'ventas' && average) {
      return `${Math.min((value / average) * 100, 100)}%`;
    }
    if (type === 'margen' && typeof secondaryValue === 'number') {
      return `${Math.max(0, Math.min(secondaryValue, 100))}%`;
    }
    return '0%';
  })();
  const progressColor = (() => {
    if (type === 'ventas' && average) {
      return value >= average ? 'bg-green-500' : 'bg-blue-500';
    }
    if (type === 'margen' && typeof secondaryValue === 'number') {
      if (secondaryValue >= 30) return 'bg-green-500';
      if (secondaryValue >= 20) return 'bg-orange-400';
      return 'bg-red-500';
    }
    return 'bg-blue-500';
  })();
  const statusMeta = (() => {
    // Subtle tag-style status aligned with palette
    if (type === 'cartera' && isCritical) {
      return { label: 'Cartera crítica', cls: `${compact ? 'text-[10px]' : 'text-xs'} text-red-700 bg-red-100 rounded-full px-2 py-1 font-medium inline-block` };
    }
    if (type === 'margen' && typeof secondaryValue === 'number') {
      if (secondaryValue < 20) return { label: 'Margen crítico', cls: `${compact ? 'text-[10px]' : 'text-xs'} text-red-700 bg-red-100 rounded-full px-2 py-1 font-medium inline-block` };
      if (secondaryValue < 30) return { label: 'Margen a vigilar', cls: `${compact ? 'text-[10px]' : 'text-xs'} text-orange-700 bg-orange-100 rounded-full px-2 py-1 font-medium inline-block` };
    }
    if (type === 'ventas' && average && value < average * 0.9) {
      return { label: 'Por debajo del objetivo', cls: `${compact ? 'text-[10px]' : 'text-xs'} text-orange-700 bg-orange-100 rounded-full px-2 py-1 font-medium inline-block` };
    }
    return null;
  })();

  return (
    <div className={`${containerBase} ${containerColor || colorClasses} ${sizeClasses} ${isCritical ? 'ring-2 ring-red-200 critical-pulse' : ''} ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center gap-2 text-gray-400">
          {icon && <span className="text-base">{icon}</span>}
          <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800`}>{title}</h3>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
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
              className={valueTextClass || 'text-gray-800'}
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

      {/* Progress + status: thinner, neutral background, palette-driven fill */}
      {(showProgressBar || isCritical || statusMeta) && (
        <div className={`${compact ? 'mt-2' : 'mt-3'} space-y-1`}>
          {showProgressBar && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                style={{ width: progressWidth }}
              ></div>
            </div>
          )}
          {statusMeta && (
            <div className={statusMeta.cls}>{statusMeta.label}</div>
          )}
        </div>
      )}
    </div>
  );
}; 