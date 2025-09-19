// ========================================
// UTILIDADES PARA MEJORAS VISUALES
// ========================================

export const getColorByValue = (value: number, type: 'margen' | 'cartera' | 'ventas' | 'utilidad'): string => {
  switch(type) {
    case 'margen':
      return value < 20 ? 'text-red-600 bg-red-50 border-red-200' : 
             value < 30 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 
             'text-green-600 bg-green-50 border-green-200';
    
    case 'cartera':
      return value > 50000 ? 'text-red-600 bg-red-50 border-red-200' : 
             value > 20000 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 
             'text-green-600 bg-green-50 border-green-200';
    
    case 'ventas':
      return value < 100000 ? 'text-red-600 bg-red-50 border-red-200' : 
             value < 500000 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 
             'text-green-600 bg-green-50 border-green-200';
    
    case 'utilidad':
      return value < 10000 ? 'text-red-600 bg-red-50 border-red-200' : 
             value < 50000 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 
             'text-green-600 bg-green-50 border-green-200';
    
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getCardSize = (metric: string, value: number, isCritical: boolean = false): string => {
  // Compact layout: evitar col-span-2 salvo extremos
  if (isCritical && (metric === 'carteraVencida') && value > 200000) return 'col-span-2';
  if (isCritical && (metric === 'ventasTotales') && value < 100000) return 'col-span-2';
  return 'col-span-1';
};

export const getRankingDisplay = (position: number, agente: any, promedioVentas: number): string => {
  const badges = {
    1: '🥇',
    2: '🥈', 
    3: '🥉'
  };
  
  const performance = agente.ventas > promedioVentas * 1.5 ? '🔥' : 
                     agente.ventas < promedioVentas * 0.5 ? '⚠️' : '✅';
  
  return `${badges[position] || `#${position}`} ${agente.agente} $${agente.ventas.toLocaleString()} ${performance}`;
};

export const getCriticalBadge = (value: number, threshold: number): string => {
  return value > threshold ? '🚨' : '';
};

export const formatValue = (value: number, type: string): string => {
  if (type === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  if (type === 'currency') {
    return `$${value.toLocaleString()}`;
  }
  if (type === 'number') {
    return value.toLocaleString();
  }
  return value.toString();
};

export const generateInsights = (data: any): string[] => {
  const insights: string[] = [];
  if (!data) return insights; // seguridad
  
  // Agente con mejor rendimiento
  if (data.rendimientoAgentes && data.rendimientoAgentes.length > 0) {
    const topAgente = data.rendimientoAgentes[0];
    insights.push(`🏆 ${topAgente.agente} lidera con $${topAgente.ventas.toLocaleString()}`);
  }
  
  // Producto más rentable
  if (data.catalogoProductos && data.catalogoProductos.length > 0) {
    const topProducto = data.catalogoProductos.slice().sort((a: any, b: any) => (b.utilidad || 0) - (a.utilidad || 0))[0];
    if (topProducto) {
      insights.push(`💰 ${topProducto.descripcion} genera $${(topProducto.utilidad || 0).toLocaleString()} de utilidad`);
    }
  }
  
  // Cartera crítica
  if (data.carteraVencida && data.carteraVencida > 50000) {
    insights.push(`🚨 Cartera vencida crítica: $${data.carteraVencida.toLocaleString()}`);
  }
  
  // Margen bajo (si viene plano o dentro de kpis)
  const margen = (data.kpis && data.kpis.margenBrutoPct) || data.margenBruto;
  if (typeof margen === 'number' && margen < 25) {
    insights.push(`⚠️ Margen bajo: ${margen}% (objetivo: 30%+)`);
  }
  
  // Cliente top
  if (data.clientesTop && data.clientesTop.length > 0) {
    const topCliente = data.clientesTop[0];
    insights.push(`👑 ${topCliente.cliente} es el cliente top con $${topCliente.ventas.toLocaleString()}`);
  }
  
  return insights;
};

export const getSpeedometerData = (value: number, type: string) => {
  let maxValue, color;
  
  switch(type) {
    case 'margen':
      maxValue = 50;
      color = value < 20 ? 'red' : value < 30 ? 'yellow' : 'green';
      break;
    case 'objetivo':
      maxValue = 100;
      color = value < 70 ? 'red' : value < 90 ? 'yellow' : 'green';
      break;
    default:
      maxValue = 100;
      color = 'blue';
  }
  
  return {
    percentage: Math.min((value / maxValue) * 100, 100),
    color,
    value
  };
};

export const getHeatmapColor = (value: number, maxValue: number): string => {
  const percentage = (value / maxValue) * 100;
  
  if (percentage > 80) return 'bg-red-500';
  if (percentage > 60) return 'bg-orange-500';
  if (percentage > 40) return 'bg-yellow-500';
  if (percentage > 20) return 'bg-blue-500';
  return 'bg-green-500';
};

export const getTrendIcon = (current: number, previous: number): string => {
  if (!previous) return '';
  const change = ((current - previous) / previous) * 100;
  
  if (change > 10) return '↗️';
  if (change > 0) return '↗️';
  if (change < -10) return '↘️';
  if (change < 0) return '↘️';
  return '→';
};

export const getPerformanceEmoji = (value: number, average: number): string => {
  const ratio = value / average;
  
  if (ratio > 2) return '🚀';
  if (ratio > 1.5) return '🔥';
  if (ratio > 1) return '✅';
  if (ratio > 0.5) return '⚠️';
  return '🔴';
}; 