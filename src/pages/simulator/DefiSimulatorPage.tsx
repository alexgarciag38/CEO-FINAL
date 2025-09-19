import React, { useState } from 'react';
import SimuladorCostos from './SimuladorCostos';
import TarjetaSimulacion from './TarjetaSimulacion';
import { listSimulationsViaEdge, saveSimulationViaEdge } from '@/utils/simulationsClient';

const DefiSimulatorPage: React.FC = () => {
  const [tab, setTab] = useState<'crear' | 'guardadas'>('crear');
  const [items, setItems] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    try {
      setLoading(true);
      setItems(await listSimulationsViaEdge());
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Simulador DeFi</h1>
        <p className="text-gray-600 mb-6">Calculadora guiada para costos, comisiones, logística, impuestos y rentabilidad.</p>

        <div className="inline-flex gap-2 mb-4">
          <button className={`px-4 py-2 text-sm rounded-md border ${tab==='crear' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'}`} onClick={() => setTab('crear')}>Crear Nueva Simulación</button>
          <button className={`px-4 py-2 text-sm rounded-md border ${tab==='guardadas' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'}`} onClick={() => { setTab('guardadas'); void refresh(); }}>Mis Simulaciones Guardadas</button>
        </div>

        {tab === 'crear' && (
          <SimuladorCostos />
        )}

        {tab === 'guardadas' && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Mis Simulaciones Guardadas</h2>
            {loading && <div className="text-sm text-gray-500">Cargando…</div>}
            {!loading && (!items || items.length === 0) && (
              <div className="text-sm text-gray-500">Aún no tienes simulaciones guardadas. ¡Crea una ahora!</div>
            )}
            {!loading && items && items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((it) => (
                  <TarjetaSimulacion key={it.id} item={it} onLoad={(id) => { setTab('crear'); window.dispatchEvent(new CustomEvent('defi:load-simulation', { detail: { id } })); }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefiSimulatorPage;


