import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ABCAnalysisRequest {
  dateRange?: {
    start: string;
    end: string;
  };
}

interface ABCItem {
  product: string;
  revenue: number;
  percentage: number;
  cumulativePercentage: number;
  category: 'A' | 'B' | 'C';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: true, message: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          error: true, 
          message: 'Invalid authentication',
          context: { module: 'abc-analysis', payload: userError }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { dateRange }: ABCAnalysisRequest = req.method === 'POST' ? await req.json() : {};

    // Default date range (last 90 days for better ABC analysis)
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
    const startDate = dateRange?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch sales data
    const { data: salesData, error: salesError } = await supabaseClient
      .from('sales_data')
      .select('product, revenue, quantity')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (salesError) {
      return new Response(
        JSON.stringify({
          error: true,
          message: 'Failed to fetch sales data',
          context: { module: 'abc-analysis', payload: salesError }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!salesData || salesData.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            analysis: [],
            summary: {
              totalProducts: 0,
              totalRevenue: 0,
              categoryA: { count: 0, revenue: 0, percentage: 0 },
              categoryB: { count: 0, revenue: 0, percentage: 0 },
              categoryC: { count: 0, revenue: 0, percentage: 0 }
            }
          },
          message: 'No sales data found for the specified date range'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate revenue by product
    const productRevenue = salesData.reduce((acc: Record<string, number>, item) => {
      acc[item.product] = (acc[item.product] || 0) + (item.revenue || 0);
      return acc;
    }, {});

    // Convert to array and sort by revenue (descending)
    const sortedProducts = Object.entries(productRevenue)
      .map(([product, revenue]) => ({ product, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Calculate total revenue
    const totalRevenue = sortedProducts.reduce((sum, item) => sum + item.revenue, 0);

    // Calculate ABC analysis
    const abcAnalysis: ABCItem[] = [];
    let cumulativeRevenue = 0;

    sortedProducts.forEach((item) => {
      cumulativeRevenue += item.revenue;
      const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
      const cumulativePercentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;

      // Determine ABC category
      let category: 'A' | 'B' | 'C';
      if (cumulativePercentage <= 80) {
        category = 'A';
      } else if (cumulativePercentage <= 95) {
        category = 'B';
      } else {
        category = 'C';
      }

      abcAnalysis.push({
        product: item.product,
        revenue: item.revenue,
        percentage: Math.round(percentage * 100) / 100,
        cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
        category
      });
    });

    // Calculate summary statistics
    const categoryA = abcAnalysis.filter(item => item.category === 'A');
    const categoryB = abcAnalysis.filter(item => item.category === 'B');
    const categoryC = abcAnalysis.filter(item => item.category === 'C');

    const summary = {
      totalProducts: abcAnalysis.length,
      totalRevenue,
      dateRange: { start: startDate, end: endDate },
      categoryA: {
        count: categoryA.length,
        revenue: categoryA.reduce((sum, item) => sum + item.revenue, 0),
        percentage: Math.round((categoryA.reduce((sum, item) => sum + item.revenue, 0) / totalRevenue) * 10000) / 100
      },
      categoryB: {
        count: categoryB.length,
        revenue: categoryB.reduce((sum, item) => sum + item.revenue, 0),
        percentage: Math.round((categoryB.reduce((sum, item) => sum + item.revenue, 0) / totalRevenue) * 10000) / 100
      },
      categoryC: {
        count: categoryC.length,
        revenue: categoryC.reduce((sum, item) => sum + item.revenue, 0),
        percentage: Math.round((categoryC.reduce((sum, item) => sum + item.revenue, 0) / totalRevenue) * 10000) / 100
      }
    };

    // Generate insights
    const insights = [];
    
    if (summary.categoryA.percentage > 85) {
      insights.push("Concentración muy alta en productos A. Considere diversificar el portafolio.");
    }
    
    if (summary.categoryC.count > summary.totalProducts * 0.5) {
      insights.push("Muchos productos de baja contribución. Evalúe discontinuar productos C de bajo rendimiento.");
    }
    
    if (summary.categoryA.count < 5) {
      insights.push("Pocos productos estrella. Considere invertir más en productos A para maximizar ingresos.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          analysis: abcAnalysis,
          summary,
          insights,
          chartData: {
            categoryDistribution: [
              { name: 'Categoría A', value: summary.categoryA.count, revenue: summary.categoryA.revenue },
              { name: 'Categoría B', value: summary.categoryB.count, revenue: summary.categoryB.revenue },
              { name: 'Categoría C', value: summary.categoryC.count, revenue: summary.categoryC.revenue }
            ],
            revenueDistribution: [
              { name: 'Categoría A', value: summary.categoryA.percentage },
              { name: 'Categoría B', value: summary.categoryB.percentage },
              { name: 'Categoría C', value: summary.categoryC.percentage }
            ]
          }
        },
        message: 'ABC analysis completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: true,
        message: 'Internal server error during ABC analysis',
        context: { module: 'abc-analysis', payload: error.message }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

