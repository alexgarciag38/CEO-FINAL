import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@/lib/api';
import { VSMData } from '@/types/vsm';

export type VsmProjectItem = { id: string; name: string; created_at?: string };

export function useVsmProjects() {
  const [projects, setProjects] = useState<VsmProjectItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await invoke<{ projects: VsmProjectItem[] }>('list-vsm-projects');
      setProjects(res.projects || []);
    } catch (e: any) {
      setError(e?.message || 'Error al listar VSMs');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { projects, loading, error, refetch };
}

export function useVsmProject() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchById = useCallback(async (projectId: string): Promise<VSMData & { projectId: string }> => {
    try {
      setLoading(true); setError(null);
      const { project } = await invoke<{ project: { id: string; name: string; vsm: VSMData } }>('get-vsm-project', { body: { projectId } });
      const vsm = project.vsm as VSMData;
      return { ...vsm, projectId: project.id, nombre: project.name } as VSMData & { projectId: string };
    } catch (e: any) {
      setError(e?.message || 'Error al cargar VSM');
      throw e;
    } finally { setLoading(false); }
  }, []);

  return { fetchById, loading, error };
}

export function useDeleteVsm() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (projectId: string) => {
    try {
      setLoading(true); setError(null);
      await invoke('delete-vsm-project', { body: { projectId } });
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar VSM');
      throw e;
    } finally { setLoading(false); }
  }, []);

  return { remove, loading, error };
}



