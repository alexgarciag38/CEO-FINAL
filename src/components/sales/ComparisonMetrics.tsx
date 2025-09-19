import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonData {
  actual: number;
  anterior: number;
  variacion: number;
}

interface ComparisonMetricsProps {
  comparaciones: {
    ventasTotales: ComparisonData;
    unidadesVendidas: ComparisonData;
    margenBruto: ComparisonData;
    totalPedidos: ComparisonData;
    ventasMostrador: ComparisonData;
    ventasConAgente: ComparisonData;
  };
  periodoActual: { mes: number; anio: number };
  periodoComparacion: { mes: number; anio: number } | null;
  tipoComparacion: string;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('es-MX', { 
    style: 'currency', 
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

const formatNumber = (value: number): string => {
  return value.toLocaleString('es-MX');
};

const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const getVariationColor = (variacion: number): string => {
  if (variacion > 0) return 'text-green-600';
  if (variacion < 0) return 'text-red-600';
  return 'text-gray-600';
};

const getVariationIcon = (variacion: number) => {
  if (variacion > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (variacion < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-600" />;
};

const getNombreMes = (mes: number) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes - 1] || '';
};

export const ComparisonMetrics: React.FC<ComparisonMetricsProps> = ({
  comparaciones,
  periodoActual,
  periodoComparacion,
  tipoComparacion
}) => {
  const getComparacionLabel = () => {
    if (!periodoComparacion) return 'Sin datos de comparación';
    
    if (tipoComparacion === 'mes_anterior') {
      return `vs ${getNombreMes(periodoComparacion.mes)} ${periodoComparacion.anio}`;
    } else {
      return `vs ${getNombreMes(periodoComparacion.mes)} ${periodoComparacion.anio}`;
    }
  };

  const metrics = [
    {
      title: 'Ventas Totales',
      actual: comparaciones.ventasTotales.actual,
      anterior: comparaciones.ventasTotales.anterior,
      variacion: comparaciones.ventasTotales.variacion,
      format: formatCurrency,
      icon: '💰'
    },
    {
      title: 'Unidades Vendidas',
      actual: comparaciones.unidadesVendidas.actual,
      anterior: comparaciones.unidadesVendidas.anterior,
      variacion: comparaciones.unidadesVendidas.variacion,
      format: formatNumber,
      icon: '📦'
    },
    {
      title: 'Margen Bruto',
      actual: comparaciones.margenBruto.actual,
      anterior: comparaciones.margenBruto.anterior,
      variacion: comparaciones.margenBruto.variacion,
      format: formatCurrency,
      icon: '📈'
    },
    {
      title: 'Total Pedidos',
      actual: comparaciones.totalPedidos.actual,
      anterior: comparaciones.totalPedidos.anterior,
      variacion: comparaciones.totalPedidos.variacion,
      format: formatNumber,
      icon: '📋'
    },
    {
      title: 'Ventas Mostrador',
      actual: comparaciones.ventasMostrador.actual,
      anterior: comparaciones.ventasMostrador.anterior,
      variacion: comparaciones.ventasMostrador.variacion,
      format: formatCurrency,
      icon: '🏪'
    },
    {
      title: 'Ventas con Agente',
      actual: comparaciones.ventasConAgente.actual,
      anterior: comparaciones.ventasConAgente.anterior,
      variacion: comparaciones.ventasConAgente.variacion,
      format: formatCurrency,
      icon: '👨‍💼'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header de Comparación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>📊 Comparación de Períodos</span>
            <span className="text-sm font-normal text-gray-600">
              {getNombreMes(periodoActual.mes)} {periodoActual.anio} {getComparacionLabel()}
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>{metric.icon}</span>
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* Valor Actual */}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {metric.format(metric.actual)}
                </p>
                <p className="text-sm text-gray-600">Período actual</p>
              </div>

              {/* Variación */}
              <div className="flex items-center justify-center gap-2">
                {getVariationIcon(metric.variacion)}
                <span className={`font-semibold ${getVariationColor(metric.variacion)}`}>
                  {formatPercentage(metric.variacion)}
                </span>
              </div>

              {/* Valor Anterior */}
              <div className="text-center">
                <p className="text-lg text-gray-600">
                  {metric.format(metric.anterior)}
                </p>
                <p className="text-xs text-gray-500">Período anterior</p>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumen de Tendencias */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Resumen de Tendencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.filter(m => m.variacion > 0).length}
              </div>
              <div className="text-sm text-green-700">Métricas en crecimiento</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {metrics.filter(m => m.variacion < 0).length}
              </div>
              <div className="text-sm text-red-700">Métricas en descenso</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {metrics.filter(m => m.variacion === 0).length}
              </div>
              <div className="text-sm text-gray-700">Métricas estables</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 