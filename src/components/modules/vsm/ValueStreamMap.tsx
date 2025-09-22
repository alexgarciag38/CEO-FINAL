import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { VSMData, VSMProcess, VSMNode, VSMNodeData } from '@/types/vsm';
import { invoke } from '@/lib/api';
import VSMSymbol from './VSMSymbol';
import { VSM_NODE_TYPES } from './VSMNodeComponents';

const defaultVSM: VSMData = {
  nombre: 'Nuevo VSM',
  demanda_cliente_unidades_mes: 1000,
  procesos: []
};

type ValueStreamMapProps = {
  initialVsm?: VSMData;
  onSaved?: (saved: VSMData) => void;
  onBackToList?: () => void;
};

export const ValueStreamMap: React.FC<ValueStreamMapProps> = ({ initialVsm, onSaved, onBackToList }) => {
  const [vsmData, setVsmData] = useState<VSMData>(initialVsm ?? defaultVSM);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Drag & Drop desde paleta
  const onDragStart = (event: React.DragEvent, nodeType: VSMNodeData['type']) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow') as VSMNodeData['type'];
    const bounds = canvasRef.current?.getBoundingClientRect();
    const position = bounds ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top } : { x: 120, y: 120 };
    const id = crypto.randomUUID();
    const base: VSMNode = { id, type, position, data: { type } as any };
    let data: VSMNodeData;
    if (type === 'process') {
      data = { type: 'process', nombre: `Proceso ${((vsmData.nodes?.length ?? 0) + 1)}`, tiempo_ciclo_seg: 60, tiempo_cambio_seg: 0, num_operarios: 1, inventario_piezas: 0, tasa_scrap: 0 };
    } else if (type === 'inventory') {
      data = { type: 'inventory', cantidad: 0, unidad: 'piezas', espera_dias: 0 };
    } else if (type === 'customer') {
      data = { type: 'customer', rol: 'customer', nombre: 'Cliente' };
    } else {
      data = { type: 'supplier', rol: 'supplier', nombre: 'Proveedor' };
    }
    const newNode: VSMNode = { ...base, data };
    setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] }));
    setIsDirty(true); setIsSaved(false);
  }, [vsmData.nodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProcess, setEditingProcess] = useState<VSMProcess | null>(null);
  const [editingNode, setEditingNode] = useState<VSMNode | null>(null);
  const [editingUnit, setEditingUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('seconds');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (initialVsm) {
      setVsmData(initialVsm);
      setIsDirty(false);
      setIsSaved(false);
    } else {
      // Plantilla inicial guiada cuando no hay datos cargados
      setVsmData(prev => {
        if ((prev.nodes && prev.nodes.length > 0) || (prev.procesos && prev.procesos.length > 0)) return prev;
        const templateNodes: VSMNode[] = [
          { id: 'supplier-1', type: 'supplier', position: { x: 50, y: 150 }, data: { type: 'supplier', rol: 'supplier', nombre: 'Proveedor' } as any },
          { id: 'process-1', type: 'process', position: { x: 250, y: 150 }, data: { type: 'process', nombre: 'Proceso Inicial', tiempo_ciclo_seg: 60, tiempo_cambio_seg: 0, num_operarios: 1, inventario_piezas: 0, tasa_scrap: 0 } },
          { id: 'inventory-1', type: 'inventory', position: { x: 450, y: 150 }, data: { type: 'inventory', cantidad: 0, espera_dias: 0 } as any },
          { id: 'process-2', type: 'process', position: { x: 650, y: 150 }, data: { type: 'process', nombre: 'Proceso Final', tiempo_ciclo_seg: 60, tiempo_cambio_seg: 0, num_operarios: 1, inventario_piezas: 0, tasa_scrap: 0 } },
          { id: 'customer-1', type: 'customer', position: { x: 850, y: 150 }, data: { type: 'customer', rol: 'customer', nombre: 'Cliente' } as any },
        ];
        const templateEdges = [
          { id: 'e-supplier-process1', source: 'supplier-1', target: 'process-1' },
          { id: 'e-process1-inventory1', source: 'process-1', target: 'inventory-1' },
          { id: 'e-inventory1-process2', source: 'inventory-1', target: 'process-2' },
          { id: 'e-process2-customer', source: 'process-2', target: 'customer-1' }
        ];
        return { ...prev, nodes: templateNodes, edges: templateEdges };
      });
    }
  }, [initialVsm]);

  const rfNodes: Node[] = useMemo(() => {
    if (vsmData.nodes && vsmData.nodes.length > 0) {
      return vsmData.nodes.map((n) => ({
        id: n.id,
        type: n.type as any,
        position: n.position ?? { x: 120, y: 160 },
        data: n.data as any
      }));
    }
    // fallback al modelo anterior "procesos"
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
  }, [vsmData.nodes, vsmData.procesos]);

  const rfEdges: Edge[] = useMemo(() => {
    if (vsmData.edges && vsmData.edges.length > 0) {
      return vsmData.edges.map((e) => ({
        id: e.id ?? `e-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        markerEnd: { type: MarkerType.ArrowClosed },
        type: 'smoothstep',
        style: e.flowType === 'information' ? { stroke: '#6B7280', strokeDasharray: '5 5' } : { stroke: '#111827' }
      }));
    }
    return (vsmData.procesos || []).slice(1).map((p, idx) => ({
      id: `e-${vsmData.procesos[idx].id}-${p.id}`,
      source: vsmData.procesos[idx].id,
      target: p.id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#9CA3AF' }
    }));
  }, [vsmData.edges, vsmData.procesos]);

  const onNodeClick = useCallback((_e: any, node: Node) => {
    if (vsmData.nodes && vsmData.nodes.length > 0) {
      const n = vsmData.nodes.find(nn => nn.id === node.id) || null;
      if (n) {
        setEditingNode(JSON.parse(JSON.stringify(n)) as VSMNode);
        setEditingProcess(null);
        setEditingUnit('seconds');
        setShowModal(true);
        return;
      }
    }
    const foundLegacy = (vsmData.procesos || []).find(pr => pr.id === node.id) || null;
    if (foundLegacy) {
      setEditingProcess(foundLegacy);
      setEditingNode(null);
      setEditingUnit('seconds');
      setShowModal(true);
    }
  }, [vsmData.nodes, vsmData.procesos]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingProcess(null);
    setEditingNode(null);
  }, []);

  const saveProcess = useCallback((changes: Partial<VSMProcess>) => {
    if (!editingProcess) return;
    setVsmData(prev => ({
      ...prev,
      procesos: prev.procesos.map(pr => pr.id === editingProcess.id ? { ...pr, ...changes } as VSMProcess : pr)
    }));
    setIsDirty(true);
    setIsSaved(false);
    closeModal();
  }, [editingProcess, closeModal]);

  const saveNode = useCallback(() => {
    if (!editingNode) return;
    setVsmData(prev => ({
      ...prev,
      nodes: (prev.nodes ?? []).map(n => n.id === editingNode.id ? editingNode : n)
    }));
    setIsDirty(true); setIsSaved(false);
    closeModal();
  }, [editingNode, closeModal]);

  const handleProcessVSM = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const result = await invoke<VSMData>('procesar-vsm', { body: vsmData });
      setVsmData(result);
      setIsDirty(false);
      setIsSaved(true);
      onSaved?.(result);
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
    setIsDirty(true);
    setIsSaved(false);
  }, [vsmData.procesos.length]);

  const kpis = vsmData.kpis;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBackToList && (
            <button onClick={onBackToList} className="px-3 py-1.5 rounded border">Volver a la Lista</button>
          )}
        <h2 className="text-lg font-semibold text-gray-900">Herramientas Lean · Value Stream Mapping</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600">
            {isSaved ? 'Guardado' : (isDirty ? 'Cambios no guardados' : 'Sin cambios')}
          </span>
          <button onClick={handleProcessVSM} disabled={loading} className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">{loading ? 'Procesando…' : 'Procesar y Guardar VSM'}</button>
        </div>
      </div>

      {/* Timeline VA / NVA */}
      <div className="bg-white rounded border p-3">
        <div className="text-xs text-gray-600 mb-2">Línea de tiempo (VA vs NVA)</div>
        {!kpis ? (
          <div className="text-xs text-gray-500">Procesa el mapa para calcular y visualizar la línea de tiempo.</div>
        ) : (
          <>
            <div className="w-full h-4 bg-gray-100 rounded overflow-hidden flex">
              {(() => {
                const totalLT = Math.max(1, kpis.total_lead_time_seg || 1);
                const va = Math.max(0, kpis.total_process_time_seg || 0);
                const nva = Math.max(0, totalLT - va);
                const vaPct = Math.min(100, (va / totalLT) * 100);
                const nvaPct = Math.max(0, 100 - vaPct);
                return (
                  <>
                    <div style={{ width: `${vaPct}%` }} className="bg-green-500" />
                    <div style={{ width: `${nvaPct}%` }} className="bg-rose-300" />
                  </>
                );
              })()}
            </div>
            <div className="mt-2 text-xs text-gray-700 flex items-center gap-4">
              <span>VA: {kpis.total_process_time_seg}s</span>
              <span>NVA: {Math.max(0, (kpis.total_lead_time_seg - kpis.total_process_time_seg)).toFixed(2)}s</span>
              <span>PCE: {kpis.process_cycle_efficiency_pct}%</span>
              <span>Takt: {kpis.takt_time_seg}s</span>
            </div>
          </>
        )}
      </div>

      {/* Nombre y Demanda */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-600">Nombre del Mapa</label>
          <input
            type="text"
            value={vsmData.nombre}
            onChange={(e) => { setVsmData(prev => ({ ...prev, nombre: e.target.value })); setIsDirty(true); setIsSaved(false); }}
            className="w-full border rounded px-2 py-1"
            placeholder="Ej. VSM Proceso A"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Demanda del Cliente (Unidades/Mes)</label>
          <input
            type="number"
            min={1}
            value={vsmData.demanda_cliente_unidades_mes}
            onChange={(e) => { setVsmData(prev => ({ ...prev, demanda_cliente_unidades_mes: Number(e.target.value) || 0 })); setIsDirty(true); setIsSaved(false); }}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="flex items-end">
          <div className="text-xs text-gray-500">ID: {vsmData.projectId ? vsmData.projectId : '— nuevo —'}</div>
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

      <div className="h-[420px] bg-white rounded border overflow-hidden flex">
        {/* Paleta izquierda */}
        <div className="w-48 border-r p-2 space-y-2 bg-gray-50 overflow-auto">
          <div className="text-xs font-medium text-gray-700">Símbolos VSM</div>
          <div className="grid grid-cols-1 gap-2">
            <VSMSymbol type="process" label="Proceso" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = {
                id,
                type: 'process',
                position: { x: 150, y },
                data: { type: 'process', nombre: `Nuevo Proceso`, tiempo_ciclo_seg: 60, tiempo_cambio_seg: 0, num_operarios: 1, inventario_piezas: 0, tasa_scrap: 0 }
              };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="inventory" label="Inventario/Cola" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'inventory', position: { x: 150, y }, data: { type: 'inventory', cantidad: 0, unidad: 'piezas', espera_dias: 0 } };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="supplier" label="Proveedor" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'supplier', position: { x: 150, y }, data: { type: 'supplier', rol: 'supplier', nombre: 'Proveedor' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="customer" label="Cliente" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'customer', position: { x: 150, y }, data: { type: 'customer', rol: 'customer', nombre: 'Cliente' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="transport" label="Transporte" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'transport', position: { x: 150, y }, data: { type: 'transport' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="info_flow" label="Flujo de Información" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'info_flow', position: { x: 150, y }, data: { type: 'info_flow' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="info_flow_manual" label="Info Manual" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'info_flow_manual', position: { x: 150, y }, data: { type: 'info_flow_manual' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="info_flow_electronic" label="Info Electrónico" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'info_flow_electronic', position: { x: 150, y }, data: { type: 'info_flow_electronic' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="kaizen_burst" label="Kaizen Burst" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'kaizen_burst', position: { x: 150, y }, data: { type: 'kaizen_burst', titulo: 'Kaizen' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
            <VSMSymbol type="data_box" label="Caja de Datos" onClick={() => {
              const y = 150 + ((vsmData.nodes?.length ?? 0) * 80);
              const id = crypto.randomUUID();
              const newNode: VSMNode = { id, type: 'data_box', position: { x: 150, y }, data: { type: 'data_box' } as any };
              setVsmData(prev => ({ ...prev, nodes: [...(prev.nodes ?? []), newNode] })); setIsDirty(true); setIsSaved(false);
            }} />
          </div>
        </div>
        {/* Canvas */}
        <div className="flex-1" ref={canvasRef}>
          <ReactFlow 
            nodes={rfNodes} 
            edges={rfEdges} 
            onNodeClick={onNodeClick} 
            onDrop={onDrop} 
            onDragOver={onDragOver}
            nodeTypes={VSM_NODE_TYPES as any}
            onConnect={({ source, target }) => {
              if (!source || !target) return;
              const sourceNode = (vsmData.nodes ?? []).find(n => n.id === source);
              const targetNode = (vsmData.nodes ?? []).find(n => n.id === target);
              const infoTypes = new Set(['info_flow', 'info_flow_manual', 'info_flow_electronic', 'data_box']);
              const flowType = (sourceNode && infoTypes.has(sourceNode.type)) || (targetNode && infoTypes.has(targetNode.type)) ? 'information' : 'material';
              const newEdge = { id: `e-${source}-${target}-${Math.random().toString(36).slice(2)}`, source, target, flowType } as any;
              setVsmData(prev => ({ ...prev, edges: [...(prev.edges ?? []), newEdge] }));
              setIsDirty(true); setIsSaved(false);
            }}
            onNodeDragStop={(_e, node) => {
              if (!vsmData.nodes) return;
              setVsmData(prev => ({
                ...prev,
                nodes: (prev.nodes ?? []).map(n => n.id === node.id ? { ...n, position: { x: node.position.x, y: node.position.y } } : n)
              }));
              setIsDirty(true); setIsSaved(false);
            }}
          >
          <MiniMap />
          <Controls />
          <Background gap={16} color="#F3F4F6" />
        </ReactFlow>
        </div>
      </div>

      {/* Modal de edición por tipo */}
      {showModal && (editingProcess || editingNode) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-full max-w-md p-4">
            <div className="text-lg font-semibold text-gray-900 mb-2">{editingNode ? `Editar ${editingNode.type}` : 'Editar Proceso'}</div>
            {editingNode && (
            <div className="space-y-3">
                {editingNode.type === 'process' && (
                  <>
              <div>
                <label className="block text-xs text-gray-600">Nombre</label>
                      <input value={(editingNode.data as any).nombre}
                        onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, nombre: e.target.value } as any }) : prev)}
                        className="w-full border rounded px-2 py-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                        <label className="block text-xs text-gray-600">Tiempo ciclo</label>
                        <div className="flex gap-2">
                          <input type="number" value={(editingNode.data as any).tiempo_ciclo_seg}
                            onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, tiempo_ciclo_seg: Number(e.target.value) } as any }) : prev)}
                            className="w-full border rounded px-2 py-1" />
                          <select value={editingUnit} onChange={(e) => setEditingUnit(e.target.value as any)} className="border rounded px-2">
                            <option value="seconds">s</option>
                            <option value="minutes">min</option>
                            <option value="hours">h</option>
                            <option value="days">d</option>
                          </select>
                        </div>
                </div>
                <div>
                        <label className="block text-xs text-gray-600">Tiempo cambio</label>
                        <input type="number" value={(editingNode.data as any).tiempo_cambio_seg}
                          onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, tiempo_cambio_seg: Number(e.target.value) } as any }) : prev)}
                          className="w-full border rounded px-2 py-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                        <label className="block text-xs text-gray-600">WIP (pzs)</label>
                        <input type="number" value={(editingNode.data as any).inventario_piezas}
                          onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, inventario_piezas: Number(e.target.value) } as any }) : prev)}
                          className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Operarios</label>
                        <input type="number" value={(editingNode.data as any).num_operarios}
                          onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, num_operarios: Number(e.target.value) } as any }) : prev)}
                          className="w-full border rounded px-2 py-1" />
                      </div>
                    </div>
                  </>
                )}
                {editingNode.type === 'inventory' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600">Cantidad</label>
                        <input type="number" value={(editingNode.data as any).cantidad}
                          onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, cantidad: Number(e.target.value) } as any }) : prev)}
                          className="w-full border rounded px-2 py-1" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Unidad</label>
                        <input value={(editingNode.data as any).unidad || ''}
                          onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, unidad: e.target.value } as any }) : prev)}
                          className="w-full border rounded px-2 py-1" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Espera (días)</label>
                      <input type="number" value={(editingNode.data as any).espera_dias ?? 0}
                        onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, espera_dias: Number(e.target.value) } as any }) : prev)}
                        className="w-full border rounded px-2 py-1" />
                    </div>
                  </>
                )}
                {editingNode.type === 'transport' && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600">Tiempo transporte (s)</label>
                      <input type="number" value={(editingNode.data as any).tiempo_transporte_seg ?? 0}
                        onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, tiempo_transporte_seg: Number(e.target.value) } as any }) : prev)}
                        className="w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Distancia (unid.)</label>
                      <input type="number" value={(editingNode.data as any).distancia_unidades ?? 0}
                        onChange={(e) => setEditingNode(prev => prev ? ({ ...prev, data: { ...prev.data, distancia_unidades: Number(e.target.value) } as any }) : prev)}
                        className="w-full border rounded px-2 py-1" />
                    </div>
                  </>
                )}
              </div>
            )}
            {editingProcess && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600">Nombre</label>
                  <input defaultValue={editingProcess.nombre} onChange={(e) => setEditingProcess({ ...editingProcess, nombre: e.target.value })} className="w-full border rounded px-2 py-1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600">Tiempo ciclo (s)</label>
                    <input type="number" defaultValue={editingProcess.tiempo_ciclo_seg} onChange={(e) => setEditingProcess({ ...editingProcess, tiempo_ciclo_seg: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                    <label className="block text-xs text-gray-600">Tiempo cambio (s)</label>
                    <input type="number" defaultValue={editingProcess.tiempo_cambio_seg} onChange={(e) => setEditingProcess({ ...editingProcess, tiempo_cambio_seg: Number(e.target.value) })} className="w-full border rounded px-2 py-1" />
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeModal} className="px-3 py-1.5 rounded border">Cancelar</button>
              {editingNode && (<button onClick={saveNode} className="px-3 py-1.5 rounded bg-blue-600 text-white">Guardar</button>)}
              {editingProcess && (<button onClick={() => editingProcess && saveProcess(editingProcess)} className="px-3 py-1.5 rounded bg-blue-600 text-white">Guardar</button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValueStreamMap;


