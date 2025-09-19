import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateUserRole } from '../../utils/validateUserRole.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComparacionVentas {
  periodo1: {
    mes: number;
    anio: number;
    kpis: {
      ventasTotales: number;
      margenBruto: number;
      margenNeto: number;
      totalPedidos: number;
      carteraVencida: number;
    };
    rankingABC: {
      A: string[];
      B: string[];
      C: string[];
    };
    rendimientoAgentes: Array<{
      agente: string;
      ventas: number;
      margen: number;
    }>;
  };
  periodo2: {
    mes: number;
    anio: number;
    kpis: {
      ventasTotales: number;
      margenBruto: number;
      margenNeto: number;
      totalPedidos: number;
      carteraVencida: number;
    };
    rankingABC: {
      A: string[];
      B: string[];
      C: string[];
    };
    rendimientoAgentes: Array<{
      agente: string;
      ventas: number;
      margen: number;
    }>;
  };
  diferencias: {
    ventasTotales: {
      absoluta: number;
      porcentual: number;
      tendencia: 'incremento' | 'decremento' | 'sin_cambio';
    };
    margenBruto: {
      absoluta: number;
      porcentual: number;
      tendencia: 'incremento' | 'decremento' | 'sin_cambio';
    };
    margenNeto: {
      absoluta: number;
      porcentual: number;
      tendencia: 'incremento' | 'decremento' | 'sin_cambio';
    };
    totalPedidos: {
      absoluta: number;
      porcentual: number;
      tendencia: 'incremento' | 'decremento' | 'sin_cambio';
    };
    carteraVencida: {
      absoluta: number;
      porcentual: number;
      tendencia: 'incremento' | 'decremento' | 'sin_cambio';
    };
    cambiosABC: {
      productosNuevosA: string[];
      productosSalidosA: string[];
      productosNuevosB: string[];
      productosSalidosB: string[];
      productosNuevosC: string[];
      productosSalidosC: string[];
    };
    cambiosAgentes: Array<{
      agente: string;
      cambioVentas: number;
      cambioVentasPct: number;
      cambioMargen: number;
      cambioMargenPct: number;
      tendencia: 'mejora' | 'deterioro' | 'sin_cambio';
    }>;
  };
}

// Helper function to calculate differences
function calcularDiferencias(valor1: number, valor2: number) {
  const absoluta = valor2 - valor1;
  const porcentual = valor1 > 0 ? (absoluta / valor1) * 100 : 0;
  let tendencia: 'incremento' | 'decremento' | 'sin_cambio';
  
  if (Math.abs(porcentual) < 0.1) {
    tendencia = 'sin_cambio';
  } else if (porcentual > 0) {
    tendencia = 'incremento';
  } else {
    tendencia = 'decremento';
  }
  
  return { absoluta, porcentual, tendencia };
}

// Helper function to compare ABC rankings
function compararRankingABC(ranking1: any, ranking2: any) {
  const productos1A = new Set(ranking1.A.map((p: any) => p.producto));
  const productos1B = new Set(ranking1.B.map((p: any) => p.producto));
  const productos1C = new Set(ranking1.C.map((p: any) => p.producto));
  
  const productos2A = new Set(ranking2.A.map((p: any) => p.producto));
  const productos2B = new Set(ranking2.B.map((p: any) => p.producto));
  const productos2C = new Set(ranking2.C.map((p: any) => p.producto));
  
  return {
    productosNuevosA: Array.from(productos2A).filter(p => !productos1A.has(p)),
    productosSalidosA: Array.from(productos1A).filter(p => !productos2A.has(p)),
    productosNuevosB: Array.from(productos2B).filter(p => !productos1B.has(p)),
    productosSalidosB: Array.from(productos1B).filter(p => !productos2B.has(p)),
    productosNuevosC: Array.from(productos2C).filter(p => !productos1C.has(p)),
    productosSalidosC: Array.from(productos1C).filter(p => !productos2C.has(p))
  };
}

// Helper function to compare agent performance
function compararRendimientoAgentes(agentes1: any[], agentes2: any[]) {
  const agentes1Map = new Map(agentes1.map(a => [a.agente, a]));
  const agentes2Map = new Map(agentes2.map(a => [a.agente, a]));
  
  const todosAgentes = new Set([...agentes1Map.keys(), ...agentes2Map.keys()]);
  
  return Array.from(todosAgentes).map(agente => {
    const agente1 = agentes1Map.get(agente) || { ventas: 0, margen: 0 };
    const agente2 = agentes2Map.get(agente) || { ventas: 0, margen: 0 };
    
    const cambioVentas = agente2.ventas - agente1.ventas;
    const cambioVentasPct = agente1.ventas > 0 ? (cambioVentas / agente1.ventas) * 100 : 0;
    const cambioMargen = agente2.margen - agente1.margen;
    const cambioMargenPct = agente1.margen > 0 ? (cambioMargen / agente1.margen) * 100 : 0;
    
    let tendencia: 'mejora' | 'deterioro' | 'sin_cambio';
    if (Math.abs(cambioVentasPct) < 1 && Math.abs(cambioMargenPct) < 1) {
      tendencia = 'sin_cambio';
    } else if (cambioVentasPct > 0 && cambioMargenPct > 0) {
      tendencia = 'mejora';
    } else {
      tendencia = 'deterioro';
    }
    
    return {
      agente,
      cambioVentas,
      cambioVentasPct,
      cambioMargen,
      cambioMargenPct,
      tendencia
    };
  });
}

// FUNCIÓN SIMPLIFICADA SIN VALIDACIÓN
async function validateUserRole(req: Request, allowedRoles: string[]) {
  // TEMPORAL: SIN VALIDACIÓN
  return { user: { id: 'temp-user', email: 'alexgarciag38@gmail.com' } };
}

Deno.serve(async (req: Request) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // TEMPORAL: SIN VALIDACIÓN
    const user = { id: 'temp-user', email: 'alexgarciag38@gmail.com' };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        error: 'Error de configuración',
        message: 'Missing Supabase configuration'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse request body
    const body = await req.json();
    const { mes1, anio1, mes2, anio2 } = body;

    // Validate input
    if (!mes1 || !anio1 || !mes2 || !anio2) {
      return new Response(JSON.stringify({
        error: 'Datos incompletos',
        message: 'Se requieren mes1, anio1, mes2, anio2'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (mes1 < 1 || mes1 > 12 || mes2 < 1 || mes2 > 12) {
      return new Response(JSON.stringify({
        error: 'Mes inválido',
        message: 'Los meses deben estar entre 1 y 12'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (anio1 < 2020 || anio2 < 2020) {
      return new Response(JSON.stringify({
        error: 'Año inválido',
        message: 'Los años deben ser 2020 o posteriores'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch data for both periods
    const { data: data1, error: error1 } = await supabase
      .from('ventas_historico')
      .select('datos')
      .eq('mes', mes1)
      .eq('anio', anio1)
      .eq('usuario_id', user.id)
      .single();

    const { data: data2, error: error2 } = await supabase
      .from('ventas_historico')
      .select('datos')
      .eq('mes', mes2)
      .eq('anio', anio2)
      .eq('usuario_id', user.id)
      .single();

    if (error1 || !data1) {
      return new Response(JSON.stringify({
        error: 'Datos no encontrados',
        message: `No se encontraron datos para ${mes1}/${anio1}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (error2 || !data2) {
      return new Response(JSON.stringify({
        error: 'Datos no encontrados',
        message: `No se encontraron datos para ${mes2}/${anio2}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const analisis1 = data1.datos;
    const analisis2 = data2.datos;

    // Prepare period 1 data
    const periodo1 = {
      mes: mes1,
      anio: anio1,
      kpis: {
        ventasTotales: analisis1.kpis.ventasTotales,
        margenBruto: analisis1.kpis.margenBruto,
        margenNeto: analisis1.kpis.margenNeto,
        totalPedidos: analisis1.kpis.totalPedidos,
        carteraVencida: analisis1.kpis.carteraVencida
      },
      rankingABC: {
        A: analisis1.rankingABC.A.map((p: any) => p.producto),
        B: analisis1.rankingABC.B.map((p: any) => p.producto),
        C: analisis1.rankingABC.C.map((p: any) => p.producto)
      },
      rendimientoAgentes: analisis1.rendimientoAgentes.map((a: any) => ({
        agente: a.agente,
        ventas: a.ventas,
        margen: a.margen
      }))
    };

    // Prepare period 2 data
    const periodo2 = {
      mes: mes2,
      anio: anio2,
      kpis: {
        ventasTotales: analisis2.kpis.ventasTotales,
        margenBruto: analisis2.kpis.margenBruto,
        margenNeto: analisis2.kpis.margenNeto,
        totalPedidos: analisis2.kpis.totalPedidos,
        carteraVencida: analisis2.kpis.carteraVencida
      },
      rankingABC: {
        A: analisis2.rankingABC.A.map((p: any) => p.producto),
        B: analisis2.rankingABC.B.map((p: any) => p.producto),
        C: analisis2.rankingABC.C.map((p: any) => p.producto)
      },
      rendimientoAgentes: analisis2.rendimientoAgentes.map((a: any) => ({
        agente: a.agente,
        ventas: a.ventas,
        margen: a.margen
      }))
    };

    // Calculate differences
    const diferencias = {
      ventasTotales: calcularDiferencias(periodo1.kpis.ventasTotales, periodo2.kpis.ventasTotales),
      margenBruto: calcularDiferencias(periodo1.kpis.margenBruto, periodo2.kpis.margenBruto),
      margenNeto: calcularDiferencias(periodo1.kpis.margenNeto, periodo2.kpis.margenNeto),
      totalPedidos: calcularDiferencias(periodo1.kpis.totalPedidos, periodo2.kpis.totalPedidos),
      carteraVencida: calcularDiferencias(periodo1.kpis.carteraVencida, periodo2.kpis.carteraVencida),
      cambiosABC: compararRankingABC(analisis1.rankingABC, analisis2.rankingABC),
      cambiosAgentes: compararRendimientoAgentes(periodo1.rendimientoAgentes, periodo2.rendimientoAgentes)
    };

    // Create comparison result
    const comparacion: ComparacionVentas = {
      periodo1,
      periodo2,
      diferencias
    };

    // Log successful comparison
    console.log(`[VENTAS COMPARISON] Usuario: ${user.email} - Período 1: ${mes1}/${anio1} - Período 2: ${mes2}/${anio2} - Fecha: ${new Date().toISOString()}`);

    return new Response(JSON.stringify(comparacion), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error comparing sales data:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado al comparar los datos'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 