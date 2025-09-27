import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ActividadEmpleadosChart from './ActividadEmpleadosChart';
import DashboardGrid from './DashboardGrid';

type Resumen = {
  dineroActualDisponible: number;
  ingresosPorVenir: number;
  pagosPorHacer: number;
  flujoProyectado: number;
  saldosVencidos: number;
  vencidosDebe?: number;
  vencidosPorCobrar?: number;
};


export const DashboardActividadFinanciera: React.FC = () => {
  const [horizonte, setHorizonte] = useState<7|15|30>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Resumen | null>(null);

  const load = async (hz: 7|15|30) => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');
      const { data: payload, error } = await supabase.functions.invoke('generar-resumen-financiero', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { horizonte_dias: hz }
      });
      if (error) throw error;
      setData((payload as any)?.resumen || null);
    } catch (e: any) {
      setError(e.message || 'Error cargando resumen');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(horizonte); /* eslint-disable-next-line */ }, []);

  const onChangeHorizonte = (hz: 7|15|30) => {
    setHorizonte(hz);
    load(hz);
  };

  const [filtroEmpleado, setFiltroEmpleado] = useState('');

  return (
    <div className="space-y-8">
      {/* Filtro de tiempo */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Período:</span>
        {[7,15,30].map(hz => (
          <button 
            key={hz}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              horizonte === hz 
                ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
            }`}
            onClick={() => onChangeHorizonte(hz as 7|15|30)}
          >
            {hz} días
          </button>
        ))}
      </div>

      {/* Estado de carga / error */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-10 w-10 bg-gray-200 rounded mb-4" />
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-10 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 font-medium text-lg">Error al cargar datos</div>
          <div className="text-red-500 text-sm mt-1">{error}</div>
          <button 
            onClick={() => load(horizonte)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* 5 Tarjetas Estratégicas */}
          <DashboardGrid 
            data={data}
            onVencidosClick={() => {
              const ev = new CustomEvent('finanzas:navigatePendientesVencidos');
              window.dispatchEvent(ev);
            }}
          />

          {/* Gráfica de Actividad por Empleados */}
          <ActividadEmpleadosChart 
            filtroEmpleado={filtroEmpleado}
            onFiltroChange={setFiltroEmpleado}
          />
        </>
      )}
    </div>
  );
};



