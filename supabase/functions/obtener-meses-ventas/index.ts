import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'get_available_months' | 'get_month_data'
  mes?: number
  anio?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Crear cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar rol del usuario (más permisivo para usuarios con datos)
    const userRole = user.user_metadata?.role || user.app_metadata?.role
    
    // Si el usuario tiene un rol específico, validarlo
    if (userRole && !['admin', 'colaborador'].includes(userRole)) {
      return new Response(
        JSON.stringify({ error: 'Permisos insuficientes' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Si no tiene rol definido, permitir acceso si tiene datos históricos
    // Esto permite a usuarios existentes acceder a sus propios datos

    const { action, mes, anio }: RequestBody = await req.json()

    if (action === 'get_available_months') {
      // Obtener todos los meses disponibles con datos procesados
      const { data, error } = await supabaseClient
        .from('ventas_historico')
        .select('mes, anio, fecha_carga')
        .eq('usuario_id', user.id)
        .order('anio', { ascending: false })
        .order('mes', { ascending: false })

      if (error) {
        console.error('Error al obtener meses disponibles:', error)
        return new Response(
          JSON.stringify({ error: 'Error al obtener meses disponibles' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Formatear los meses disponibles
      const mesesDisponibles = data.map(item => ({
        mes: item.mes,
        anio: item.anio,
        fecha_carga: item.fecha_carga,
        label: `${getNombreMes(item.mes)} ${item.anio}`
      }))

      return new Response(
        JSON.stringify({ 
          success: true, 
          meses: mesesDisponibles,
          total: mesesDisponibles.length
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (action === 'get_month_data') {
      // Validar parámetros requeridos
      if (!mes || !anio) {
        return new Response(
          JSON.stringify({ error: 'Mes y año son requeridos' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validar rango de mes y año
      if (mes < 1 || mes > 12 || anio < 2020 || anio > new Date().getFullYear()) {
        return new Response(
          JSON.stringify({ error: 'Mes o año inválido' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Obtener datos del mes específico
      const { data, error } = await supabaseClient
        .from('ventas_historico')
        .select('mes, anio, datos, fecha_carga')
        .eq('usuario_id', user.id)
        .eq('mes', mes)
        .eq('anio', anio)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'No hay datos disponibles para este período' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        console.error('Error al obtener datos del mes:', error)
        return new Response(
          JSON.stringify({ error: 'Error al obtener datos del período' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          mes: data.mes,
          anio: data.anio,
          datos: data.datos,
          fecha_carga: data.fecha_carga,
          label: `${getNombreMes(data.mes)} ${data.anio}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Acción no válida' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error en la función:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Función auxiliar para obtener el nombre del mes
function getNombreMes(mes: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes - 1] || ''
}
