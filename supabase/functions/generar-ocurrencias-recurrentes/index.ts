// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Función para calcular la siguiente fecha según la frecuencia
function calcularSiguienteFecha(
  fechaBase: Date, 
  frecuencia: string, 
  diaDelMes?: number, 
  diaDeLaSemana?: number
): Date {
  const siguiente = new Date(fechaBase);
  
  switch (frecuencia) {
    case 'Diaria':
      siguiente.setDate(siguiente.getDate() + 1);
      break;
      
    case 'Semanal':
      siguiente.setDate(siguiente.getDate() + 7);
      if (diaDeLaSemana !== undefined) {
        // Ajustar al día de la semana específico
        const diasHastaDia = (diaDeLaSemana - siguiente.getDay() + 7) % 7;
        siguiente.setDate(siguiente.getDate() + diasHastaDia);
      }
      break;
      
    case 'Mensual':
      siguiente.setMonth(siguiente.getMonth() + 1);
      if (diaDelMes) {
        siguiente.setDate(diaDelMes);
      }
      break;
      
    case 'Trimestral':
      siguiente.setMonth(siguiente.getMonth() + 3);
      if (diaDelMes) {
        siguiente.setDate(diaDelMes);
      }
      break;
      
    case 'Semestral':
      siguiente.setMonth(siguiente.getMonth() + 6);
      if (diaDelMes) {
        siguiente.setDate(diaDelMes);
      }
      break;
      
    case 'Anual':
      siguiente.setFullYear(siguiente.getFullYear() + 1);
      if (diaDelMes) {
        siguiente.setDate(diaDelMes);
      }
      break;
      
    default:
      siguiente.setDate(siguiente.getDate() + 1);
  }
  
  return siguiente;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    // Esta función puede ser llamada por un cron job o manualmente
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Usar service role para acceso completo
    );

    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 60); // Generar para los próximos 60 días

    // Obtener todas las reglas recurrentes activas
    const { data: reglas, error: reglasError } = await supabase
      .from('movimientos_recurrentes')
      .select('*')
      .eq('activo', true)
      .lte('fecha_inicio_serie', fechaLimite.toISOString().split('T')[0])
      .or(`fecha_fin_serie.is.null,fecha_fin_serie.gte.${hoy.toISOString().split('T')[0]}`);

    if (reglasError) throw reglasError;

    const movimientosGenerados = [];
    const errores = [];

    for (const regla of reglas || []) {
      try {
        // Calcular las fechas para generar movimientos
        const fechasParaGenerar = [];
        let fechaActual = new Date(regla.fecha_inicio_serie);
        
        // Si la fecha de inicio es futura, empezar desde ahí
        if (fechaActual > hoy) {
          fechasParaGenerar.push(new Date(fechaActual));
        }
        
        // Generar fechas hasta el límite
        while (fechaActual <= fechaLimite) {
          const siguienteFecha = calcularSiguienteFecha(
            fechaActual, 
            regla.frecuencia, 
            regla.dia_del_mes, 
            regla.dia_de_la_semana
          );
          
          if (siguienteFecha <= fechaLimite) {
            fechasParaGenerar.push(new Date(siguienteFecha));
            fechaActual = siguienteFecha;
          } else {
            break;
          }
        }

        // Verificar si ya existen movimientos para estas fechas
        for (const fecha of fechasParaGenerar) {
          const { data: movimientosExistentes } = await supabase
            .from('movimientos_financieros')
            .select('id')
            .eq('usuario_id', regla.usuario_id)
            .eq('tipo', regla.tipo)
            .eq('monto', regla.monto)
            .eq('fecha_programada', fecha.toISOString().split('T')[0])
            .limit(1);

          // Solo crear si no existe ya
          if (!movimientosExistentes || movimientosExistentes.length === 0) {
            const movimientoNuevo = {
              usuario_id: regla.usuario_id,
              tipo: regla.tipo,
              categoria_id: regla.categoria_id,
              subcategoria_id: regla.subcategoria_id,
              proveedor_cliente: regla.proveedor_cliente,
              descripcion: regla.descripcion,
              monto: regla.monto,
              fecha_movimiento: fecha.toISOString().split('T')[0],
              fecha_programada: fecha.toISOString().split('T')[0],
              forma_pago: regla.forma_pago,
              fiscal: regla.fiscal,
              notas: regla.notas,
              estado: 'Registrado',
              origen: 'recurrente', // Marcar como movimiento recurrente
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: movimientoInsertado, error: insertError } = await supabase
              .from('movimientos_financieros')
              .insert(movimientoNuevo)
              .select()
              .single();

            if (insertError) {
              errores.push({
                regla_id: regla.id,
                fecha: fecha.toISOString().split('T')[0],
                error: insertError.message
              });
            } else {
              movimientosGenerados.push(movimientoInsertado);
            }
          }
        }
      } catch (reglaError: any) {
        errores.push({
          regla_id: regla.id,
          error: reglaError.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      movimientos_generados: movimientosGenerados.length,
      errores: errores.length,
      detalles_errores: errores,
      fecha_procesamiento: hoy.toISOString()
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (e: any) {
    console.error('Error en generar-ocurrencias-recurrentes:', e);
    
    return new Response(JSON.stringify({ 
      error: 'Error interno', 
      details: String(e?.message || e) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});








