import React, { useState } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { KPIGrid } from '@/components/ui/KPICard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import {
  Users,
  UserPlus,
  UserMinus,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  DollarSign,
  Download,
  Plus,
  Edit,
  Eye,
  MoreHorizontal
} from 'lucide-react';

export const RRHHPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'recruitment' | 'performance' | 'payroll'>('overview');
  
  // Mock data
  const hrKPIs = [
    {
      id: 'total_employees',
      title: 'Empleados Totales',
      value: 127,
      format: 'number' as const,
      change: 8.5,
      changeType: 'increase' as const,
      target: 135,
      icon: 'Users'
    },
    {
      id: 'new_hires',
      title: 'Nuevas Contrataciones',
      value: 12,
      format: 'number' as const,
      change: 20.0,
      changeType: 'increase' as const,
      target: 15,
      icon: 'UserPlus'
    },
    {
      id: 'turnover_rate',
      title: 'Tasa de Rotación',
      value: 8.3,
      format: 'percentage' as const,
      change: -2.1,
      changeType: 'decrease' as const,
      target: 7.0,
      icon: 'UserMinus'
    },
    {
      id: 'avg_salary',
      title: 'Salario Promedio',
      value: 52000,
      format: 'currency' as const,
      change: 5.2,
      changeType: 'increase' as const,
      target: 55000,
      icon: 'DollarSign'
    },
    {
      id: 'satisfaction',
      title: 'Satisfacción Laboral',
      value: 4.2,
      format: 'number' as const,
      change: 0.3,
      changeType: 'increase' as const,
      target: 4.5,
      icon: 'Award'
    },
    {
      id: 'productivity',
      title: 'Índice Productividad',
      value: 87.5,
      format: 'percentage' as const,
      change: 3.8,
      changeType: 'increase' as const,
      target: 90,
      icon: 'TrendingUp'
    }
  ];

  const departmentData = [
    { department: 'Tecnología', employees: 45, budget: 2340000, avgSalary: 58000, color: '#3b82f6' },
    { department: 'Ventas', employees: 28, budget: 1456000, avgSalary: 52000, color: '#10b981' },
    { department: 'Marketing', employees: 18, budget: 936000, avgSalary: 48000, color: '#f59e0b' },
    { department: 'Operaciones', employees: 22, budget: 1100000, avgSalary: 45000, color: '#ef4444' },
    { department: 'RRHH', employees: 8, budget: 400000, avgSalary: 50000, color: '#8b5cf6' },
    { department: 'Finanzas', employees: 6, budget: 360000, avgSalary: 60000, color: '#6b7280' }
  ];

  const performanceData = [
    { level: 'Excepcional', count: 18, percentage: 14.2, color: '#10b981' },
    { level: 'Supera Expectativas', count: 35, percentage: 27.6, color: '#3b82f6' },
    { level: 'Cumple Expectativas', count: 58, percentage: 45.7, color: '#f59e0b' },
    { level: 'Necesita Mejora', count: 13, percentage: 10.2, color: '#ef4444' },
    { level: 'Insatisfactorio', count: 3, percentage: 2.4, color: '#6b7280' }
  ];

  const monthlyHRData = [
    { month: 'Jul', contrataciones: 8, salidas: 5, satisfaccion: 4.0, productividad: 82 },
    { month: 'Ago', contrataciones: 6, salidas: 7, satisfaccion: 4.1, productividad: 84 },
    { month: 'Sep', contrataciones: 10, salidas: 4, satisfaccion: 4.0, productividad: 85 },
    { month: 'Oct', contrataciones: 12, salidas: 6, satisfaccion: 4.2, productividad: 86 },
    { month: 'Nov', contrataciones: 9, salidas: 3, satisfaccion: 4.2, productividad: 87 },
    { month: 'Dic', contrataciones: 7, salidas: 8, satisfaccion: 4.1, productividad: 88 },
    { month: 'Ene', contrataciones: 11, salidas: 4, satisfaccion: 4.3, productividad: 89 }
  ];

  const recentEmployees = [
    { name: 'Ana García López', department: 'Tecnología', position: 'Senior Developer', salary: 65000, startDate: '2024-01-15', status: 'Activo' },
    { name: 'Carlos Martín Ruiz', department: 'Ventas', position: 'Account Manager', salary: 48000, startDate: '2024-01-10', status: 'Activo' },
    { name: 'María Rodríguez', department: 'Marketing', position: 'Marketing Specialist', salary: 42000, startDate: '2024-01-08', status: 'Activo' },
    { name: 'Juan Pérez Sánchez', department: 'Operaciones', position: 'Operations Analyst', salary: 38000, startDate: '2024-01-05', status: 'Activo' },
    { name: 'Laura Fernández', department: 'RRHH', position: 'HR Coordinator', salary: 45000, startDate: '2023-12-20', status: 'Activo' }
  ];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'employees', label: 'Empleados', icon: Users },
    { id: 'recruitment', label: 'Reclutamiento', icon: UserPlus },
    { id: 'performance', label: 'Rendimiento', icon: Award },
    { id: 'payroll', label: 'Nómina', icon: DollarSign }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Métricas de RRHH</h2>
              <KPIGrid kpis={hrKPIs} columns={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias Mensuales</h3>
                <LineChart
                  data={monthlyHRData}
                  lines={[
                    { dataKey: 'contrataciones', stroke: '#10b981', name: 'Contrataciones' },
                    { dataKey: 'salidas', stroke: '#ef4444', name: 'Salidas' },
                    { dataKey: 'satisfaccion', stroke: '#3b82f6', name: 'Satisfacción' }
                  ]}
                  height={280}
                />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Empleados por Departamento</h3>
                <PieChart
                  data={departmentData.map(dept => ({
                    name: dept.department,
                    value: dept.employees,
                    color: dept.color
                  }))}
                  height={280}
                  innerRadius={60}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Rendimiento</h3>
              <BarChart
                data={performanceData}
                bars={[
                  { dataKey: 'count', fill: '#3b82f6', name: 'Empleados' }
                ]}
                height={300}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Fortalezas</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• Baja rotación de personal (8.3%)</li>
                  <li>• Crecimiento en contrataciones</li>
                  <li>• Mejora en satisfacción laboral</li>
                  <li>• Productividad en aumento</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="font-semibold text-yellow-800 mb-3">Áreas de Mejora</h4>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li>• Acelerar proceso de reclutamiento</li>
                  <li>• Programas de desarrollo profesional</li>
                  <li>• Equilibrio trabajo-vida personal</li>
                  <li>• Comunicación interna</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-800 mb-3">Iniciativas 2024</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• Programa de mentoring</li>
                  <li>• Certificaciones técnicas</li>
                  <li>• Trabajo remoto híbrido</li>
                  <li>• Wellness corporativo</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'employees':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Empleados</h2>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Empleado
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {departmentData.map((dept, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{dept.department}</h4>
                    <p className="text-2xl font-bold" style={{ color: dept.color }}>
                      {dept.employees}
                    </p>
                    <p className="text-xs text-gray-500">€{dept.avgSalary.toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Empleado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Departamento</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Posición</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Salario</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha Inicio</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Estado</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEmployees.map((employee, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-blue-600">
                                {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{employee.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{employee.department}</td>
                        <td className="py-3 px-4 text-gray-600">{employee.position}</td>
                        <td className="py-3 px-4 text-right font-medium">€{employee.salary.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-600">{employee.startDate}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {employee.status}
                          </span>
                        </td>
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
      title="Módulo RRHH"
      subtitle="Gestión de recursos humanos, empleados y desarrollo organizacional"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'RRHH', href: '/rrhh' }
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

