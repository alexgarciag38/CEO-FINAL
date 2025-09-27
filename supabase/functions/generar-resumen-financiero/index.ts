// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function parseDate(d: string) { const [y,m,day] = d.split('-').map(Number); return new Date(y, m-1, day); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const meta: any = user.user_metadata || {};
    const role = meta.role || meta.app_role;
    if (role !== 'admin') return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { horizonte_dias = 30, fecha_actual } = await req.json().catch(() => ({}));
    const now = fecha_actual ? parseDate(fecha_actual) : new Date();
    const horizon = new Date(now.getTime() + horizonte_dias * 86400_000);

    // Obtener saldo inicial de caja
    const { data: configSaldo, error: configError } = await supabase
      .from('configuracion_global')
      .select('valor')
      .eq('clave', 'saldo_inicial_caja')
      .single();
    
    const saldoInicialCaja = configSaldo ? parseFloat(configSaldo.valor) || 0 : 0;

    const { data: movimientos, error } = await supabase
      .from('movimientos_financieros')
      .select('*');
    if (error) throw error;

    let ingresosPorVenir = 0; // Ingresos con fecha_programada en (now, horizon] y estado Registrado
    let pagosPorHacer = 0;     // Egresos con fecha_programada en (now, horizon] y estado Registrado
    let saldosVencidos = 0;    // Total vencido (ingresos+egresos) con fecha_programada < now y estado Registrado
    let vencidosPorCobrar = 0; // Ingresos vencidos
    let vencidosDebe = 0;      // Egresos vencidos
    let flujoProyectado = 0;   // Sumatoria neta: ingresos - egresos de Registrado y Completado dentro del horizonte

    for (const m of movimientos || []) {
      const tipo = m.tipo as 'Ingreso' | 'Egreso';
      const estado = m.estado as string;
      const monto = Number(m.monto) || 0;
      const fp = m.fecha_programada ? new Date(m.fecha_programada) : null;
      const fm = m.fecha_movimiento ? new Date(m.fecha_movimiento) : null;

      // Vencidos
      if (fp && fp < now && estado === 'Registrado') {
        if (tipo === 'Ingreso') { vencidosPorCobrar += monto; } else { vencidosDebe += monto; }
        saldosVencidos += monto;
      }

      // Por venir
      if (fp && fp > now && fp <= horizon && estado === 'Registrado') {
        if (tipo === 'Ingreso') ingresosPorVenir += monto; else pagosPorHacer += monto;
      }

      // Flujo proyectado (simple): considerar Registrado dentro de horizonte y Completado del período actual
      const withinHorizon = fm && fm <= horizon;
      if (withinHorizon && (estado === 'Registrado' || estado === 'Completado')) {
        flujoProyectado += tipo === 'Ingreso' ? monto : -monto;
      }
    }

    // Calcular dinero actual disponible (saldo inicial + flujo completado)
    let dineroActualDisponible = saldoInicialCaja;
    for (const m of movimientos || []) {
      const tipo = m.tipo as 'Ingreso' | 'Egreso';
      const estado = m.estado as string;
      const monto = Number(m.monto) || 0;
      
      if (estado === 'Completado') {
        dineroActualDisponible += tipo === 'Ingreso' ? monto : -monto;
      }
    }

    const resumen = {
      dineroActualDisponible,
      ingresosPorVenir,
      pagosPorHacer,
      flujoProyectado,
      saldosVencidos,
      vencidosPorCobrar,
      vencidosDebe
    };

    return new Response(JSON.stringify({ resumen }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


