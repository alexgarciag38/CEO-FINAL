import React, { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { KPIGrid } from '@/components/ui/KPICard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { 
  generateMainKPIs, 
  generateFinancialKPIs,
  generateSalesData,
  generateCategoryData,
  generateRegionalData,
  generateQuarterlyData,
  generateCustomerData,
  generateRecentActivities,
  generateTopProducts,
  generatePerformanceTrends
} from '@/data/mockData';
import { 
  RefreshCw, 
  Download, 
  Filter,
  Calendar,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  FileText,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('12m');
  
  // Data state
  const [mainKPIs] = useState(generateMainKPIs());
  const [financialKPIs] = useState(generateFinancialKPIs());
  const [salesData] = useState(generateSalesData());
  const [categoryData] = useState(generateCategoryData());
  const [regionalData] = useState(generateRegionalData());
  const [quarterlyData] = useState(generateQuarterlyData());
  const [customerData] = useState(generateCustomerData());
  const [recentActivities] = useState(generateRecentActivities());
  const [topProducts] = useState(generateTopProducts());
  const [performanceTrends] = useState(generatePerformanceTrends());

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    // Simulate export functionality
    console.log('Exporting dashboard data...');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale': return ShoppingCart;
      case 'customer': return UserPlus;
      case 'alert': return AlertTriangle;
      case 'payment': return CreditCard;
      case 'report': return FileText;
      default: return FileText;
    }
  };

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <PageWrapper
      title="Dashboard Ejecutivo"
      subtitle="Resumen general de métricas y KPIs empresariales"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' }
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
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Main KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Métricas Principales
          </h2>
          <KPIGrid kpis={mainKPIs} columns={3} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tendencia de Ventas
              </h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <LineChart
              data={salesData}
              lines={[
                { dataKey: 'ingresos', stroke: '#2563eb', name: 'Ingresos (€)' }
              ]}
              height={280}
            />
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Distribución por Categoría
              </h3>
              <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
            </div>
            <PieChart
              data={categoryData}
              height={280}
              innerRadius={60}
            />
          </div>
        </div>

        {/* Financial KPIs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Métricas Financieras
          </h2>
          <KPIGrid kpis={financialKPIs} columns={4} size="sm" />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regional Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rendimiento Regional
            </h3>
            <BarChart
              data={regionalData}
              bars={[
                { dataKey: 'ventas', fill: '#2563eb', name: 'Ventas (€)' }
              ]}
              height={250}
              showLegend={false}
            />
          </div>

          {/* Quarterly Comparison */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comparación Trimestral
            </h3>
            <BarChart
              data={quarterlyData}
              bars={[
                { dataKey: 'actual', fill: '#10b981', name: 'Actual' },
                { dataKey: 'objetivo', fill: '#e5e7eb', name: 'Objetivo' }
              ]}
              height={250}
            />
          </div>

          {/* Customer Acquisition */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adquisición de Clientes
            </h3>
            <AreaChart
              data={customerData}
              areas={[
                { dataKey: 'nuevos', stroke: '#2563eb', fill: '#2563eb', name: 'Nuevos' },
                { dataKey: 'recurrentes', stroke: '#10b981', fill: '#10b981', name: 'Recurrentes' }
              ]}
              height={250}
              stacked={true}
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Actividad Reciente
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Ver todas
              </button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivities.map((activity) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.color)}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(activity.timestamp, { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Productos Top
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-700">
                Ver análisis completo
              </button>
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.unidades} unidades
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      €{product.ventas.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">
                      {product.margen}% margen
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Resumen de Rendimiento
              </h3>
              <p className="text-sm text-gray-600">
                Tendencias semanales del mes actual
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                +18.5%
              </p>
              <p className="text-sm text-gray-600">
                vs. mes anterior
              </p>
            </div>
          </div>
          <LineChart
            data={performanceTrends}
            lines={[
              { dataKey: 'ventas', stroke: '#2563eb', name: 'Ventas' },
              { dataKey: 'visitas', stroke: '#10b981', name: 'Visitas' },
              { dataKey: 'leads', stroke: '#f59e0b', name: 'Leads' }
            ]}
            height={200}
            showGrid={false}
          />
        </div>
      </div>
    </PageWrapper>
  );
};

