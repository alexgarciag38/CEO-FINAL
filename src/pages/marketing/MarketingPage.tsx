import React, { useState } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { KPIGrid } from '@/components/ui/KPICard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import {
  generateMarketingKPIs,
  generateCampaigns,
  generateChannelPerformance,
  generateFunnelData,
  generateMonthlyMarketingData,
  generateAudienceSegments,
  generateCompetitorAnalysis,
  generateCampaignTypesPerformance,
  generateABTestResults
} from '@/data/marketingData';
import {
  TrendingUp,
  Users,
  Target,
  Megaphone,
  BarChart3,
  Eye,
  Play,
  Pause,
  Edit,
  MoreHorizontal,
  Download,
  Filter,
  Plus
} from 'lucide-react';

export const MarketingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'channels' | 'funnel' | 'audience' | 'competitors'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('12m');
  
  // Data
  const marketingKPIs = generateMarketingKPIs();
  const campaigns = generateCampaigns();
  const channelPerformance = generateChannelPerformance();
  const funnelData = generateFunnelData();
  const monthlyData = generateMonthlyMarketingData();
  const audienceSegments = generateAudienceSegments();
  const competitorAnalysis = generateCompetitorAnalysis();
  const campaignTypes = generateCampaignTypesPerformance();
  const abTestResults = generateABTestResults();

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'campaigns', label: 'Campañas', icon: Megaphone },
    { id: 'channels', label: 'Canales', icon: BarChart3 },
    { id: 'funnel', label: 'Embudo', icon: Target },
    { id: 'audience', label: 'Audiencia', icon: Users },
    { id: 'competitors', label: 'Competencia', icon: Eye }
  ];

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'social': return '📱';
      case 'ppc': return '🎯';
      case 'content': return '📝';
      case 'display': return '🖼️';
      default: return '📊';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Marketing KPIs */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Métricas de Marketing
              </h2>
              <KPIGrid kpis={marketingKPIs} columns={3} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Performance */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Rendimiento Mensual
                </h3>
                <LineChart
                  data={monthlyData}
                  lines={[
                    { dataKey: 'inversion', stroke: '#ef4444', name: 'Inversión' },
                    { dataKey: 'leads', stroke: '#10b981', name: 'Leads' },
                    { dataKey: 'roas', stroke: '#3b82f6', name: 'ROAS' }
                  ]}
                  height={280}
                />
              </div>

              {/* Channel Performance */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Rendimiento por Canal
                </h3>
                <BarChart
                  data={channelPerformance}
                  bars={[
                    { dataKey: 'revenue', fill: '#10b981', name: 'Ingresos' },
                    { dataKey: 'cost', fill: '#ef4444', name: 'Costo' }
                  ]}
                  height={280}
                />
              </div>
            </div>

            {/* Campaign Types Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rendimiento por Tipo de Campaña
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tipo</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Campañas</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Presupuesto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Gastado</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Conversiones</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignTypes.map((type, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{type.type}</td>
                        <td className="py-3 px-4 text-right">{type.campaigns}</td>
                        <td className="py-3 px-4 text-right">€{type.budget.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">€{type.spent.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{type.conversions}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            type.roas > 4 ? 'text-green-600' : 
                            type.roas > 2 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {type.roas.toFixed(1)}x
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* A/B Test Results */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Resultados de Tests A/B
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Ver todos
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {abTestResults.slice(0, 4).map((test, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{test.test}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        test.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {test.status === 'completed' ? 'Completado' : 'En curso'}
                      </span>
                    </div>
                    {test.status === 'completed' && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          Ganador: <span className="font-medium">{test.winner}</span>
                        </p>
                        <p className="text-sm">
                          Mejora: <span className={`font-medium ${
                            test.improvement > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {test.improvement > 0 ? '+' : ''}{test.improvement.toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Confianza: {test.confidence}%
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'campaigns':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gestión de Campañas
                </h2>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Campaña
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Campaña</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Estado</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Presupuesto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Gastado</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Impresiones</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Clics</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">CTR</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">ROAS</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="text-lg mr-3">{getCampaignTypeIcon(campaign.type)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{campaign.name}</p>
                              <p className="text-xs text-gray-500">{campaign.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                            {campaign.status === 'active' ? 'Activa' :
                             campaign.status === 'paused' ? 'Pausada' :
                             campaign.status === 'completed' ? 'Completada' : 'Borrador'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">€{campaign.budget.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">€{campaign.spent.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{campaign.impressions.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{campaign.clicks.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{campaign.ctr.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            campaign.roas > 4 ? 'text-green-600' : 
                            campaign.roas > 2 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {campaign.roas > 0 ? `${campaign.roas.toFixed(1)}x` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {campaign.status === 'active' ? (
                              <button className="text-gray-400 hover:text-yellow-600">
                                <Pause className="w-4 h-4" />
                              </button>
                            ) : (
                              <button className="text-gray-400 hover:text-green-600">
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            <button className="text-gray-400 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'channels':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Rendimiento por Canal
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {channelPerformance.map((channel, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">{channel.channel}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Visitantes</span>
                        <span className="font-medium">{channel.visitors.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conversiones</span>
                        <span className="font-medium">{channel.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ingresos</span>
                        <span className="font-medium">€{channel.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Costo</span>
                        <span className="font-medium">€{channel.cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ROI</span>
                        <span className={`font-medium ${
                          channel.roi > 300 ? 'text-green-600' : 
                          channel.roi > 100 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {channel.roi}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">CPA</span>
                        <span className="font-medium">€{channel.cpa.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">ROI por Canal</h4>
                  <BarChart
                    data={channelPerformance}
                    bars={[
                      { dataKey: 'roi', fill: '#3b82f6', name: 'ROI (%)' }
                    ]}
                    height={250}
                    showLegend={false}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Distribución de Ingresos</h4>
                  <PieChart
                    data={channelPerformance.map((channel, index) => ({
                      name: channel.channel,
                      value: channel.revenue,
                      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'][index]
                    }))}
                    height={250}
                    innerRadius={50}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'funnel':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Embudo de Conversión
              </h2>
              
              <div className="space-y-4 mb-8">
                {funnelData.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{stage.stage}</span>
                      <div className="text-right">
                        <span className="font-bold text-lg">{stage.count.toLocaleString()}</span>
                        <span className="text-sm text-gray-600 ml-2">({stage.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div 
                        className="h-8 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ 
                          width: `${stage.percentage}%`, 
                          backgroundColor: stage.color,
                          minWidth: '60px'
                        }}
                      >
                        {stage.percentage}%
                      </div>
                    </div>
                    {index < funnelData.length - 1 && (
                      <div className="text-center mt-2 text-sm text-gray-500">
                        ↓ {((funnelData[index + 1].count / stage.count) * 100).toFixed(1)}% conversión
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Tasa de Conversión Global</h4>
                  <p className="text-2xl font-bold text-blue-900">0.9%</p>
                  <p className="text-sm text-blue-700">405 clientes de 45,000 visitantes</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Oportunidades de Mejora</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Optimizar landing pages (+15% leads)</li>
                    <li>• Mejorar nurturing (+20% oportunidades)</li>
                    <li>• Acelerar proceso de ventas (+10% cierre)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'audience':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Segmentos de Audiencia
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Segmento</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Tamaño</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Conv. Rate</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">AOV</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Ingresos</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Crecimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audienceSegments.map((segment, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{segment.segment}</td>
                        <td className="py-3 px-4 text-right">{segment.size.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{segment.conversionRate.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-right">€{segment.avgOrderValue}</td>
                        <td className="py-3 px-4 text-right">€{segment.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            segment.growth > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {segment.growth > 0 ? '+' : ''}{segment.growth.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'competitors':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Análisis de Competencia
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitorAnalysis.map((competitor, index) => (
                  <div key={index} className={`border rounded-lg p-6 ${
                    competitor.competitor === 'Nuestra Empresa' 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200'
                  }`}>
                    <h3 className="font-semibold text-gray-900 mb-4">{competitor.competitor}</h3>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cuota de Mercado</span>
                        <span className="font-medium">{competitor.marketShare}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Presencia Digital</span>
                        <span className="font-medium">{competitor.digitalPresence}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Seguidores Sociales</span>
                        <span className="font-medium">{competitor.socialFollowers.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Presupuesto Est.</span>
                        <span className="font-medium">€{competitor.estimatedBudget.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <h5 className="text-sm font-medium text-green-800 mb-1">Fortalezas</h5>
                        <ul className="text-xs text-green-700">
                          {competitor.strengths.map((strength, i) => (
                            <li key={i}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-red-800 mb-1">Debilidades</h5>
                        <ul className="text-xs text-red-700">
                          {competitor.weaknesses.map((weakness, i) => (
                            <li key={i}>• {weakness}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageWrapper
      title="Módulo de Marketing"
      subtitle="Gestión completa de campañas, análisis de canales y optimización de conversiones"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Marketing', href: '/marketing' }
      ]}
      actions={
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="12m">Últimos 12 meses</option>
          </select>
          
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </PageWrapper>
  );
};

