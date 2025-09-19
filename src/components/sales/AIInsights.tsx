// --- ARCHIVO: src/components/AIInsights.tsx (Versión Corregida) ---

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, Loader2 } from 'lucide-react';

export const AIInsights = ({ analysisData }) => {
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async () => {
      if (!analysisData) return;

      setIsLoading(true);
      setError('');
      setInsight('');

      try {
        const { data, error: functionError } = await supabase.functions.invoke('asistente-contextual', {
          body: {
            contexto: analysisData,
            modo: 'generar_reporte' // <-- LA CORRECCIÓN CRÍTICA ESTÁ AQUÍ
          }
        });

        if (functionError) throw functionError;
        
        setInsight(data.respuesta);

      } catch (err: any) {
        console.error("Error fetching AI insights:", err);
        setError("No se pudieron generar los insights en este momento.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [analysisData]); // Se ejecuta cada vez que el análisis principal cambia

  if (!analysisData) return null; // No mostrar nada si no hay datos que analizar

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="mr-2 text-primary" />
          Insights de SALES MASTER PRO
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none">
        {isLoading && (
          <div className="flex items-center text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analizando datos y generando recomendaciones...
          </div>
        )}
        {error && <p className="text-destructive">{error}</p>}
        {insight && !isLoading && <ReactMarkdown>{insight}</ReactMarkdown>}
      </CardContent>
    </Card>
  );
}; 