import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, TrendingUp, Users } from 'lucide-react';

interface Agente {
  agente: string;
  ventas: number;
  margen: number;
  pedidos: number;
  clientes: number;
}

interface InsightsPanelProps {
  agentes: Agente[];
  totalPedidos: number;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ agentes, totalPedidos }) => {
  // Cálculos defensivos con validación de datos
  const insights = React.useMemo(() => {
    if (!agentes || agentes.length === 0) {
      return {
        agenteTopTicket: null,
        agenteTopPedidos: null,
        ticketPromedioTop: 0,
        porcentajeTopPedidos: 0
      };
    }

    // Encuentra el agente con el ticket promedio más alto
    const agenteTopTicket = agentes.reduce((top, current) => {
      const currentTicket = current.pedidos > 0 ? current.ventas / current.pedidos : 0;
      const topTicket = top.pedidos > 0 ? top.ventas / top.pedidos : 0;
      return currentTicket > topTicket ? current : top;
    });

    // Encuentra el agente con más pedidos
    const agenteTopPedidos = agentes.reduce((top, current) => 
      current.pedidos > top.pedidos ? current : top
    );

    // Calcula métricas
    const ticketPromedioTop = agenteTopTicket.pedidos > 0 
      ? agenteTopTicket.ventas / agenteTopTicket.pedidos 
      : 0;

    const porcentajeTopPedidos = totalPedidos > 0 
      ? (agenteTopPedidos.pedidos / totalPedidos) * 100 
      : 0;

    return {
      agenteTopTicket,
      agenteTopPedidos,
      ticketPromedioTop,
      porcentajeTopPedidos
    };
  }, [agentes, totalPedidos]);

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Si no hay datos, muestra un mensaje
  if (!insights.agenteTopTicket || !insights.agenteTopPedidos) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-700 text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Insights Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            No hay suficientes datos de agentes para generar insights automáticos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-blue-700 text-lg flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Insights Automáticos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insight 1: Agente con mejor ticket promedio */}
        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-800">
              <strong>{insights.agenteTopTicket.agente}</strong> tiene el ticket promedio más alto
            </p>
            <p className="text-blue-700 mt-1">
              Con un valor de {formatCurrency(insights.ticketPromedioTop)} por pedido. 
              Sus ventas son de alto valor y representan una oportunidad para replicar su estrategia.
            </p>
          </div>
        </div>

        {/* Insight 2: Agente con más pedidos */}
        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
          <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-green-800">
              <strong>{insights.agenteTopPedidos.agente}</strong> genera el mayor volumen de pedidos
            </p>
            <p className="text-green-700 mt-1">
              Con {insights.agenteTopPedidos.pedidos} órdenes, representando el {insights.porcentajeTopPedidos.toFixed(1)}% del total. 
              Es una oportunidad clave para estrategias de upselling y cross-selling.
            </p>
          </div>
        </div>

        {/* Insight 3: Comparación de rendimiento */}
        {insights.agenteTopTicket.agente !== insights.agenteTopPedidos.agente && (
          <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-purple-800">
                Estrategia de Equipo Recomendada
              </p>
              <p className="text-purple-700 mt-1">
                Combinar el enfoque de {insights.agenteTopTicket.agente} (alto valor) con el volumen de {insights.agenteTopPedidos.agente} 
                podría maximizar el rendimiento general del equipo.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 