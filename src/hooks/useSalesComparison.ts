import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ComparisonData {
  actual: number;
  anterior: number;
  variacion: number;
}

interface ComparisonResult {
  comparaciones: {
    ventasTotales: ComparisonData;
    unidadesVendidas: ComparisonData;
    margenBruto: ComparisonData;
    totalPedidos: ComparisonData;
    ventasMostrador: ComparisonData;
    ventasConAgente: ComparisonData;
  };
  periodoActual: { mes: number; anio: number };
  periodoComparacion: { mes: number; anio: number } | null;
  tieneComparacion: boolean;
}

interface UseSalesComparisonReturn {
  comparisonData: ComparisonResult | null;
  isLoading: boolean;
  error: string | null;
  fetchComparison: (mes: number, anio: number, tipoComparacion: string) => Promise<void>;
}

export const useSalesComparison = (): UseSalesComparisonReturn => {
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async (mes: number, anio: number, tipoComparacion: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No autenticado');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/comparar-ventas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          mes,
          anio,
          tipoComparacion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener comparación');
      }

      const data = await response.json();
      setComparisonData(data);

    } catch (err: any) {
      console.error('Error fetching comparison:', err);
      setError(err.message || 'Error al cargar comparación');
      setComparisonData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    comparisonData,
    isLoading,
    error,
    fetchComparison
  };
}; 