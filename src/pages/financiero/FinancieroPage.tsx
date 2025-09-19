import React, { useState } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { KPIGrid } from '@/components/ui/KPICard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { PaymentsList } from '@/components/finanzas/PaymentsList';
import { PaymentsSheet } from '@/components/finanzas/PaymentsSheet';
import { PaymentsHistory } from '@/components/finanzas/PaymentsHistory';
import { FinancialExcelTabs } from '@/components/finanzas/FinancialExcelTabs';
import {
  generateFinancialKPIs,
  generateCashFlowData,
  generateProfitLossData,
  generateBalanceSheetData,
  generateFinancialRatios,
  generateBudgetVsActual,
  generateExpenseBreakdown,
  generateQuarterlyComparison
} from '@/data/financialData';
import {
  TrendingUp,
  DollarSign,
  Calculator,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const FinancieroPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pnl' | 'balance' | 'cashflow' | 'ratios' | 'budget' | 'payments' | 'history'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('12m');
  
  // Data
  const financialKPIs = generateFinancialKPIs();
  const cashFlowData = generateCashFlowData();
  const profitLossData = generateProfitLossData();
  const balanceSheetData = generateBalanceSheetData();
  const financialRatios = generateFinancialRatios();
  const budgetVsActual = generateBudgetVsActual();
  const expenseBreakdown = generateExpenseBreakdown();
  const quarterlyComparison = generateQuarterlyComparison();

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'pnl', label: 'P&L', icon: FileText },
    { id: 'balance', label: 'Balance', icon: BarChart3 },
    { id: 'cashflow', label: 'Flujo de Caja', icon: DollarSign },
    { id: 'ratios', label: 'Ratios', icon: Calculator },
    { id: 'budget', label: 'Presupuesto', icon: PieChartIcon },
    { id: 'payments', label: 'Pagos', icon: FileText },
    { id: 'history', label: 'Historial de Pagos', icon: FileText }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Financial KPIs */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Métricas Financieras Principales
              </h2>
              <KPIGrid kpis={financialKPIs} columns={3} />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Flow Trend */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Flujo de Caja Mensual
                </h3>
                <LineChart
                  data={cashFlowData}
                  lines={[
                    { dataKey: 'ingresos', stroke: '#10b981', name: 'Ingresos' },
                    { dataKey: 'gastos', stroke: '#ef4444', name: 'Gastos' },
                    { dataKey: 'flujoNeto', stroke: '#3b82f6', name: 'Flujo Neto' }
                  ]}
                  height={280}
                />
              </div>

              {/* Expense Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribución de Gastos
                </h3>
                <PieChart
                  data={expenseBreakdown.map(item => ({
                    name: item.categoria,
                    value: item.porcentaje,
                    color: item.color
                  }))}
                  height={280}
                  innerRadius={60}
                />
              </div>
            </div>

            {/* Quarterly Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rendimiento Trimestral
              </h3>
              <BarChart
                data={quarterlyComparison}
                bars={[
                  { dataKey: 'ingresos', fill: '#10b981', name: 'Ingresos' },
                  { dataKey: 'gastos', fill: '#ef4444', name: 'Gastos' },
                  { dataKey: 'beneficio', fill: '#3b82f6', name: 'Beneficio' }
                ]}
                height={300}
              />
            </div>

            {/* Financial Health Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">Fortalezas</h4>
                </div>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• Flujo de caja positivo y creciente</li>
                  <li>• ROE superior al benchmark (22.3%)</li>
                  <li>• Ratio de liquidez saludable (2.8)</li>
                  <li>• Crecimiento sostenido de ingresos</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-2" />
                  <h4 className="font-semibold text-yellow-800">Atención</h4>
                </div>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li>• Margen operativo ligeramente bajo</li>
                  <li>• Gastos de marketing en aumento</li>
                  <li>• Inventario necesita optimización</li>
                  <li>• Revisar estructura de costos</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-800">Oportunidades</h4>
                </div>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• Expandir líneas de productos rentables</li>
                  <li>• Optimizar gastos operativos</li>
                  <li>• Mejorar rotación de inventario</li>
                  <li>• Inversión en tecnología</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'pnl':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Estado de Resultados (P&L)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Concepto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Actual</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Presupuesto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Variación</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitLossData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.concepto}</td>
                        <td className="py-3 px-4 text-right">€{item.actual.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-gray-600">€{item.presupuesto.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            item.variacion > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            €{item.variacion.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            item.porcentaje > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.porcentaje > 0 ? '+' : ''}{item.porcentaje.toFixed(1)}%
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

      case 'balance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activos</h3>
                <div className="space-y-3">
                  {balanceSheetData.activos.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.concepto}</span>
                      <div className="text-right">
                        <p className="font-medium">€{item.actual.toLocaleString()}</p>
                        <p className={`text-xs ${
                          item.variacion > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.variacion > 0 ? '+' : ''}{item.variacion.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pasivos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pasivos</h3>
                <div className="space-y-3">
                  {balanceSheetData.pasivos.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.concepto}</span>
                      <div className="text-right">
                        <p className="font-medium">€{item.actual.toLocaleString()}</p>
                        <p className={`text-xs ${
                          item.variacion < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.variacion > 0 ? '+' : ''}{item.variacion.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patrimonio */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patrimonio</h3>
                <div className="space-y-3">
                  {balanceSheetData.patrimonio.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{item.concepto}</span>
                      <div className="text-right">
                        <p className="font-medium">€{item.actual.toLocaleString()}</p>
                        <p className={`text-xs ${
                          item.variacion > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.variacion > 0 ? '+' : ''}{item.variacion.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'cashflow':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Análisis de Flujo de Caja
              </h2>
              <div className="mb-6">
                <LineChart
                  data={cashFlowData}
                  lines={[
                    { dataKey: 'acumulado', stroke: '#3b82f6', name: 'Flujo Acumulado' },
                    { dataKey: 'flujoNeto', stroke: '#10b981', name: 'Flujo Neto Mensual' }
                  ]}
                  height={300}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Mes</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Ingresos</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Gastos</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Flujo Neto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlowData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.month}</td>
                        <td className="py-3 px-4 text-right text-green-600">€{item.ingresos.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-red-600">€{item.gastos.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            item.flujoNeto > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            €{item.flujoNeto.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">€{item.acumulado.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'ratios':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {financialRatios.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.categoria}</h3>
                  <div className="space-y-4">
                    {category.ratios.map((ratio, ratioIndex) => (
                      <div key={ratioIndex} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{ratio.nombre}</p>
                          <p className="text-sm text-gray-600">Benchmark: {ratio.benchmark}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{ratio.valor}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ratio.estado === 'excelente' 
                              ? 'bg-green-100 text-green-800' 
                              : ratio.estado === 'bueno'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ratio.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'budget':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Presupuesto vs Real
              </h2>
              <div className="mb-6">
                <BarChart
                  data={budgetVsActual}
                  bars={[
                    { dataKey: 'presupuesto', fill: '#6b7280', name: 'Presupuesto' },
                    { dataKey: 'actual', fill: '#3b82f6', name: 'Real' }
                  ]}
                  height={300}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Categoría</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Presupuesto</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Real</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Variación</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetVsActual.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 font-medium text-gray-900">{item.categoria}</td>
                        <td className="py-3 px-4 text-right">€{item.presupuesto.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">€{item.actual.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            item.variacion > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {item.variacion > 0 ? '+' : ''}{item.variacion.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.estado === 'normal' 
                              ? 'bg-green-100 text-green-800' 
                              : item.estado === 'ahorro'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.estado === 'normal' ? 'Normal' : 
                             item.estado === 'ahorro' ? 'Ahorro' : 'Exceso'}
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

      case 'payments':
        return (
          <div className="space-y-6">
            <FinancialExcelTabs />
          </div>
        );
      case 'history':
        return (
          <PaymentsHistory />
        );

      default:
        return null;
    }
  };

  return (
    <PageWrapper
      title="Módulo Financiero"
      subtitle="Análisis financiero completo, estados contables y ratios de rendimiento"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Financiero', href: '/financiero' }
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

