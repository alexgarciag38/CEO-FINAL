import React, { useMemo, useState } from 'react';
import { EnhancedKPICard } from '@/components/ui/EnhancedKPICard';
import { AlertTriangle, Target, Lightbulb, Circle, CheckCircle, XCircle } from 'lucide-react';

interface ABCAdvancedData {
  porProducto: Array<{
    descripcion: string;
    ventas: number;
    utilidad: number;
    margenPct: number;
    unidades: number;
    velocity: number;
    ventasClase: 'A' | 'B' | 'C';
    rentabilidadClase: 'A' | 'B' | 'C';
    rotacionClase: 'A' | 'B' | 'C';
    etiqueta: string;
  }>;
  agregadosPorClase: Array<{
    clase: 'A' | 'B' | 'C';
    ventas: number;
    utilidad: number;
    margenPct: number;
    unidades: number;
    coberturaPct: number;
  }>;
  heatmap: {
    estrellas: number;
    vacas: number;
    interrogantes: number;
    perros: number;
  };
  speedometers: Record<string, number>; // {'A': 80, 'B': 15, 'C': 5}
  oportunidades: Array<{
    producto: string;
    ventas: number;
    utilidad: number;
    margenPct: number;
    unidades: number;
    etiqueta: string;
  }>;
  alertas: string[];
}

interface Props {
  data?: ABCAdvancedData | null;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);

export const ABCAdvancedPanel: React.FC<Props> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">ABC Avanzado</h2>
        <p className="text-gray-500 text-sm">Sin datos ABC avanzados disponibles.</p>
      </div>
    );
  }

  const { agregadosPorClase, heatmap, oportunidades, alertas, porProducto } = data;

  const claseColor: Record<'A' | 'B' | 'C', { bg: string; border: string; text: string; speed: 'green' | 'yellow' | 'red' }>
    = {
      A: { bg: 'bg-green-50', border: 'border-2 border-green-600', text: 'text-green-700', speed: 'green' },
      B: { bg: 'bg-yellow-50', border: 'border-2 border-yellow-600', text: 'text-yellow-700', speed: 'yellow' },
      C: { bg: 'bg-red-50', border: 'border-2 border-red-600', text: 'text-red-700', speed: 'red' }
    };

  // Estado de expansión por cuadrante
  const [expanded, setExpanded] = useState<{ [k in 'estrellas' | 'vacas' | 'interrogantes' | 'perros']?: boolean }>({});
  const toggle = (key: 'estrellas' | 'vacas' | 'interrogantes' | 'perros') =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  // Listas por cuadrante
  const listas = useMemo(() => {
    const estrellas = porProducto
      .filter(p => p.ventasClase === 'A' && p.rotacionClase === 'A')
      .sort((a, b) => b.ventas - a.ventas);
    const vacas = porProducto
      .filter(p => p.ventasClase === 'A' && p.rotacionClase !== 'A')
      .sort((a, b) => b.ventas - a.ventas);
    const interrogantes = porProducto
      .filter(p => p.ventasClase !== 'A' && p.rotacionClase === 'A')
      .sort((a, b) => b.ventas - a.ventas);
    const perros = porProducto
      .filter(p => p.ventasClase !== 'A' && p.rotacionClase !== 'A')
      .sort((a, b) => b.ventas - a.ventas);
    return { estrellas, vacas, interrogantes, perros };
  }, [porProducto]);

  // Estadísticas por clase para comparaciones
  const statsPorClase = useMemo(() => {
    const groups: Record<'A'|'B'|'C', { avgVentas: number; maxVentas: number; bestName: string }> = {
      A: { avgVentas: 0, maxVentas: 0, bestName: '' },
      B: { avgVentas: 0, maxVentas: 0, bestName: '' },
      C: { avgVentas: 0, maxVentas: 0, bestName: '' }
    };
    (['A','B','C'] as const).forEach(cl => {
      const items = porProducto.filter(p => p.ventasClase === cl);
      const total = items.reduce((s, x) => s + (x.ventas || 0), 0);
      const avg = items.length ? total / items.length : 0;
      const best = items.slice().sort((a,b) => (b.ventas||0) - (a.ventas||0))[0];
      groups[cl] = { avgVentas: avg, maxVentas: best?.ventas || 0, bestName: best?.descripcion || '' };
    });
    return groups;
  }, [porProducto]);

  // Reglas de acciones recomendadas
  const acciones = useMemo(() => {
    const utilPerUnit = (p: any) => (p.unidades > 0 ? (p.utilidad || 0) / p.unidades : 0);
    const pushInmediato = porProducto
      .filter(p => (p.margenPct || 0) >= 50)
      .sort((a, b) => utilPerUnit(b) - utilPerUnit(a))
      .slice(0, 5);

    const investigar = porProducto
      .map(p => {
        const s = statsPorClase[p.ventasClase];
        const gap = s.avgVentas > 0 ? (p.ventas - s.avgVentas) / s.avgVentas : -1;
        return { p, gap };
      })
      .filter(x => x.gap < -0.3 || (x.p.margenPct || 0) < 10)
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 5)
      .map(x => x.p);

    const urgente = porProducto
      .filter(p => p.ventasClase === 'C')
      .map(p => {
        const s = statsPorClase[p.ventasClase];
        const gap = s.avgVentas > 0 ? (p.ventas - s.avgVentas) / s.avgVentas : -1;
        return { p, gap };
      })
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 3)
      .map(x => x.p);

    return { pushInmediato, investigar, urgente };
  }, [porProducto, statsPorClase]);

  const renderTabla = (items: typeof porProducto) => (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-700">
              <th className="py-2 pr-3">Producto</th>
              <th className="py-2 pr-3 text-right">Unidades</th>
              <th className="py-2 pr-3 text-right">Venta</th>
              <th className="py-2 pr-3 text-right">Utilidad</th>
              <th className="py-2 pr-3 text-right">Margen %</th>
              <th className="py-2 pr-3 text-right">Etiqueta</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 50).map((p, idx) => (
              <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-3 text-gray-900">{p.descripcion}</td>
                <td className="py-2 pr-3 text-right text-gray-700">{p.unidades?.toLocaleString('es-MX')}</td>
                <td className="py-2 pr-3 text-right font-medium">{formatCurrency(p.ventas || 0)}</td>
                <td className={`py-2 pr-3 text-right font-medium ${p.utilidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(p.utilidad || 0)}</td>
                <td className="py-2 pr-3 text-right text-gray-700">{(p.margenPct || 0).toFixed(1)}%</td>
                <td className="py-2 pr-3 text-right text-gray-700">{p.etiqueta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500">Mostrando {Math.min(50, items.length)} de {items.length} productos</div>
    </div>
  );

  // Render de oportunidades con calculadora e insights
  const renderOportunidadesDetalladas = (items: ABCAdvancedData['oportunidades']) => (
    <div className="space-y-3">
      {items.map((o, idx) => {
        const match = porProducto.find(p => p.descripcion === o.producto);
        const unidades = match?.unidades || o.unidades || 0;
        const ventas = match?.ventas || o.ventas || 0;
        const utilidad = match?.utilidad || o.utilidad || 0;
        const margenPct = match?.margenPct || o.margenPct || 0;
        const clase = match?.ventasClase || 'A';
        const s = statsPorClase[clase as 'A'|'B'|'C'];
        const pricePerUnit = unidades > 0 ? ventas / unidades : 0;
        const profitPerUnit = unidades > 0 ? utilidad / unidades : 0;
        const extra10 = profitPerUnit * 10;
        const anual = extra10 * 12;
        const vsAvgClass = s.avgVentas > 0 ? ((ventas - s.avgVentas) / s.avgVentas) * 100 : 0;
        const vsBestClass = s.maxVentas > 0 ? ((ventas - s.maxVentas) / s.maxVentas) * 100 : 0;
        const potencialMax = Math.max(0, s.maxVentas - ventas);
        return (
          <div key={idx} className="p-3 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900">{o.producto}</div>
              <div className="text-sm text-gray-600">{formatCurrency(ventas)} · margen {(margenPct).toFixed(1)}%</div>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="text-green-700 font-medium">Calculadora de Impacto</div>
                <div className="text-gray-700">Si vendes 10 unidades más: <span className="font-semibold">{formatCurrency(extra10)}</span></div>
                <div className="text-gray-700">Potencial anual: <span className="font-semibold">{formatCurrency(anual)}</span></div>
                <div className="text-gray-500 text-xs">Tiempo estimado: 2 semanas</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <div className="text-blue-700 font-medium">Comparaciones</div>
                <div className="text-gray-700">vs promedio clase: <span className={`${vsAvgClass >= 0 ? 'text-green-700' : 'text-red-700'} font-medium`}>{vsAvgClass >= 0 ? '+' : ''}{vsAvgClass.toFixed(1)}%</span></div>
                <div className="text-gray-700">vs mejor clase ({s.bestName || 'N/A'}): <span className={`${vsBestClass >= 0 ? 'text-green-700' : 'text-red-700'} font-medium`}>{vsBestClass >= 0 ? '+' : ''}{vsBestClass.toFixed(1)}%</span></div>
                <div className="text-gray-700">Potencial máx. clase: <span className="font-medium">{formatCurrency(potencialMax)}</span></div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="text-yellow-700 font-medium">Velocidad</div>
                <div className="text-gray-700">Velocity: <span className="font-medium">{(match?.velocity || 0).toFixed(2)}/día</span></div>
                <div className="text-gray-700">Precio/Unidad: <span className="font-medium">{formatCurrency(pricePerUnit)}</span></div>
                <div className="text-gray-700">Utilidad/Unidad: <span className="font-medium">{formatCurrency(profitPerUnit)}</span></div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded p-2">
                <div className="text-purple-700 font-medium">Acción</div>
                <div className="text-gray-700">Sugerencia: push selectivo 2 semanas y re-evaluar.</div>
                <div className="text-gray-500 text-xs">Etiqueta: {match?.etiqueta || o.etiqueta}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Alertas / Hallazgos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Alertas y Hallazgos
        </h3>
        {alertas && alertas.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {alertas.slice(0, 6).map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Sin alertas relevantes.</p>
        )}
      </div>

      {/* KPIs por Clase + Speedometers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agregadosPorClase.map((c) => (
          <EnhancedKPICard
            key={c.clase}
            title={`Clase ${c.clase}`}
            value={c.ventas}
            type="ventas"
            format="currency"
            icon={c.clase === 'A' ? <Circle className="h-5 w-5 text-green-500" /> : c.clase === 'B' ? <Circle className="h-5 w-5 text-yellow-500" /> : <Circle className="h-5 w-5 text-red-500" />}
            backgroundClass={claseColor[c.clase].bg}
            borderClass={claseColor[c.clase].border}
            valueTextClass={`${claseColor[c.clase].text} text-2xl font-extrabold`}
            secondaryValue={c.margenPct}
            secondaryFormat="percentage"
            secondaryLabel="margen"
            extraLines={[`Cobertura ${c.coberturaPct.toFixed(1)}%`, `${c.unidades.toLocaleString()} uds`]}
          />
        ))}
      </div>

      {/* Acciones recomendadas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Acciones recomendadas esta semana
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="font-semibold text-green-700 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Push inmediato (ROI alto)
            </div>
            <ul className="space-y-1">
              {acciones.pushInmediato.slice(0, 4).map((p, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-gray-800">{p.descripcion}</span>
                  <span className="text-green-700 font-medium">{formatCurrency(p.ventas)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="font-semibold text-yellow-700 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Investigar (Problemas)
            </div>
            <ul className="space-y-1">
              {acciones.investigar.slice(0, 4).map((p, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-gray-800">{p.descripcion}</span>
                  <span className="text-yellow-700 font-medium">{formatCurrency(p.ventas)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="font-semibold text-red-700 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Acción urgente
            </div>
            <ul className="space-y-1">
              {acciones.urgente.slice(0, 3).map((p, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-gray-800">{p.descripcion}</span>
                  <span className="text-red-700 font-medium">{formatCurrency(p.ventas)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Oportunidades</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estrellas */}
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 cursor-pointer" onClick={() => toggle('estrellas')}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700">Estrellas (Alta venta + Alta rotación)</div>
                <div className="text-xl font-bold text-green-700">{formatCurrency(heatmap?.estrellas || 0)}</div>
              </div>
              <span className="text-sm text-green-700">{expanded.estrellas ? 'Ocultar ▲' : 'Ver detalles ▼'}</span>
            </div>
            {expanded.estrellas && renderTabla(listas.estrellas)}
          </div>

          {/* Vacas */}
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 cursor-pointer" onClick={() => toggle('vacas')}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700">Vacas (Alta venta + Baja rotación)</div>
                <div className="text-xl font-bold text-yellow-700">{formatCurrency(heatmap?.vacas || 0)}</div>
              </div>
              <span className="text-sm text-yellow-700">{expanded.vacas ? 'Ocultar ▲' : 'Ver detalles ▼'}</span>
            </div>
            {expanded.vacas && renderTabla(listas.vacas)}
          </div>

          {/* Interrogantes */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 cursor-pointer" onClick={() => toggle('interrogantes')}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700">Interrogantes (Baja venta + Alta rotación)</div>
                <div className="text-xl font-bold text-blue-700">{formatCurrency(heatmap?.interrogantes || 0)}</div>
              </div>
              <span className="text-sm text-blue-700">{expanded.interrogantes ? 'Ocultar ▲' : 'Ver detalles ▼'}</span>
            </div>
            {expanded.interrogantes && renderTabla(listas.interrogantes)}
          </div>

          {/* Perros */}
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 cursor-pointer" onClick={() => toggle('perros')}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700">Perros (Baja venta + Baja rotación)</div>
                <div className="text-xl font-bold text-red-700">{formatCurrency(heatmap?.perros || 0)}</div>
              </div>
              <span className="text-sm text-red-700">{expanded.perros ? 'Ocultar ▲' : 'Ver detalles ▼'}</span>
            </div>
            {expanded.perros && renderTabla(listas.perros)}
          </div>
        </div>
      </div>

      {/* Top Oportunidades con calculadora y comparaciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Top Oportunidades (detalle)
        </h3>
        {renderOportunidadesDetalladas(oportunidades || [])}
      </div>
    </div>
  );
};