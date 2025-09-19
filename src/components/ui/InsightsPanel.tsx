import React from 'react';
import { generateInsights } from '@/utils/visualHelpers';
import { Lightbulb, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface InsightsPanelProps {
  data: any;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ data }) => {
  const insights = generateInsights(data);

  const getInsightIcon = (insight: string) => {
    if (insight.includes('🚨') || insight.includes('⚠️')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (insight.includes('🏆') || insight.includes('👑')) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (insight.includes('💰')) return <Target className="w-4 h-4 text-blue-500" />;
    return <Lightbulb className="w-4 h-4 text-yellow-500" />;
  };

  const getInsightColor = (insight: string) => {
    if (insight.includes('🚨')) return 'border-red-200 bg-red-50';
    if (insight.includes('⚠️')) return 'border-yellow-200 bg-yellow-50';
    if (insight.includes('🏆') || insight.includes('👑')) return 'border-green-200 bg-green-50';
    if (insight.includes('💰')) return 'border-blue-200 bg-blue-50';
    return 'border-gray-200 bg-gray-50';
  };

  if (!insights.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Insights Automáticos</h3>
        </div>
        <p className="text-gray-500 text-sm">No hay insights disponibles para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 card-hover fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">🧠 Insights Automáticos</h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div 
            key={index}
            className={`flex items-start gap-3 p-3 rounded-lg border card-hover slide-up ${getInsightColor(insight)}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {getInsightIcon(insight)}
            <p className="text-sm font-medium text-gray-800 flex-1">
              {insight}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Los insights se generan automáticamente basándose en tus datos actuales
        </p>
      </div>
    </div>
  );
}; 