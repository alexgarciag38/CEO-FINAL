import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface AIInsightsProps {
  analysisData: any;
}

interface InsightMessage {
  id: string;
  content: string;
  type: 'success' | 'warning' | 'info' | 'opportunity';
  timestamp: Date;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ analysisData }) => {
  const [insights, setInsights] = useState<InsightMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Función para parsear la respuesta de la IA y dividirla en insights
  const parseAIResponse = (response: string): InsightMessage[] => {
    const insights: InsightMessage[] = [];
    const sections = response.split(/(?=🎯|💡|🚀|💰|⚠️)/);
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        const type = section.includes('🎯') ? 'info' :
                    section.includes('💡') ? 'opportunity' :
                    section.includes('🚀') ? 'success' :
                    section.includes('💰') ? 'success' :
                    section.includes('⚠️') ? 'warning' : 'info';
        
        insights.push({
          id: `insight-${index}`,
          content: section.trim(),
          type,
          timestamp: new Date()
        });
      }
    });
    
    return insights;
  };

  useEffect(() => {
    if (!analysisData) return;

    const fetchAIInsights = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke('asistente-contextual', {
          body: {
            contexto: analysisData,
            pregunta: "Genera insights proactivos y recomendaciones estratégicas basadas en estos datos de ventas. Identifica oportunidades ocultas, riesgos críticos y acciones inmediatas que pueden generar ROI.",
            modo: 'generar_reporte'
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data && data.respuesta) {
          // Procesar la respuesta de la IA y dividirla en insights estructurados
          const insightsArray = parseAIResponse(data.respuesta);
          setInsights(insightsArray);
        }
      } catch (err: any) {
        console.error('Error fetching AI insights:', err);
        setError(err.message || 'Error al obtener insights de IA');
      } finally {
        setLoading(false);
      }
    };

    fetchAIInsights();
  }, [analysisData]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'opportunity':
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'opportunity':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  if (loading) {
    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-purple-700 text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights
            <Badge variant="secondary" className="ml-2">
              Analizando...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Analizando datos con IA...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-700 text-lg flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-sm">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights.length) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-purple-700 text-lg flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Insights
          <Badge variant="secondary" className="ml-2">
            {insights.length} insight{insights.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(showAll ? insights : insights.slice(0, 4)).map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-xs ${getInsightBadgeColor(insight.type)}`}>
                    {insight.type === 'success' && 'Éxito'}
                    {insight.type === 'warning' && 'Atención'}
                    {insight.type === 'opportunity' && 'Oportunidad'}
                    {insight.type === 'info' && 'Insight'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {insight.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-800 leading-relaxed">
                    <ReactMarkdown>{insight.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {insights.length > 4 && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
            >
              {showAll ? (
                <>
                  <span>Mostrar menos</span>
                </>
              ) : (
                <>
                  <span>Ver {insights.length - 4} insights más</span>
                </>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 