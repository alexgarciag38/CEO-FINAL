import React, { useCallback, useEffect, useState } from 'react';
import ValueStreamMap from '@/components/modules/vsm/ValueStreamMap';
import { VSMData } from '@/types/vsm';
import { useDeleteVsm, useVsmProject, useVsmProjects } from '@/hooks/useVsmProjects';

type ProjectItem = { id: string; name: string; created_at?: string };

const HerramientasLeanPage: React.FC = () => {
  const { projects, loading, error, refetch } = useVsmProjects();
  const [selected, setSelected] = useState<ProjectItem | null>(null);
  const [currentVsm, setCurrentVsm] = useState<VSMData | undefined>(undefined);
  const { fetchById } = useVsmProject();
  const { remove } = useDeleteVsm();
  useEffect(() => { refetch(); }, [refetch]);

  const handleCreateNew = useCallback(() => {
    setSelected(null);
    setCurrentVsm({ nombre: 'Nuevo VSM', demanda_cliente_unidades_mes: 1000, procesos: [] });
  }, []);

  const handleSelect = useCallback(async (p: ProjectItem) => {
    try {
      setSelected(p);
      const vsm = await fetchById(p.id);
      setCurrentVsm(vsm);
    } catch (_e) {}
  }, [fetchById]);

  const handleDelete = useCallback(async (p: ProjectItem) => {
    const okConfirm = window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`);
    if (!okConfirm) return;
    try {
      await remove(p.id);
      if (selected?.id === p.id) {
        setSelected(null);
        setCurrentVsm(undefined);
      }
      await refetch();
    } catch (_e) {}
  }, [remove, selected, refetch]);

  const handleSaved = useCallback(async (_saved: VSMData) => {
    await refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Herramientas Lean</h1>
        <p className="text-sm text-gray-600">Sistema 5 · Motor de Optimización de Procesos · Value Stream Mapping</p>
      </div>

      {/* Lista de VSMs */}
      {!currentVsm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Mapas VSM Existentes</h2>
            <button onClick={handleCreateNew} className="px-3 py-1.5 rounded bg-blue-600 text-white">Crear Nuevo Mapa VSM</button>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Cargando…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {projects.length === 0 && (
                <li className="py-3 text-sm text-gray-500">No hay mapas VSM aún.</li>
              )}
              {projects.map(p => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <button onClick={() => handleSelect(p)} className="text-left flex-1">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</div>
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSelect(p)} className="px-2 py-1 text-sm rounded border">Abrir</button>
                    <button
                      onClick={async () => {
                        try {
                          const vsm = await fetchById(p.id);
                          const clone: VSMData = { ...vsm, projectId: undefined, nombre: `Copia de ${vsm.nombre}` };
                          await fetchById; // no-op to satisfy lints if unused
                          // Guardar como nuevo usando procesar-vsm
                          // reutilizamos invoke indirectamente a través del editor; aquí llamamos directo
                          const { invoke } = await import('@/lib/api');
                          await invoke('procesar-vsm', { body: clone });
                          await refetch();
                        } catch (_e) {}
                      }}
                      className="px-2 py-1 text-sm rounded border">Duplicar</button>
                    <button onClick={() => handleDelete(p)} className="px-2 py-1 text-sm rounded border text-red-600 border-red-300">Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Editor VSM */}
      {currentVsm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <ValueStreamMap initialVsm={currentVsm} onSaved={handleSaved} onBackToList={() => { setCurrentVsm(undefined); setSelected(null); }} />
        </div>
      )}
    </div>
  );
};

export default HerramientasLeanPage;


