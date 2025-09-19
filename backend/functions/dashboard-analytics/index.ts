import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateUserRole, createErrorResponse, handleCorsPreflight } from '../../utils/validateUserRole.ts';

// ROLES CONFIGURATION
// Modify this array to control which roles can access this function
const allowedRoles = ['admin', 'manager', 'super_admin', 'user'];

interface AnalyticsRequest {
  module?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflight(req);
  if (preflightResponse) return preflightResponse;

  try {
    // STEP 1: VALIDATE USER AUTHENTICATION AND ROLE
    const validation = await validateUserRole(req, allowedRoles);
    if ('status' in validation) {
      return createErrorResponse(validation);
    }
    const { user } = validation;

    // STEP 2: EXECUTE MAIN LOGIC (only if authentication and role validation pass)

    // Initialize Supabase client for data operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Parse request body
    const { module, dateRange }: AnalyticsRequest = req.method === 'POST' ? await req.json() : {};

    // Default date range (last 30 days)
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch analytics data based on module
    const analytics: any = {
      kpis: [],
      charts: [],
      summary: {}
    };

    // Sales Analytics
    if (!module || module === 'sales') {
      const { data: salesData, error: salesError } = await supabaseClient
        .from('sales_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (!salesError && salesData) {
        const totalRevenue = salesData.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalQuantity = salesData.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const avgOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;

        analytics.kpis.push(
          {
            id: 'total_revenue',
            title: 'Ingresos Totales',
            value: totalRevenue,
            format: 'currency',
            icon: 'DollarSign',
            change: 12.5,
            changeType: 'increase'
          },
          {
            id: 'total_orders',
            title: 'Órdenes Totales',
            value: salesData.length,
            format: 'number',
            icon: 'ShoppingCart',
            change: 8.3,
            changeType: 'increase'
          },
          {
            id: 'avg_order_value',
            title: 'Valor Promedio',
            value: avgOrderValue,
            format: 'currency',
            icon: 'TrendingUp',
            change: -2.1,
            changeType: 'decrease'
          }
        );

        // Sales by category chart
        const categoryData = salesData.reduce((acc: any, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.revenue;
          return acc;
        }, {});

        analytics.charts.push({
          id: 'sales_by_category',
          title: 'Ventas por Categoría',
          type: 'pie',
          data: Object.entries(categoryData).map(([name, value]) => ({ name, value }))
        });

        // Sales trend chart
        const dailySales = salesData.reduce((acc: any, item) => {
          const date = item.date;
          acc[date] = (acc[date] || 0) + item.revenue;
          return acc;
        }, {});

        analytics.charts.push({
          id: 'sales_trend',
          title: 'Tendencia de Ventas',
          type: 'line',
          data: Object.entries(dailySales)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, revenue]) => ({ date, revenue }))
        });
      }
    }

    // Financial Analytics
    if (!module || module === 'financial') {
      const { data: financialData, error: financialError } = await supabaseClient
        .from('financial_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (!financialError && financialData) {
        const income = financialData
          .filter(item => item.type === 'income')
          .reduce((sum, item) => sum + (item.amount || 0), 0);
        
        const expenses = financialData
          .filter(item => item.type === 'expense')
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        const netProfit = income - expenses;

        analytics.kpis.push(
          {
            id: 'total_income',
            title: 'Ingresos',
            value: income,
            format: 'currency',
            icon: 'ArrowUp',
            change: 15.2,
            changeType: 'increase'
          },
          {
            id: 'total_expenses',
            title: 'Gastos',
            value: expenses,
            format: 'currency',
            icon: 'ArrowDown',
            change: 5.8,
            changeType: 'increase'
          },
          {
            id: 'net_profit',
            title: 'Beneficio Neto',
            value: netProfit,
            format: 'currency',
            icon: 'TrendingUp',
            change: 22.4,
            changeType: netProfit > 0 ? 'increase' : 'decrease'
          }
        );

        // Income vs Expenses chart
        analytics.charts.push({
          id: 'income_vs_expenses',
          title: 'Ingresos vs Gastos',
          type: 'bar',
          data: [
            { name: 'Ingresos', value: income },
            { name: 'Gastos', value: expenses },
            { name: 'Beneficio', value: netProfit }
          ]
        });
      }
    }

    // Marketing Analytics
    if (!module || module === 'marketing') {
      const { data: marketingData, error: marketingError } = await supabaseClient
        .from('marketing_data')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (!marketingError && marketingData) {
        const totalImpressions = marketingData.reduce((sum, item) => sum + (item.impressions || 0), 0);
        const totalClicks = marketingData.reduce((sum, item) => sum + (item.clicks || 0), 0);
        const totalCost = marketingData.reduce((sum, item) => sum + (item.cost || 0), 0);
        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        analytics.kpis.push(
          {
            id: 'total_impressions',
            title: 'Impresiones',
            value: totalImpressions,
            format: 'number',
            icon: 'Eye',
            change: 18.7,
            changeType: 'increase'
          },
          {
            id: 'click_through_rate',
            title: 'CTR',
            value: ctr,
            format: 'percentage',
            icon: 'MousePointer',
            change: 3.2,
            changeType: 'increase'
          },
          {
            id: 'marketing_cost',
            title: 'Costo Marketing',
            value: totalCost,
            format: 'currency',
            icon: 'CreditCard',
            change: -8.5,
            changeType: 'decrease'
          }
        );
      }
    }

    // CRM Analytics
    if (!module || module === 'crm') {
      const { data: crmData, error: crmError } = await supabaseClient
        .from('crm_data')
        .select('*')
        .eq('user_id', user.id);

      if (!crmError && crmData) {
        const totalClients = crmData.length;
        const activeClients = crmData.filter(client => client.status === 'customer').length;
        const totalValue = crmData.reduce((sum, client) => sum + (client.value || 0), 0);

        analytics.kpis.push(
          {
            id: 'total_clients',
            title: 'Total Clientes',
            value: totalClients,
            format: 'number',
            icon: 'Users',
            change: 12.3,
            changeType: 'increase'
          },
          {
            id: 'active_clients',
            title: 'Clientes Activos',
            value: activeClients,
            format: 'number',
            icon: 'UserCheck',
            change: 7.8,
            changeType: 'increase'
          },
          {
            id: 'pipeline_value',
            title: 'Valor Pipeline',
            value: totalValue,
            format: 'currency',
            icon: 'Target',
            change: 25.6,
            changeType: 'increase'
          }
        );

        // Client status distribution
        const statusData = crmData.reduce((acc: any, client) => {
          acc[client.status] = (acc[client.status] || 0) + 1;
          return acc;
        }, {});

        analytics.charts.push({
          id: 'client_status',
          title: 'Estado de Clientes',
          type: 'pie',
          data: Object.entries(statusData).map(([name, value]) => ({ name, value }))
        });
      }
    }

    analytics.summary = {
      totalKpis: analytics.kpis.length,
      totalCharts: analytics.charts.length,
      dateRange: { start: startDate, end: endDate },
      module: module || 'all'
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: analytics,
        message: 'Analytics data retrieved successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: true,
        message: 'Internal server error during analytics processing',
        context: { module: 'dashboard-analytics', payload: error.message }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

