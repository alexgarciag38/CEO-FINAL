import React, { useState } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { KPIGrid } from '@/components/ui/KPICard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import {
  Target,
  TrendingUp,
  Lightbulb,
  Shield,
  Globe,
  Users,
  Download,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const EstrategicoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'objectives' | 'initiatives' | 'risks' | 'market'>('overview');
  
  // Mock data
  const strategicKPIs = [
    {
      id: 'market_share',
      title: 'Cuota de Mercado',
      value: 15.2,
      format: 'percentage' as const,
      change: 2.3,
      changeType: 'increase' as const,
      target: 18,
      icon: 'Globe'
    },
    {
      id: 'innovation_index',
      title: 'Índice Innovación',
      value: 78.5,
      format: 'percentage' as const,
      change: 5.8,
      changeType: 'increase' as const,
      target: 85,
      icon: 'Lightbulb'
    },
    {
      id: 'customer_retention',
      title: 'Retención Clientes',
      value: 92.3,
      format: 'percentage' as const,
      change: 1.2,
      changeType: 'increase' as const,
      target: 95,
      icon: 'Users'
    },
    {
      id: 'strategic_goals',
      title: 'Objetivos Cumplidos',
      value: 73.5,
      format: 'percentage' as const,
      change: 8.7,
      changeType: 'increase' as const,
      target: 80,
      icon: 'Target'
    },
    {
      id: 'competitive_advantage',
      title: 'Ventaja Competitiva',
      value: 4.2,
      format: 'number' as const,
      change: 0.3,
      changeType: 'increase' as const,
      target: 4.5,
      icon: 'TrendingUp'
    },
    {
      id: 'risk_score',
      title: 'Puntuación Riesgo',
      value: 2.8,
      format: 'number' as const,
      change: -0.5,
      changeType: 'decrease' as const,
      target: 2.5,
      icon: 'Shield'
    }
  ];

  const strategicObjectives = [
    {
      id: 'OBJ-001',
      title: 'Expandir a 3 nuevos mercados',
      description: 'Establecer presencia en Francia, Italia y Portugal',
      progress: 65,
      status: 'en_progreso',
      deadline: '2024-12-31',
      owner: 'Dirección Comercial',
      priority: 'alta'
    },
    {
      id: 'OBJ-002',
      title: 'Lanzar plataforma digital',
      description: 'Desarrollar y lanzar nueva plataforma de e-commerce',
      progress: 85,
      status: 'en_progreso',
      deadline: '2024-06-30',
      owner: 'Dirección Tecnología',
      priority: 'alta'
    },
    {
      id: 'OBJ-003',
      title: 'Certificación ISO 27001',
      description: 'Obtener certificación de seguridad de la información',
      progress: 45,
      status: 'en_progreso',
      deadline: '2024-09-30',
      owner: 'Dirección IT',
      priority: 'media'
    },
    {
      id: 'OBJ-004',
      title: 'Reducir huella de carbono 30%',
      description: 'Implementar iniciativas de sostenibilidad',
      progress: 30,
      status: 'planificado',
      deadline: '2024-12-31',
      owner: 'Dirección Operaciones',
      priority: 'media'
    },
    {
      id: 'OBJ-005',
      title: 'Aumentar NPS a 70+',
      description: 'Mejorar experiencia del cliente',
      progress: 90,
      status: 'completado',
      deadline: '2024-03-31',
      owner: 'Dirección Comercial',
      priority: 'alta'
    }
  ];

  const marketAnalysis = [
    { quarter: 'Q1 2023', marketSize: 2.8, ourShare: 12.5, competition: 87.5 },
    { quarter: 'Q2 2023', marketSize: 3.1, ourShare: 13.2, competition: 86.8 },
    { quarter: 'Q3 2023', marketSize: 3.3, ourShare: 14.1, competition: 85.9 },
    { quarter: 'Q4 2023', marketSize: 3.6, ourShare: 14.8, competition: 85.2 },
    { quarter: 'Q1 2024', marketSize: 3.8, ourShare: 15.2, competition: 84.8 }
  ];

  const riskMatrix = [
    { risk: 'Competencia agresiva', probability: 'Alta', impact: 'Alto', level: 'Crítico', mitigation: 'Diferenciación producto' },
    { risk: 'Cambios regulatorios', probability: 'Media', impact: 'Alto', level: 'Alto', mitigation: 'Monitoreo normativo' },
    { risk: 'Ciberseguridad', probability: 'Media', impact: 'Alto', level: 'Alto', mitigation: 'Inversión en seguridad' },
    { risk: 'Escasez de talento', probability: 'Alta', impact: 'Medio', level: 'Medio', mitigation: 'Programa retención' },
    { risk: 'Volatilidad económica', probability: 'Media', impact: 'Medio', level: 'Medio', mitigation: 'Diversificación' }
  ];

  const initiatives = [
    {
      name: 'Transformación Digital',
      budget: 450000,
      progress: 72,
      roi: 285,
      status: 'en_progreso',
      team: 'IT & Operaciones'
    },
    {
      name: 'Expansión Internacional',
      budget: 680000,
      progress: 58,
      roi: 195,
      status: 'en_progreso',
      team: 'Comercial & Marketing'
    },
    {
      name: 'Innovación Producto',
      budget: 320000,
      progress: 85,
      roi: 340,
      status: 'en_progreso',
      team: 'I+D & Producto'
    },
    {
      name: 'Sostenibilidad',
      budget: 180000,
      progress: 35,
      roi: 125,
      status: 'planificado',
      team: 'Operaciones & RRHH'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'objectives', label: 'Objetivos', icon: Target },
    { id: 'initiatives', label: 'Iniciativas', icon: Lightbulb },
    { id: 'risks', label: 'Riesgos', icon: Shield },
    { id: 'market', label: 'Mercado', icon: Globe }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completado': return 'bg-green-100 text-green-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'planificado': return 'bg-yellow-100 text-yellow-800';
      case 'retrasado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Crítico': return 'bg-red-100 text-red-800';
      case 'Alto': return 'bg-orange-100 text-orange-800';
      case 'Medio': return 'bg-yellow-100 text-yellow-800';
      case 'Bajo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas Estratégicas</h2>
              <KPIGrid kpis={strategicKPIs} columns={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución Cuota de Mercado</h3>
                <LineChart
                  data={marketAnalysis}
                  lines={[
                    { dataKey: 'ourShare', stroke: '#3b82f6', name: 'Nuestra Cuota' },
                    { dataKey: 'marketSize', stroke: '#10b981', name: 'Tamaño Mercado (B€)' }
                  ]}
                  height={280}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso Iniciativas Estratégicas</h3>
                <BarChart
                  data={initiatives}
                  bars={[
                    { dataKey: 'progress', fill: '#3b82f6', name: 'Progreso (%)' }
                  ]}
                  height={280}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {initiatives.map((initiative, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">{initiative.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium">{initiative.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${initiative.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Presupuesto</span>
                      <span className="font-medium">€{initiative.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ROI</span>
                      <span className="font-medium text-green-600">{initiative.roi}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Logros Clave</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• NPS mejorado a 72 puntos</li>
                  <li>• Cuota de mercado +2.3%</li>
                  <li>• 3 nuevos productos lanzados</li>
                  <li>• Certificación ISO obtenida</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-800 mb-3">Próximos Hitos</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• Lanzamiento plataforma Q2</li>
                  <li>• Expansión Francia Q3</li>
                  <li>• Certificación seguridad Q3</li>
                  <li>• Programa sostenibilidad Q4</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-semibold text-yellow-800 mb-3">Riesgos Monitoreados</h4>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li>• Competencia agresiva</li>
                  <li>• Cambios regulatorios</li>
                  <li>• Ciberseguridad</li>
                  <li>• Escasez de talento</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'objectives':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Objetivos Estratégicos</h2>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Objetivo
                </button>
              </div>

              <div className="space-y-4">
                {strategicObjectives.map((objective, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="font-semibold text-gray-900 mr-3">{objective.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(objective.priority)}`}>
                            {objective.priority}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${getStatusColor(objective.status)}`}>
                            {objective.status === 'completado' ? 'Completado' :
                             objective.status === 'en_progreso' ? 'En Progreso' : 'Planificado'}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{objective.description}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>Responsable: {objective.owner}</span>
                          <span>Fecha límite: {objective.deadline}</span>
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-blue-600">{objective.progress}%</div>
                        <div className="text-sm text-gray-500">Progreso</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          objective.progress >= 90 ? 'bg-green-500' :
                          objective.progress >= 70 ? 'bg-blue-500' :
                          objective.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${objective.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Matriz de Riesgos</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Riesgo</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Probabilidad</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Impacto</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Nivel</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Mitigación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskMatrix.map((risk, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{risk.risk}</td>
                        <td className="py-3 px-4 text-center">{risk.probability}</td>
                        <td className="py-3 px-4 text-center">{risk.impact}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(risk.level)}`}>
                            {risk.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{risk.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h2>
            <p className="text-gray-600">Contenido en desarrollo para esta sección.</p>
          </div>
        );
    }
  };

  return (
    <PageWrapper
      title="Módulo Estratégico"
      subtitle="Planificación estratégica, objetivos corporativos y análisis de mercado"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Estratégico', href: '/estrategico' }
      ]}
      actions={
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      }
    >
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

      {renderTabContent()}
    </PageWrapper>
  );
};

