import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';

interface SmartAlertsProps {
  data: any;
}

export const SmartAlerts: React.FC<SmartAlertsProps> = ({ data }) => {
  const generateAlerts = (data: any) => {
    const alerts = [];

    // Alerta de cartera crítica (rojo exclusivo)
    if (data?.kpis?.carteraVencida > 50000) {
      alerts.push({
        type: 'critical',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        title: '🚨 Cartera Crítica',
        message: `$${data.kpis.carteraVencida.toLocaleString()} vencidos = ${Math.ceil(data.kpis.carteraVencida / 3000)} días de cash flow`,
        color: 'border-red-200 bg-red-50'
      });
    }

    // Alerta de margen bajo (ámbar)
    if (data?.kpis?.margenBrutoPct < 25) {
      alerts.push({
        type: 'warning',
        icon: <TrendingDown className="w-5 h-5 text-orange-600" />,
        title: '⚠️ Margen Bajo',
        message: `${data.kpis.margenBrutoPct}% margen (objetivo: 30%+)`,
        color: 'border-orange-200 bg-orange-50'
      });
    }

    // Oportunidad de producto (azul)
    if (data?.catalogoProductos?.length > 0) {
      const topProduct = data.catalogoProductos.sort((a: any, b: any) => b.utilidad - a.utilidad)[0];
      if (topProduct && topProduct.utilidad > 50000) {
        alerts.push({
          type: 'opportunity',
          icon: <Target className="w-5 h-5 text-blue-600" />,
          title: '💡 Oportunidad',
          message: `${topProduct.descripcion} genera $${topProduct.utilidad.toLocaleString()} de utilidad`,
          color: 'border-blue-200 bg-blue-50'
        });
      }
    }

    // Agente con bajo rendimiento
    if (data?.rendimientoAgentes?.length > 0) {
      const avgVentas = data.rendimientoAgentes.reduce((sum: number, agente: any) => sum + agente.ventas, 0) / data.rendimientoAgentes.length;
      const lowPerformer = data.rendimientoAgentes.find((agente: any) => agente.ventas < avgVentas * 0.5);
      
      if (lowPerformer) {
        alerts.push({
          type: 'warning',
          icon: <TrendingDown className="w-5 h-5 text-orange-600" />,
          title: '📉 Rendimiento Bajo',
          message: `${lowPerformer.agente} solo $${lowPerformer.ventas.toLocaleString()} (vs promedio $${avgVentas.toLocaleString()})`,
          color: 'border-orange-200 bg-orange-50'
        });
      }
    }

    // Cliente top (verde éxito)
    if (data?.clientesTop?.length > 0) {
      const topCliente = data.clientesTop[0];
      alerts.push({
        type: 'success',
        icon: <TrendingUp className="w-5 h-5 text-green-600" />,
        title: '👑 Cliente Top',
        message: `${topCliente.cliente} genera $${topCliente.ventas.toLocaleString()} en ventas`,
        color: 'border-green-200 bg-green-50'
      });
    }

    return alerts;
  };

  const alerts = generateAlerts(data);

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Alertas Inteligentes</h3>
        </div>
        <p className="text-gray-500 text-sm">No hay alertas activas en este momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">🚨 Alertas Inteligentes</h3>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div 
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border card-hover slide-up ${alert.color}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {alert.icon}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
              <p className="text-sm text-gray-700">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Las alertas se generan automáticamente basándose en tus datos
        </p>
      </div>
    </div>
  );
}; 