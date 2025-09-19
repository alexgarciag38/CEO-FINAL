import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) throw new Error('Falta autenticación')

    const { mes, anio, tipoComparacion } = await req.json()
    
    if (!mes || !anio || !tipoComparacion) {
      throw new Error('mes, anio y tipoComparacion son requeridos')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Obtener datos del período actual
    const { data: datosActuales, error: errorActual } = await supabase
      .from('ventas_historico')
      .select('datos')
      .eq('mes', mes)
      .eq('anio', anio)
      .order('fecha_carga', { ascending: false })
      .limit(1)
      .single()

    if (errorActual || !datosActuales) {
      throw new Error('No se encontraron datos para el período actual')
    }

    let datosComparacion = null
    let periodoComparacion = null

    // Calcular período de comparación
    if (tipoComparacion === 'mes_anterior') {
      let mesAnterior = mes - 1
      let anioAnterior = anio
      
      if (mesAnterior === 0) {
        mesAnterior = 12
        anioAnterior = anio - 1
      }
      
      periodoComparacion = { mes: mesAnterior, anio: anioAnterior }
      
      const { data: datosAnterior } = await supabase
        .from('ventas_historico')
        .select('datos')
        .eq('mes', mesAnterior)
        .eq('anio', anioAnterior)
        .order('fecha_carga', { ascending: false })
        .limit(1)
        .single()
      
      datosComparacion = datosAnterior
      
    } else if (tipoComparacion === 'anio_anterior') {
      const anioAnterior = anio - 1
      periodoComparacion = { mes, anio: anioAnterior }
      
      const { data: datosAnterior } = await supabase
        .from('ventas_historico')
        .select('datos')
        .eq('mes', mes)
        .eq('anio', anioAnterior)
        .order('fecha_carga', { ascending: false })
        .limit(1)
        .single()
      
      datosComparacion = datosAnterior
    }

    // Calcular comparaciones
    const comparaciones = calcularComparaciones(datosActuales.datos, datosComparacion, tipoComparacion)

    return new Response(
      JSON.stringify({
        comparaciones,
        periodoActual: { mes, anio },
        periodoComparacion,
        tieneComparacion: !!datosComparacion
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en comparar-ventas:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calcularComparaciones(datosActuales: any, datosComparacion: any, tipoComparacion: string) {
  if (!datosComparacion) {
    return {
      ventasTotales: { actual: datosActuales.kpis?.ventasTotales || 0, anterior: 0, variacion: 0 },
      unidadesVendidas: { actual: datosActuales.kpis?.unidadesVendidas || 0, anterior: 0, variacion: 0 },
      margenBruto: { actual: datosActuales.kpis?.margenBruto || 0, anterior: 0, variacion: 0 },
      totalPedidos: { actual: datosActuales.kpis?.totalPedidos || 0, anterior: 0, variacion: 0 },
      ventasMostrador: { actual: datosActuales.kpis?.ventasMostrador || 0, anterior: 0, variacion: 0 },
      ventasConAgente: { actual: datosActuales.kpis?.ventasConAgente || 0, anterior: 0, variacion: 0 }
    }
  }

  const actual = datosActuales.kpis || {}
  const anterior = datosComparacion.kpis || {}

  const calcularVariacion = (actual: number, anterior: number) => {
    if (anterior === 0) return actual > 0 ? 100 : 0
    return ((actual - anterior) / anterior) * 100
  }

  return {
    ventasTotales: {
      actual: actual.ventasTotales || 0,
      anterior: anterior.ventasTotales || 0,
      variacion: calcularVariacion(actual.ventasTotales || 0, anterior.ventasTotales || 0)
    },
    unidadesVendidas: {
      actual: actual.unidadesVendidas || 0,
      anterior: anterior.unidadesVendidas || 0,
      variacion: calcularVariacion(actual.unidadesVendidas || 0, anterior.unidadesVendidas || 0)
    },
    margenBruto: {
      actual: actual.margenBruto || 0,
      anterior: anterior.margenBruto || 0,
      variacion: calcularVariacion(actual.margenBruto || 0, anterior.margenBruto || 0)
    },
    totalPedidos: {
      actual: actual.totalPedidos || 0,
      anterior: anterior.totalPedidos || 0,
      variacion: calcularVariacion(actual.totalPedidos || 0, anterior.totalPedidos || 0)
    },
    ventasMostrador: {
      actual: actual.ventasMostrador || 0,
      anterior: anterior.ventasMostrador || 0,
      variacion: calcularVariacion(actual.ventasMostrador || 0, anterior.ventasMostrador || 0)
    },
    ventasConAgente: {
      actual: actual.ventasConAgente || 0,
      anterior: anterior.ventasConAgente || 0,
      variacion: calcularVariacion(actual.ventasConAgente || 0, anterior.ventasConAgente || 0)
    }
  }
} 