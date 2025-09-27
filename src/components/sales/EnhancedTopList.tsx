import React, { useMemo, useState } from 'react';
import { getPerformanceEmoji } from '@/utils/visualHelpers';
import { Trophy, Medal, Award, Star, TrendingUp, TrendingDown } from 'lucide-react';

interface EnhancedTopListProps {
  title: string;
  data: Array<{
    agente?: string;
    cliente?: string;
    producto?: string;
    ventas: number; // can represent amount or quantity
    margen?: number;
    utilidad?: number; // utilidad en dinero
    pedidos?: number;
    [key: string]: any;
  }>;
  type: 'agentes' | 'clientes' | 'productos';
  maxItems?: number;
  showProgressBars?: boolean;
  className?: string;
  valueFormat?: 'currency' | 'number';
  expandable?: boolean;
}

export const EnhancedTopList: React.FC<EnhancedTopListProps> = ({
  title,
  data,
  type,
  maxItems = 10,
  showProgressBars = true,
  className = '',
  valueFormat = 'currency',
  expandable = true
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover fade-in ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-500 text-sm">No hay datos disponibles.</p>
      </div>
    );
  }

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.ventas - a.ventas);
    return expanded ? sorted : sorted.slice(0, maxItems);
  }, [data, expanded, maxItems]);

  const maxVentas = Math.max(...data.map(item => item.ventas));
  const averageVentas = data.reduce((sum, item) => sum + item.ventas, 0) / data.length;

  const getItemName = (item: any) => item.agente || item.cliente || item.producto || 'Sin nombre';

  const getItemIcon = (position: number, item: any) => {
    const performanceEmoji = getPerformanceEmoji(item.ventas, averageVentas);
    if (position === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Award className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />;
    return <Star className="h-5 w-5 text-blue-500" />;
  };

  const getItemColor = (position: number, item: any) => {
    if (position <= 3) return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-200';
    const performance = item.ventas / averageVentas;
    if (performance > 1.5) return 'bg-green-50 border-green-200';
    if (performance < 0.5) return 'bg-orange-50 border-orange-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getProgressColor = (item: any) => {
    const percentage = (item.ventas / maxVentas) * 100;
    if (percentage > 80) return 'bg-green-600';
    if (percentage > 60) return 'bg-blue-500';
    if (percentage > 40) return 'bg-gray-400';
    if (percentage > 20) return 'bg-gray-300';
    return 'bg-gray-300';
  };

  const formatValue = (value: number) => valueFormat === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover fade-in ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {expandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {expanded ? 'Ver menos' : 'Ver todo'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {sortedData.map((item, index) => {
          const position = index + 1;
          const percentage = (item.ventas / maxVentas) * 100;
          const vsAverage = ((item.ventas / averageVentas) - 1) * 100;
          return (
            <div
              key={index}
              className={`p-3 rounded-lg border card-hover slide-up ${getItemColor(position, item)}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getItemIcon(position, item)}
                  <span className="font-medium text-gray-900">{getItemName(item)}</span>
                  {position <= 3 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">#{position}</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatValue(item.ventas)}</div>
                  {vsAverage !== 0 && (
                    <div className={`text-xs ${vsAverage > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {vsAverage > 0 ? '+' : ''}{vsAverage.toFixed(1)}% vs promedio
                    </div>
                  )}
                </div>
              </div>

              {showProgressBars && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full progress-animate ${getProgressColor(item)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {typeof item.utilidad === 'number' && (
                <div className="mt-2 text-xs text-gray-600">
                  Margen: <span className="font-medium text-gray-900">${item.utilidad.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Promedio: {formatValue(averageVentas)}</span>
          <span>Máximo: {formatValue(maxVentas)}</span>
        </div>
      </div>
    </div>
  );
}; 