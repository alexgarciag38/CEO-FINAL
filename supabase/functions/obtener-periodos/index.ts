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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Obtener todos los períodos disponibles
    const { data: periodos, error } = await supabase
      .from('ventas_historico')
      .select('mes, anio, fecha_carga')
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })

    if (error) throw error

    // Agrupar por año y mes
    const periodosAgrupados = periodos.reduce((acc: any, periodo) => {
      const { anio, mes } = periodo
      if (!acc[anio]) {
        acc[anio] = []
      }
      if (!acc[anio].includes(mes)) {
        acc[anio].push(mes)
      }
      return acc
    }, {})

    // Convertir a array ordenado
    const periodosDisponibles = Object.keys(periodosAgrupados)
      .map(anio => ({
        anio: parseInt(anio),
        meses: periodosAgrupados[anio].sort((a: number, b: number) => b - a)
      }))
      .sort((a, b) => b.anio - a.anio)

    // Obtener período más reciente
    const periodoMasReciente = periodosDisponibles.length > 0 
      ? { 
          anio: periodosDisponibles[0].anio, 
          mes: periodosDisponibles[0].meses[0] 
        }
      : null

    return new Response(
      JSON.stringify({
        periodosDisponibles,
        periodoMasReciente
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error en obtener-periodos:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 