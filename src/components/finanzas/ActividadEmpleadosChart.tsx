import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ActividadEmpleado {
  usuarioId: string;
  nombre: string;
  ingresos: number;
  egresos: number;
  neto: number;
  total: number;
}

interface ActividadEmpleadosChartProps {
  filtroEmpleado?: string;
  onFiltroChange?: (filtro: string) => void;
}

const ActividadEmpleadosChart: React.FC<ActividadEmpleadosChartProps> = ({ 
  filtroEmpleado = '', 
  onFiltroChange 
}) => {
  const [actividad, setActividad] = useState<ActividadEmpleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  useEffect(() => {
    cargarActividad();
  }, []);

  const cargarActividad = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('listar-resumen-actividad-empleados', {
        body: { dias_atras: 30 }
      });

      if (error) throw error;

      setActividad(data.resumenActividad || []);
    } catch (err: any) {
      console.error('Error cargando actividad:', err);
      setError('Error al cargar la actividad de empleados');
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  const obtenerColorIngresos = (monto: number) => {
    if (monto === 0) return 'bg-gray-200';
    if (monto < 10000) return 'bg-green-300';
    if (monto < 50000) return 'bg-green-400';
    return 'bg-green-500';
  };

  const obtenerColorEgresos = (monto: number) => {
    if (monto === 0) return 'bg-gray-200';
    if (monto < 10000) return 'bg-red-300';
    if (monto < 50000) return 'bg-red-400';
    return 'bg-red-500';
  };

  const datosFiltrados = actividad.filter(emp => 
    emp.nombre.toLowerCase().includes(filtroEmpleado.toLowerCase())
  );

  const maxTotal = Math.max(...datosFiltrados.map(emp => emp.total), 1);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="flex-1 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error al cargar la gráfica</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button 
            onClick={cargarActividad}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (datosFiltrados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente por Empleado</h3>
        <div className="text-center text-gray-500 py-8">
          <p>No hay actividad registrada en los últimos 30 días</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente por Empleado</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Filtrar por empleado..."
            value={filtroEmpleado}
            onChange={(e) => onFiltroChange?.(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-4">
        {datosFiltrados.map((empleado) => {
          const porcentajeIngresos = (empleado.ingresos / maxTotal) * 100;
          const porcentajeEgresos = (empleado.egresos / maxTotal) * 100;
          const isHovered = hoveredBar === empleado.usuarioId;

          return (
            <div 
              key={empleado.usuarioId}
              className="group"
              onMouseEnter={() => setHoveredBar(empleado.usuarioId)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 text-sm">
                  {empleado.nombre}
                </span>
                <div className="text-right text-sm">
                  <div className="text-green-600 font-medium">
                    {formatearMoneda(empleado.ingresos)}
                  </div>
                  <div className="text-red-600 font-medium">
                    {formatearMoneda(empleado.egresos)}
                  </div>
                  <div className={`font-semibold ${empleado.neto >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Neto: {formatearMoneda(empleado.neto)}
                  </div>
                </div>
              </div>
              
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                {/* Barra de Ingresos */}
                <div
                  className={`absolute left-0 top-0 h-full ${obtenerColorIngresos(empleado.ingresos)} transition-all duration-300 ${
                    isHovered ? 'opacity-90' : 'opacity-80'
                  }`}
                  style={{ width: `${porcentajeIngresos}%` }}
                />
                
                {/* Barra de Egresos */}
                <div
                  className={`absolute right-0 top-0 h-full ${obtenerColorEgresos(empleado.egresos)} transition-all duration-300 ${
                    isHovered ? 'opacity-90' : 'opacity-80'
                  }`}
                  style={{ width: `${porcentajeEgresos}%` }}
                />
                
                {/* Línea divisoria si hay ambos */}
                {empleado.ingresos > 0 && empleado.egresos > 0 && (
                  <div 
                    className="absolute top-0 h-full w-px bg-gray-400"
                    style={{ left: `${porcentajeIngresos}%` }}
                  />
                )}
              </div>

              {/* Tooltip en hover */}
              {isHovered && (
                <div className="absolute z-10 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                  <div className="font-medium">{empleado.nombre}</div>
                  <div className="text-green-300">Ingresos: {formatearMoneda(empleado.ingresos)}</div>
                  <div className="text-red-300">Egresos: {formatearMoneda(empleado.egresos)}</div>
                  <div className={`font-semibold ${empleado.neto >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    Neto: {formatearMoneda(empleado.neto)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span className="text-sm text-gray-600">Ingresos</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span className="text-sm text-gray-600">Egresos</span>
        </div>
      </div>
    </div>
  );
};

export default ActividadEmpleadosChart;








