import React, { useState } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { KPIGrid } from '@/components/ui/KPICard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Download,
  Plus,
  Edit,
  Eye,
  MoreHorizontal
} from 'lucide-react';

export const CRMPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'leads' | 'opportunities' | 'activities'>('overview');
  
  // Mock data
  const crmKPIs = [
    {
      id: 'total_customers',
      title: 'Clientes Totales',
      value: 1890,
      format: 'number' as const,
      change: 15.7,
      changeType: 'increase' as const,
      target: 2000,
      icon: 'Users'
    },
    {
      id: 'new_leads',
      title: 'Nuevos Leads',
      value: 247,
      format: 'number' as const,
      change: 22.3,
      changeType: 'increase' as const,
      target: 300,
      icon: 'UserPlus'
    },
    {
      id: 'conversion_rate',
      title: 'Tasa de Conversión',
      value: 18.5,
      format: 'percentage' as const,
      change: 3.2,
      changeType: 'increase' as const,
      target: 20,
      icon: 'Target'
    },
    {
      id: 'avg_deal_size',
      title: 'Valor Promedio Deal',
      value: 2850,
      format: 'currency' as const,
      change: 8.9,
      changeType: 'increase' as const,
      target: 3000,
      icon: 'DollarSign'
    },
    {
      id: 'pipeline_value',
      title: 'Valor Pipeline',
      value: 456000,
      format: 'currency' as const,
      change: 12.1,
      changeType: 'increase' as const,
      target: 500000,
      icon: 'TrendingUp'
    },
    {
      id: 'customer_satisfaction',
      title: 'Satisfacción Cliente',
      value: 4.6,
      format: 'number' as const,
      change: 0.3,
      changeType: 'increase' as const,
      target: 4.8,
      icon: 'Users'
    }
  ];

  const customerSegments = [
    { segment: 'Enterprise', count: 45, revenue: 285000, avgValue: 6333, color: '#ef4444' },
    { segment: 'SMB', count: 234, revenue: 187200, avgValue: 800, color: '#f59e0b' },
    { segment: 'Startup', count: 567, revenue: 113400, avgValue: 200, color: '#10b981' },
    { segment: 'Individual', count: 1044, revenue: 52200, avgValue: 50, color: '#3b82f6' }
  ];

  const pipelineStages = [
    { stage: 'Prospecto', count: 156, value: 234000, probability: 10 },
    { stage: 'Calificado', count: 89, value: 178000, probability: 25 },
    { stage: 'Propuesta', count: 45, value: 135000, probability: 50 },
    { stage: 'Negociación', count: 23, value: 92000, probability: 75 },
    { stage: 'Cierre', count: 12, value: 48000, probability: 90 }
  ];

  const recentCustomers = [
    { name: 'Empresa ABC S.L.', type: 'Enterprise', value: 15000, status: 'Activo', lastContact: '2024-01-03' },
    { name: 'Startup XYZ', type: 'Startup', value: 2500, status: 'Prospecto', lastContact: '2024-01-02' },
    { name: 'Corporación DEF', type: 'SMB', value: 8500, status: 'Negociación', lastContact: '2024-01-01' },
    { name: 'Innovación GHI', type: 'Enterprise', value: 22000, status: 'Propuesta', lastContact: '2023-12-30' },
    { name: 'Servicios JKL', type: 'SMB', value: 4200, status: 'Activo', lastContact: '2023-12-29' }
  ];

  const monthlyData = [
    { month: 'Jul', nuevosClientes: 45, ingresos: 89000, satisfaccion: 4.2 },
    { month: 'Ago', nuevosClientes: 52, ingresos: 95000, satisfaccion: 4.3 },
    { month: 'Sep', nuevosClientes: 48, ingresos: 102000, satisfaccion: 4.4 },
    { month: 'Oct', nuevosClientes: 61, ingresos: 118000, satisfaccion: 4.5 },
    { month: 'Nov', nuevosClientes: 58, ingresos: 125000, satisfaccion: 4.6 },
    { month: 'Dic', nuevosClientes: 67, ingresos: 142000, satisfaccion: 4.6 },
    { month: 'Ene', nuevosClientes: 73, ingresos: 156000, satisfaccion: 4.7 }
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'leads', label: 'Leads', icon: UserPlus },
    { id: 'opportunities', label: 'Oportunidades', icon: Target },
    { id: 'activities', label: 'Actividades', icon: Calendar }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Prospecto': return 'bg-blue-100 text-blue-800';
      case 'Negociación': return 'bg-yellow-100 text-yellow-800';
      case 'Propuesta': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas CRM</h2>
              <KPIGrid kpis={crmKPIs} columns={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Clientes</h3>
                <LineChart
                  data={monthlyData}
                  lines={[
                    { dataKey: 'nuevosClientes', stroke: '#3b82f6', name: 'Nuevos Clientes' },
                    { dataKey: 'satisfaccion', stroke: '#10b981', name: 'Satisfacción' }
                  ]}
                  height={280}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Segmentos de Clientes</h3>
                <PieChart
                  data={customerSegments.map(segment => ({
                    name: segment.segment,
                    value: segment.count,
                    color: segment.color
                  }))}
                  height={280}
                  innerRadius={60}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline de Ventas</h3>
              <BarChart
                data={pipelineStages}
                bars={[
                  { dataKey: 'count', fill: '#3b82f6', name: 'Oportunidades' },
                  { dataKey: 'value', fill: '#10b981', name: 'Valor (€)' }
                ]}
                height={300}
              />
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Clientes</h2>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Cliente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {customerSegments.map((segment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{segment.segment}</h4>
                    <p className="text-2xl font-bold" style={{ color: segment.color }}>
                      {segment.count}
                    </p>
                    <p className="text-sm text-gray-600">€{segment.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Promedio: €{segment.avgValue}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tipo</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Valor</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Último Contacto</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCustomers.map((customer, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{customer.name}</td>
                        <td className="py-3 px-4 text-gray-600">{customer.type}</td>
                        <td className="py-3 px-4 text-right font-medium">€{customer.value.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{customer.lastContact}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button className="text-gray-400 hover:text-blue-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-green-600">
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
      title="Módulo CRM"
      subtitle="Gestión de relaciones con clientes, leads y oportunidades de venta"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'CRM', href: '/crm' }
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

