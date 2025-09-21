import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { VSMData, VSMProcess } from '@/types/vsm';
import { invoke } from '@/lib/api';

const defaultVSM: VSMData = {
  nombre: 'Nuevo VSM',
  demanda_cliente_unidades_mes: 1000,
  procesos: []
};

export const ValueStreamMap: React.FC = () => {
  const [vsmData, setVsmData] = useState<VSMData>(defaultVSM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editing, setEditing] = useState<VSMProcess | null>(null);

  const rfNodes: Node[] = useMemo(() => {
    return (vsmData.procesos || []).map((p, idx) => ({
      id: p.id,
      position: { x: 100 + idx * 260, y: 160 },
      data: {
        label: (
          <div className="text-xs">
            <div className="font-medium text-gray-900">{p.nombre}</div>
            <div className="text-gray-600">TC: {Math.round(p.tiempo_ciclo_seg)}s</div>
            <div className="text-gray-600">CO: {Math.round(p.tiempo_cambio_seg)}s</div>
            <div className="text-gray-600">WIP: {p.inventario_piezas}</div>
          </div>
        )
      },
      style: { padding: 8, border: '1px solid #e5e7eb', borderRadius: 8, background: '#F9FAFB' }
    }));
  }, [vsmData.procesos]);

  const rfEdges: Edge[] = useMemo(() => {
    return (vsmData.procesos || []).slice(1).map((p, idx) => ({
      id: `e-${vsmData.procesos[idx].id}-${p.id}`,
      source: vsmData.procesos[idx].id,
      target: p.id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#9CA3AF' }
    }));
  }, [vsmData.procesos]);

  const onNodeClick = useCallback((_e: any, node: Node) => {
    const found = (vsmData.procesos || []).find(pr => pr.id === node.id);
    if (found) {
      setEditing(found);
      setShowModal(true);
    }
  }, [vsmData.procesos]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditing(null);
  }, []);

  const saveProcess = useCallback((changes: Partial<VSMProcess>) => {
    if (!editing) return;
    setVsmData(prev => ({
      ...prev,
      procesos: prev.procesos.map(pr => pr.id === editing.id ? { ...pr, ...changes } as VSMProcess : pr)
    }));
    closeModal();
  }, [editing, closeModal]);

  const handleProcessVSM = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const result = await invoke<VSMData>('procesar-vsm', { body: vsmData });
      setVsmData(result);
    } catch (e: any) {
      console.error('[VSM] error', e);
      setError(e?.message || 'Error al procesar VSM');
    } finally { setLoading(false); }
  }, [vsmData]);

  const addProcess = useCallback(() => {
    const id = crypto.randomUUID();
    const nuevo: VSMProcess = {
      id,
      nombre: `Proceso ${vsmData.procesos.length + 1}`,
      tiempo_ciclo_seg: 60,
      tiempo_cambio_seg: 0,
      num_operarios: 1,
      inventario_piezas: 0,
      tasa_scrap: 0
    };
    setVsmData(prev => ({ ...prev, procesos: [...prev.procesos, nuevo] }));
  }, [vsmData.procesos.length]);

  const kpis = vsmData.kpis;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Herramientas Lean · Value Stream Mapping</h2>
        <div className="flex gap-2">
          <button onClick={addProcess} className="px-3 py-1.5 rounded bg-gray-100 text-gray-700">Añadir proceso</button>
          <button onClick={handleProcessVSM} disabled={loading} className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">{loading ? 'Procesando...' : 'Procesar VSM'}</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded border">
          <div className="text-xs text-gray-500">Lead Time (s)</div>
          <div className="text-2xl font-bold text-gray-900">{kpis ? kpis.total_lead_time_seg : '—'}</div>
        </div>
        <div className="p-4 bg-white rounded border">
          <div className="text-xs text-gray-500">Process Time (s)</div>
          <div className="text-2xl font-bold text-gray-900">{kpis ? kpis.total_process_time_seg : '—'}</div>
        </div>
        <div className="p-4 bg-white rounded border">
          <div className="text-xs text-gray-500">PCE (%)</div>
          <div className="text-2xl font-bold text-gray-900">{kpis ? kpis.process_cycle_efficiency_pct : '—'}</div>
        </div>
        <div className="p-4 bg-white rounded border">
          <div className="text-xs text-gray-500">Takt Time (s)</div>
          <div className="text-2xl font-bold text-gray-900">{kpis ? kpis.takt_time_seg : '—'}</div>
        </div>
      </div>

      <div className="h-[420px] bg-white rounded border overflow-hidden">
        <ReactFlow nodes={rfNodes} edges={rfEdges} onNodeClick={onNodeClick}>
          <MiniMap />
          <Controls />
          <Background gap={16} color="#F3F4F6" />
        </ReactFlow>
      </div>

      {/* Modal simple para edición */}
      {showModal && editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-full max-w-md p-4">
            <div className="text-lg font-semibold text-gray-900 mb-2">Editar Proceso</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600">Nombre</label>
                <input defaultValue={editing.nombre} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} className="w-full border rounded px-2 py-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Tiempo ciclo (s)</label>
                  <input type="number" defaultValue={editing.tiempo_ciclo_seg} onChange={(e) => setEditing({ ...editing, tiempo_ciclo_seg: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Tiempo cambio (s)</label>
                  <input type="number" defaultValue={editing.tiempo_cambio_seg} onChange={(e) => setEditing({ ...editing, tiempo_cambio_seg: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Inventario (pzs)</label>
                  <input type="number" defaultValue={editing.inventario_piezas} onChange={(e) => setEditing({ ...editing, inventario_piezas: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Operarios</label>
                  <input type="number" defaultValue={editing.num_operarios} onChange={(e) => setEditing({ ...editing, num_operarios: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Scrap (0..1)</label>
                <input type="number" step="0.01" min="0" max="1" defaultValue={editing.tasa_scrap} onChange={(e) => setEditing({ ...editing, tasa_scrap: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeModal} className="px-3 py-1.5 rounded border">Cancelar</button>
              <button onClick={() => saveProcess(editing)} className="px-3 py-1.5 rounded bg-blue-600 text-white">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValueStreamMap;


