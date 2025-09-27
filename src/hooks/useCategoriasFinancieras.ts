import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface CategoriaFin {
  id: string;
  nombre: string;
  tipo: 'Ingreso' | 'Egreso';
  activa: boolean;
  color?: string | null;
  subcategorias: { id: string; nombre: string; activa: boolean }[];
}

export function useCategoriasFinancieras() {
  const [data, setData] = useState<CategoriaFin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No autenticado');
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/listar-configuracion-gastos`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!res.ok) throw new Error('Error cargando categorías');
        const json = await res.json();
        setData(json.categorias || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { categorias: data, loading, error };
}






